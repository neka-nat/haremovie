import os
from uuid import uuid4

from google.cloud import storage


def get_storage_client() -> storage.Client:
    return storage.Client()


def download_artifact(storage_client: storage.Client, gcs_uri: str) -> tuple[bytes, str]:
    bucket_name, blob_name = gcs_uri.replace("gs://", "").split("/", 1)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    return blob.download_as_bytes(), blob.content_type


def upload_artifact(storage_client: storage.Client, name: str, data: bytes, mime_type: str) -> str:
    bucket_name = os.getenv("GOOGLE_STORAGE_BUCKET_NAME")
    blob_name = f"inputs/{name}_{uuid4()}.{mime_type.split('/')[1]}"
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    blob.upload_from_string(data)
    return f"gs://{bucket_name}/{blob_name}"
