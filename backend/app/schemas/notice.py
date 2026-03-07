from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class NoticeCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=256)
    content: str = Field(..., min_length=5, max_length=10000)
    is_pinned: bool = False


class NoticePublic(BaseModel):
    id: int
    title: str
    content: str
    posted_by: int
    is_pinned: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class NoticeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=256)
    content: Optional[str] = Field(None, min_length=5, max_length=10000)
    is_pinned: Optional[bool] = None


class PaginatedNotices(BaseModel):
    notices: list[NoticePublic]
    total: int
    page: int
    page_size: int
