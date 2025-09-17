from google.genai import types
from google.adk.tools.tool_context import ToolContext
from loguru import logger

from .storage import upload_artifact


async def get_artifact_images_from_ids(ids: list[str], tool_context: ToolContext) -> list[types.Part]:
    parts: list[types.Part] = []
    for image_id in ids:
        art = await tool_context.load_artifact(filename=image_id)
        if not art:
            raise ValueError(f"artifact not found: {image_id}")

        if getattr(art, "inline_data", None):
            mime = art.inline_data.mime_type or "application/octet-stream"
            if not mime.startswith("image/"):
                raise ValueError(f"not an image: {image_id} ({mime})")
            parts.append(types.Part.from_bytes(data=art.inline_data.data, mime_type=mime))
        elif getattr(art, "file_data", None):
            fd = art.file_data
            if not (getattr(fd, "file_uri", None) and getattr(fd, "mime_type", None)):
                raise ValueError(f"artifact {image_id} missing file_uri or mime_type")
            parts.append(types.Part.from_uri(file_uri=fd.file_uri, mime_type=fd.mime_type))
        else:
            raise ValueError(f"artifact {image_id} has no inline_data/file_data")
    return parts


async def save_artifact_from_llm_response(
    response: types.GenerateContentResponse,
    tool_context: ToolContext,
    image_id: str,
    save_storage: bool = True,
) -> None:
    out_part = None
    for part in response.candidates[0].content.parts:
        if part.text is not None:
            logger.info(f"part.text: {part.text}")
        elif part.inline_data is not None:
            out_part = part
            break
    if out_part is None:
        raise ValueError("no image in model response")

    await tool_context.save_artifact(
        filename=image_id,
        artifact=types.Part(
            inline_data=types.Blob(
                data=out_part.inline_data.data,
                mime_type=out_part.inline_data.mime_type,
            ),
        ),
    )
    if save_storage:
        upload_artifact(out_part, image_id)
    logger.info(f"Added image artifact: {image_id}")
