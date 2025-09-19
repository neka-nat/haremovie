from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select

from haremovie_api.db import get_session
from haremovie_api.models import Task, TaskResult

app = FastAPI()


@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}


@app.get("/health")
async def health():
    return {"message": "OK"}


@app.post("/tasks/create")
async def create_task():
    return {"message": "Task created"}


@app.post("/tasks/{task_id}")
async def get_task(task_id: str, db: Session = Depends(get_session)) -> Task:
    task = db.exec(select(Task).where(Task.id == task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.post("/tasks/{task_id}/result")
async def get_task_result(task_id: str, db: Session = Depends(get_session)) -> TaskResult:
    task_result = db.exec(select(TaskResult).where(TaskResult.task_id == task_id)).first()
    if not task_result:
        raise HTTPException(status_code=404, detail="Task result not found")
    return task_result
