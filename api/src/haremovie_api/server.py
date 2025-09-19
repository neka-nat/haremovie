import os
from uuid import uuid4

import grpc
from fastapi import Depends, FastAPI, HTTPException
from google.cloud import storage, tasks_v2
from google.cloud.tasks_v2 import CloudTasksGrpcTransport
from google.protobuf import duration_pb2
from loguru import logger
from sqlmodel import Session, select

from haremovie_api.db import get_session
from haremovie_api.models import Task, TaskResult
from haremovie_api.requests import CreateTaskRequest, ImageUrl, RunTaskRequest
from haremovie_api.responses import CreateTaskResponse
from haremovie_api.storage import get_storage_client, upload_artifact

app = FastAPI()


@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}


@app.get("/health")
async def health():
    return {"message": "OK"}


def _upload_input_artifacts(
    storage_client: storage.Client, request: CreateTaskRequest
) -> RunTaskRequest:
    character_image_url = upload_artifact(
        storage_client,
        "character_image",
        request.character_image.base64_data,
        request.character_image.mime_type,
    )
    dress_image_url = upload_artifact(
        storage_client,
        "dress_image",
        request.dress_image.base64_data,
        request.dress_image.mime_type,
    )
    background_image_url = upload_artifact(
        storage_client,
        "background_image",
        request.background_image.base64_data,
        request.background_image.mime_type,
    )
    request_for_worker = RunTaskRequest(
        character_image=ImageUrl(
            url=character_image_url,
            mime_type=request.character_image.mime_type,
        ),
        dress_image=ImageUrl(
            url=dress_image_url,
            mime_type=request.dress_image.mime_type,
        ),
        background_image=ImageUrl(
            url=background_image_url,
            mime_type=request.background_image.mime_type,
        ),
    )
    return request_for_worker


@app.post("/tasks/create")
async def create_task(
    request: CreateTaskRequest,
    storage_client: storage.Client = Depends(get_storage_client),
) -> CreateTaskResponse:
    if os.getenv("HAREMOVIE_WORKER_URL") and os.getenv("HAREMOVIE_WORKER_URL") not in [
        "http://localhost:8001",
        "http://worker:8001",
    ]:
        client = tasks_v2.CloudTasksClient()
    else:
        channel = grpc.insecure_channel("gcloud-tasks-emulator:8123")
        transport = CloudTasksGrpcTransport(channel=channel)
        client = tasks_v2.CloudTasksClient(transport=transport)
    parent = client.queue_path(
        os.environ["GOOGLE_CLOUD_PROJECT"],
        os.environ["GOOGLE_CLOUD_LOCATION"],
        "haremovie-agent-queue",
    )
    logger.info(f"Parent: {parent}")
    task_id = uuid4()
    request_for_worker = _upload_input_artifacts(storage_client, request)
    task = tasks_v2.Task(
        http_request=tasks_v2.HttpRequest(
            http_method=tasks_v2.HttpMethod.POST,
            url=f"{os.environ['HAREMOVIE_WORKER_URL']}/tasks/run/{task_id}",
            headers={"Content-Type": "application/json"},
            body=request_for_worker.model_dump_json().encode(),
        )
    )
    # dispatch_deadline を 15 分（900 秒）に設定
    task.dispatch_deadline = duration_pb2.Duration(seconds=900)
    client.create_task(parent=parent, task=task)
    return CreateTaskResponse(task_id=task_id)


@app.post("/tasks/{task_id}")
async def get_task(task_id: str, db: Session = Depends(get_session)) -> Task:
    task = db.exec(select(Task).where(Task.id == task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.post("/tasks/{task_id}/result")
async def get_task_result(
    task_id: str, db: Session = Depends(get_session)
) -> TaskResult:
    task_result = db.exec(
        select(TaskResult).where(TaskResult.task_id == task_id)
    ).first()
    if not task_result:
        raise HTTPException(status_code=404, detail="Task result not found")
    return task_result
