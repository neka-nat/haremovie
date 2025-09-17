# HARE Movie Agent

```bash
uv run adk web
```

```bash
uv run adk deploy agent_engine \
  --project="haremovie" \
  --region="us-central1" \
  --staging_bucket="gs://$GOOGLE_STORAGE_ADK_BUCKET_NAME" \
  --display_name="haremovie_agent" \
  --env_file haremovie_agent/.env.deploy \
  haremovie_agent
```
