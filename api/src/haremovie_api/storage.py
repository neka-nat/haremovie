from google.cloud import storage


def get_storage_client() -> storage.Client:
    return storage.Client()


def download_artifact(storage_client: storage.Client, gcs_uri: str) -> tuple[bytes, str]:
    bucket_name, blob_name = gcs_uri.replace("gs://", "").split("/", 1)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    return blob.download_as_bytes(), blob.content_type
