#!/usr/bin/env bash
set -e

# Dockerイメージのビルドとプッシュ
gcloud builds submit --tag $REPOSITORY_URL --project $GOOGLE_CLOUD_PROJECT

# apiのデプロイ
gcloud run deploy $CLOUD_RUN_API_SERVICE_NAME --image $REPOSITORY_URL \
    --region $GOOGLE_CLOUD_LOCATION --project $GOOGLE_CLOUD_PROJECT --timeout=60m \
    --command "fastapi" \
    --args "run,src/haremovie_api/server.py,--port,8080" \
    --service-account $CLOUD_RUN_API_SERVICE_ACCOUNT --memory=2Gi \
    --update-env-vars HAREM_MOVIE_WORKER_URL=$HAREM_MOVIE_WORKER_URL \
    --update-env-vars GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT \
    --update-env-vars GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION \
    --update-env-vars GOOGLE_STORAGE_BUCKET_NAME=$GOOGLE_STORAGE_BUCKET_NAME \
    --update-env-vars CORS_ALLOWED_ORIGINS=$CORS_ALLOWED_ORIGINS \
    --update-env-vars DB_NAME=$DB_NAME \
    --update-env-vars DB_USER=$DB_USER \
    --update-env-vars INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME \
    --set-secrets=DB_PASSWORD=DB_PASSWORD:latest \
    --allow-unauthenticated

# Workerのデプロイ
gcloud run deploy $CLOUD_RUN_WORKER_SERVICE_NAME --image $REPOSITORY_URL \
    --region $GOOGLE_CLOUD_LOCATION --project $GOOGLE_CLOUD_PROJECT --timeout=60m \
    --command "fastapi" \
    --args "run,src/haremovie_api/worker.py,--port,8080" \
    --service-account $CLOUD_RUN_WORKER_SERVICE_ACCOUNT --memory=2Gi \
    --update-env-vars GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT \
    --update-env-vars GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION \
    --update-env-vars GOOGLE_STORAGE_BUCKET_NAME=$GOOGLE_STORAGE_BUCKET_NAME \
    --update-env-vars DB_NAME=$DB_NAME \
    --update-env-vars DB_USER=$DB_USER \
    --update-env-vars INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME \
    --update-env-vars GOOGLE_AGENT_ENGINE_RESOURCE_NAME=$GOOGLE_AGENT_ENGINE_RESOURCE_NAME \
    --set-secrets=DB_PASSWORD=DB_PASSWORD:latest \
    --allow-unauthenticated
