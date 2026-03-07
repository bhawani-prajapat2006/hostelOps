from pydantic import BaseModel


class UploadResponse(BaseModel):
    filename: str
    original_name: str | None = None
    url: str
    size: int
