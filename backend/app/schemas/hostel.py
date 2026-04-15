from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class HostelCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    total_rooms: Optional[int] = Field(None, ge=1)
    capacity: Optional[int] = Field(None, ge=1)
    description: Optional[str] = Field(None, max_length=500)


class HostelUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    total_rooms: Optional[int] = Field(None, ge=1)
    capacity: Optional[int] = Field(None, ge=1)
    description: Optional[str] = Field(None, max_length=500)


class HostelPublic(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    total_rooms: Optional[int] = None
    capacity: Optional[int] = None
    warden_id: Optional[int] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class HostelAssignWorkerPayload(BaseModel):
    user_id: int
    role: str = Field(..., pattern="^(worker|warden)$")


class HostelAssignmentPayload(BaseModel):
    hostel_id: int

