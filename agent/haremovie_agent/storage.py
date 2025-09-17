import os

from google.cloud import storage
from google.genai import types


def download_video(video_uri: str) -> bytes:
    bucket_name, blob_name = video_uri.replace("gs://", "").split("/", 1)
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    return blob.download_as_bytes()


def upload_artifact(artifact: types.Part, artifact_id: str) -> None:
    storage_client = storage.Client()
    bucket = storage_client.bucket(os.environ["GOOGLE_STORAGE_BUCKET_NAME"])
    data: bytes = artifact.inline_data.data
    mime = artifact.inline_data.mime_type or "application/octet-stream"
    blob = bucket.blob("artifacts/" + artifact_id)
    blob.upload_from_string(data=data, content_type=mime)
