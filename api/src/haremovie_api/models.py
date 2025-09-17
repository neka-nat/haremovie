from datetime import datetime, timezone, timedelta
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel, Relationship


def get_jst_now():
    """JST（日本標準時）で現在時刻を取得"""
    return datetime.now(timezone(timedelta(hours=9)))


class User(SQLModel, table=True, table_name="users"):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str


class Session(SQLModel, table=True, table_name="sessions"):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="sessions")


class Task(SQLModel, table=True, table_name="tasks"):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    session_id: UUID = Field(foreign_key="session.id")
    status: str
    created_at: datetime = Field(default_factory=get_jst_now)
    updated_at: datetime = Field(default_factory=get_jst_now)

    session: Session = Relationship(back_populates="tasks")


class TaskResult(SQLModel, table=True, table_name="task_results"):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    task_id: UUID = Field(foreign_key="task.id")
    result_url: str
    created_at: datetime = Field(default_factory=get_jst_now)
    updated_at: datetime = Field(default_factory=get_jst_now)

    task: Task = Relationship(back_populates="task_results")
