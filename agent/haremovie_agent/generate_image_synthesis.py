import uuid

from google import genai
from google.genai import types
from google.adk.tools.tool_context import ToolContext

from .utils import get_artifact_images_from_ids, save_artifact_from_llm_response


async def generate_image_synthesis(
    prompt: str, object_image_ids: list[str], background_image_id: str, tool_context: ToolContext
) -> dict:
    """Generate an image synthesis image.

    Args:
        prompt: The prompt to generate the image synthesis image.
        object_image_ids: The IDs of the object images.
        background_image_id: The ID of the background image.

    Returns:
        A dictionary containing the status and the generated image synthesis image ID.
    """
    ids = [object_image_id for object_image_id in object_image_ids] + [background_image_id]
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

    image_id = f"image_synth_{uuid.uuid4()}.png"
    try:
        await save_artifact_from_llm_response(response, tool_context, image_id)
    except ValueError as e:
        return {"status": "error", "message": str(e)}

    return {
        "status": "success",
        "image_id": image_id,
    }
