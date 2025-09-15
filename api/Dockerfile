FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
COPY . /app

RUN uv pip install -e . --break-system-packages --system

CMD ["fastapi", "run", "src/haremovie_api/server.py"]
