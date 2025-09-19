from pydantic import BaseModel


class ImageUrl(BaseModel):
    url: str
    mime_type: str


class RunTaskRequest(BaseModel):
    character_image: ImageUrl
    dress_image: ImageUrl
    background_image: ImageUrl


class ImageData(BaseModel):
    base64_data: str
    mime_type: str


class CreateTaskRequest(BaseModel):
    character_image: ImageData
    dress_image: ImageData
    background_image: ImageData
