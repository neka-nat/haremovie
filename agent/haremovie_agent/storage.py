from google.cloud import storage


def download_video(video_uri: str) -> bytes:
    bucket_name, blob_name = video_uri.replace("gs://", "").split("/", 1)
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    return blob.download_as_bytes()
