# HARE Movie API

## Run

```bash
docker compose up
```

## DB Migration

### Local

```bash
docker compose run --rm worker uv run alembic revision --autogenerate -m "<migration_name>"
docker compose run --rm worker uv run alembic upgrade head
```

### Cloud SQL

```bash
URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.15.0"
curl "$URL/cloud-sql-proxy.linux.amd64" -o cloud-sql-proxy
chmod +x cloud-sql-proxy

# サービスアカウントの認証情報を引数に指定
./cloud-sql-proxy $PROJECT_ID:asia-northeast1:haremovie-db -c <path-to-service-account-key.json>
# alembic.ini の sqlalchemy.url を適切に変更する

# 別のターミナルで以下のコマンドを実行
# マイグレーションを実行する場合
uv run alembic upgrade head
```
