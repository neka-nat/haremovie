import uuid

from google import genai
from google.genai import types
from google.adk.tools.tool_context import ToolContext

from .utils import get_artifact_images_from_ids, save_artifact_from_llm_response


async def generate_virtual_try_on(
    prompt: str, target_image_id: str, clothes_image_ids: list[str], tool_context: ToolContext
) -> dict:
    """Generate a virtual try-on image.

    Args:
        prompt: The prompt to generate the virtual try-on image.
        target_image_id: The ID of the target image.
        clothes_image_ids: The IDs of the clothes images.

    Returns:
        A dictionary containing the status and the generated VTO image ID.
    """
    ids = [target_image_id] + list(clothes_image_ids or [])
    parts: list[types.Part] = [types.Part.from_text(text=prompt)]

    try:
        parts.extend(await get_artifact_images_from_ids(ids, tool_context))
    except ValueError as e:
        return {"status": "error", "message": str(e)}

    client = genai.Client(vertexai=False)
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash-image-preview",
        contents=parts,
    )

    image_id = f"image_vto_{uuid.uuid4()}.png"
    try:
        await save_artifact_from_llm_response(response, tool_context, image_id)
    except ValueError as e:
        return {"status": "error", "message": str(e)}

    return {
        "status": "success",
        "image_id": image_id,
    }
