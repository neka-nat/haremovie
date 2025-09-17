from pydantic import BaseModel


class ImageUrl(BaseModel):
    url: str
    mime_type: str


class RunTaskRequest(BaseModel):
    character_image: ImageUrl
    dress_image: ImageUrl
    background_image: ImageUrl
