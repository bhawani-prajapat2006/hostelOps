from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class RoomCreate(BaseModel):
    room_number: str = Field(..., min_length=1, max_length=20)
    hostel_name: str = Field(..., min_length=1, max_length=100)
    capacity: int = Field(1, ge=1, le=10)
    floor: Optional[int] = None


class RoomPublic(BaseModel):
    id: int
    room_number: str
    hostel_name: str
    capacity: int
    floor: Optional[int] = None
    is_available: bool = True
    created_at: Optional[datetime] = None
    occupants: int = 0

    model_config = {"from_attributes": True}


class RoomUpdate(BaseModel):
    room_number: Optional[str] = Field(None, min_length=1, max_length=20)
    hostel_name: Optional[str] = Field(None, min_length=1, max_length=100)
    capacity: Optional[int] = Field(None, ge=1, le=10)
    floor: Optional[int] = None
    is_available: Optional[bool] = None


class RoomAssignRequest(BaseModel):
    student_id: int


class RoomAssignmentPublic(BaseModel):
    id: int
    room_id: int
    student_id: int
    assigned_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PaginatedRooms(BaseModel):
    rooms: list[RoomPublic]
    total: int
    page: int
    page_size: int
