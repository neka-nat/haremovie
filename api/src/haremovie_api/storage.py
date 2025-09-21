import base64
import os
import mimetypes
from datetime import timedelta
from uuid import uuid4

from google.cloud import storage


def get_storage_client() -> storage.Client:
    return storage.Client()


def download_artifact(
    storage_client: storage.Client, gcs_uri: str
) -> tuple[bytes, str]:
    bucket_name, blob_name = gcs_uri.replace("gs://", "").split("/", 1)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    return blob.download_as_bytes(), blob.content_type


def upload_artifact(
    storage_client: storage.Client, name: str, data: bytes | str, mime_type: str
) -> str:
    bucket_name = os.getenv("GOOGLE_STORAGE_BUCKET_NAME")
    blob_name = f"inputs/{name}_{uuid4()}.{mime_type.split('/')[1]}"
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    if isinstance(data, bytes):
        raw = data
    else:
        s = data if isinstance(data, str) else str(data)
        if s.startswith("data:"):
            s = s.split(",", 1)[1]
        raw = base64.b64decode(s)
    blob.upload_from_string(raw, content_type=mime_type)
    return f"gs://{bucket_name}/{blob_name}"


def get_signed_url(
    storage_client: storage.Client,
    video_gcs_uri: str,
    download: bool = False,  # Trueならダウンロードさせる
    expire_minutes: int = 60,
) -> str:
    bucket_name, blob_name = video_gcs_uri.replace("gs://", "").split("/", 1)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    filename = "sample0.mp4"
    content_type = blob.content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"

    # Content-Disposition を付けたい場合
    disp = f'attachment; filename="{filename}"' if download else f'inline; filename="{filename}"'

    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=expire_minutes),
        method="GET",
        response_disposition=disp,
        response_type=content_type,
    )
    return url
