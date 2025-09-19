import os

from sqlmodel import Session, create_engine, select

from haremovie_api.models import Task, TaskResult


def get_db_uri() -> str:
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")
    db_name = os.getenv("DB_NAME")
    return f"postgresql://{user}:{password}@{host}:{port}/{db_name}"


_engine = None


def get_engine(url: str | None = None):
    global _engine
    if _engine is None:
        _engine = create_engine(url or get_db_uri())
    return _engine


def get_session():
    db = Session(get_engine())
    try:
        yield db
    finally:
        db.close()


def upsert_task(db: Session, task: Task) -> Task:
    existing = db.exec(select(Task).where(Task.id == task.id)).first()
    if existing:
        # 更新フィールドを反映（progress は渡されない場合もあるため存在チェック）
        existing.status = task.status
        if hasattr(task, "progress"):
            existing.progress = task.progress
        existing.updated_at = task.updated_at
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        db.add(task)
        db.commit()
        db.refresh(task)
        return task


def save_task_result(db: Session, task_result: TaskResult) -> TaskResult:
    db.add(task_result)
    db.commit()
    db.refresh(task_result)
    return task_result
