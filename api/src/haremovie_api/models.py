from datetime import datetime, timezone, timedelta
from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel, Relationship


def get_jst_now():
    """JST（日本標準時）で現在時刻を取得"""
    return datetime.now(timezone(timedelta(hours=9)))


class TaskStatus(Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Task(SQLModel, table=True, table_name="tasks"):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    status: TaskStatus
    progress: int = Field(default=0)
    created_at: datetime = Field(default_factory=get_jst_now)
    updated_at: datetime = Field(default_factory=get_jst_now)


class TaskResult(SQLModel, table=True, table_name="task_results"):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    task_id: UUID = Field(foreign_key="task.id")
    result_video_url: str
    created_at: datetime = Field(default_factory=get_jst_now)
    updated_at: datetime = Field(default_factory=get_jst_now)

    task: Task = Relationship(back_populates="task_results")
