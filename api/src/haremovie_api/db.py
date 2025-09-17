import os

from sqlmodel import create_engine, Session


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
