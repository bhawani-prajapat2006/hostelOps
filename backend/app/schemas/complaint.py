from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ComplaintStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"


class ComplaintCategory(str, Enum):
    plumbing = "plumbing"
    electrical = "electrical"
    cleanliness = "cleanliness"
    furniture = "furniture"
    network = "network"
    other = "other"


class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=256)
    description: str = Field(..., min_length=10, max_length=5000)
    category: ComplaintCategory = ComplaintCategory.other
    image_url: Optional[str] = None


class AssignedWorkerPublic(BaseModel):
    id: int
    username: str
    email: str
    work_type: Optional[str] = None

    model_config = {"from_attributes": True}


class ComplaintPublic(BaseModel):
    id: int
    title: str
    description: str
    category: ComplaintCategory = ComplaintCategory.other
    created_by: int
    assigned_to: Optional[int] = None
    status: ComplaintStatus = ComplaintStatus.open
    image_url: Optional[str] = None
    image_after_solved: Optional[str] = None
    awaiting_warden_review: bool = False
    assigned_worker: Optional[AssignedWorkerPublic] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ComplaintUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=256)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    status: Optional[ComplaintStatus] = None


class ComplaintAssign(BaseModel):
    worker_id: int


class ComplaintResolutionSubmit(BaseModel):
    image_after_solved: str = Field(..., min_length=5, max_length=512)


class ComplaintReviewRequest(BaseModel):
    approve: bool
    comment: Optional[str] = Field(None, max_length=500)
    reassign_worker_id: Optional[int] = None


class ComplaintHistoryPublic(BaseModel):
    id: int
    complaint_id: int
    changed_by: int
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PaginatedComplaints(BaseModel):
    complaints: list[ComplaintPublic]
    total: int
    page: int
    page_size: int
