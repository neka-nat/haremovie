# HARE Movie API

## Run

```bash
docker compose up
```

## DB Migration

```bash
docker compose run --rm worker uv run alembic revision --autogenerate -m "<migration_name>"
docker compose run --rm worker uv run alembic upgrade head
```
