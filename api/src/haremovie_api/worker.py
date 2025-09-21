import os
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI
from google.cloud import storage
from google.genai import types
from loguru import logger
from sqlmodel import Session
from vertexai import agent_engines
from vertexai.agent_engines import AgentEngine

from haremovie_api.db import get_session, save_task_result, upsert_task
from haremovie_api.models import Task, TaskResult, TaskStatus
from haremovie_api.requests import RunTaskRequest
from haremovie_api.storage import download_artifact, get_storage_client

app = FastAPI()


def get_ai_agent():
    resource_name = os.getenv("GOOGLE_AGENT_ENGINE_RESOURCE_NAME")
    try:
        adk_app = agent_engines.get(resource_name)
        return adk_app
    except Exception as e:
        logger.error(f"Error getting AI agent: {e}")
        raise


@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}


@app.get("/health")
async def health():
    return {"message": "OK"}


@app.post("/tasks/run/{task_id}")
async def run_task(
    task_id: UUID,
    request: RunTaskRequest,
    adk_app: AgentEngine = Depends(get_ai_agent),
    storage_client: storage.Client = Depends(get_storage_client),
    db: Session = Depends(get_session),
):
    try:
        session = adk_app.create_session(user_id="test_user_001")
        character_image_data, character_image_mime_type = download_artifact(
            storage_client, request.character_image.url
        )
        dress_image_data, dress_image_mime_type = download_artifact(
            storage_client, request.dress_image.url
        )
        background_image_data, background_image_mime_type = download_artifact(
            storage_client, request.background_image.url
        )
    except Exception as e:
        logger.error(f"Failed to download input artifacts: {e}")
        raise
    parts = [
        types.Part.from_text(
            text="与えられた画像をもとに、結婚式の動画を作成してください。"
        ).model_dump(mode="json", by_alias=True),
        types.Part.from_bytes(
            data=character_image_data,
            mime_type=character_image_mime_type,
        ).model_dump(mode="json", by_alias=True),
        types.Part.from_bytes(
            data=dress_image_data,
            mime_type=dress_image_mime_type,
        ).model_dump(mode="json", by_alias=True),
        types.Part.from_bytes(
            data=background_image_data,
            mime_type=background_image_mime_type,
        ).model_dump(mode="json", by_alias=True),
    ]
    task = None
    try:
        video_url = None
        task = upsert_task(db, Task(id=task_id, status=TaskStatus.PROCESSING))
        current_step = 0
        total_steps = 8
        for event in adk_app.stream_query(
            user_id="test_user_001",
            session_id=session["id"],
            message={"role": "user", "parts": parts},
        ):
            logger.info(event)
            parts = event["content"]["parts"]
            for part in parts:
                if (
                    "function_response" in part
                    and part["function_response"].get("name") == "generate_video"
                ):
                    video_url = part["function_response"]["response"].get("video_url")
                current_step += 1
                upsert_task(
                    db,
                    Task(
                        id=task.id,
                        status=TaskStatus.PROCESSING,
                        progress=min(100, int(current_step / total_steps * 100)),
                    ),
                )
        if video_url:
            upsert_task(db, Task(id=task.id, status=TaskStatus.COMPLETED))
            save_task_result(
                db, TaskResult(id=uuid4(), task_id=task.id, result_video_url=video_url)
            )
            return {"session_id": session["id"]}
        else:
            upsert_task(db, Task(id=task.id, status=TaskStatus.FAILED))
            raise Exception("Failed to generate video")
    except Exception as e:
        logger.error(f"Error running task: {e}")
        if task:
            upsert_task(db, Task(id=task.id, status=TaskStatus.FAILED))
        raise
