from fastapi import FastAPI


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
