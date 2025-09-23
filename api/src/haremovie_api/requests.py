from pydantic import BaseModel


class ImageUrl(BaseModel):
    url: str
    mime_type: str


class RunTaskRequest(BaseModel):
    bride_image: ImageUrl
    groom_image: ImageUrl
    dress_image: ImageUrl
    tuxedo_image: ImageUrl
    background_image: ImageUrl


class ImageData(BaseModel):
    base64_data: str
    mime_type: str


class CreateTaskRequest(BaseModel):
    bride_image: ImageData
    groom_image: ImageData
    dress_image: ImageData
    tuxedo_image: ImageData
    background_image: ImageData
