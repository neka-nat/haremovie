from uuid import UUID

from pydantic import BaseModel


class CreateTaskResponse(BaseModel):
    task_id: UUID
