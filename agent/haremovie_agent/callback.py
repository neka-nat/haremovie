import mimetypes
import time

from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmRequest
from google.genai import types
from loguru import logger


def _guess_name(part: types.Part, idx: int) -> str:
    mime = None
    if getattr(part, "inline_data", None):
        mime = part.inline_data.mime_type
    elif getattr(part, "file_data", None):
        mime = part.file_data.mime_type
    ext = mimetypes.guess_extension(mime or "") or ".bin"
    return f"user:uploads/{int(time.time())}-{idx}{ext}"


async def save_uploads_as_artifacts(callback_context: CallbackContext, llm_request: LlmRequest):
    uc = callback_context.user_content
    if not (uc and uc.parts):
        return None
    for i, p in enumerate(uc.parts):
        if getattr(p, "inline_data", None) or getattr(p, "file_data", None):
            filename = _guess_name(p, i)
            await callback_context.save_artifact(filename, p)
            logger.info(f"Added artifact: {filename}")

    # プロンプトにファイル名を登録する
    names = await callback_context.list_artifacts()
    if names:
        msg = "Available artifacts this turn: " + ", ".join(names) + \
              ". Use tools with 'artifact_name' when needed."
        llm_request.contents.append(types.Content(role="user", parts=[types.Part.from_text(text=msg)]))
    return None
