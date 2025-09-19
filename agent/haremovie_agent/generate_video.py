import asyncio
import os
import tempfile
import uuid

from google import genai
from google.adk.tools.tool_context import ToolContext
from google.genai.types import Blob, GenerateVideosConfig, Image, Part
from loguru import logger

from .movie_utils import extract_last_frame
from .storage import download_video


_model_name = "veo-3.0-generate-001"


async def generate_video(
    prompt: str,
    image_id: str,
    aspect_ratio: str,
    tool_context: ToolContext,
) -> dict[str, str]:
    """
    Generate a video from a prompt and image.
    8 seconds video is generated.

    Args:
        prompt: The prompt to generate the video from.
        image_id: The ID of the image to generate the video from.
        aspect_ratio: The aspect ratio of the video (e.g. "16:9", "9:16").

    Returns:
        The ID of the generated video.
    """

    video_output_uri = f"gs://{os.environ['GOOGLE_STORAGE_BUCKET_NAME']}/videos"
    image_artifact = await tool_context.load_artifact(filename=image_id)
    logger.info(f"Loaded image artifact: {image_artifact}")

    client = genai.Client(vertexai=True)
    operation = client.models.generate_videos(
        model=_model_name,
        prompt=prompt,
        image=Image(image_bytes=image_artifact.inline_data.data, mime_type="image/png"),
        config=GenerateVideosConfig(
            aspect_ratio=aspect_ratio,
            output_gcs_uri=video_output_uri,
        ),
    )

    while not operation.done:
        await asyncio.sleep(15)
        operation = client.operations.get(operation)
        logger.info(operation)

    if operation.response and operation.result.generated_videos:
        video_uri = operation.result.generated_videos[0].video.uri
        video_bytes = download_video(video_uri)
        with tempfile.NamedTemporaryFile(delete=True) as temp_file:
            temp_file.write(video_bytes)
            temp_file_path = temp_file.name
            last_frame = extract_last_frame(temp_file_path)
        media_id = uuid.uuid4()
        video_id = f"video_{media_id}.mp4"
        await tool_context.save_artifact(
            filename=video_id,
            artifact=Part(
                inline_data=Blob(data=video_bytes, mime_type="video/mp4"),
            ),
        )
        last_frame_id = f"last_frame_{media_id}.png"
        await tool_context.save_artifact(
            filename=last_frame_id,
            artifact=Part(
                inline_data=Blob(data=last_frame, mime_type="image/png"),
            ),
        )
        logger.info(f"Added video artifact: {video_id}")
        return {
            "status": "success",
            "video_id": video_id,
            "video_url": video_uri,
            "last_frame_id": last_frame_id,
        }
    else:
        return {
            "status": "error",
            "error": "Failed to generate video",
        }