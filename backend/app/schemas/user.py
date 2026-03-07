from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class Message(BaseModel):
    message: str


class UserRole(str, Enum):
    student = "student"
    worker = "worker"
    warden = "warden"
    admin = "admin"


class UserPublic(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: UserRole
    phone: Optional[str] = None
    hostel_name: Optional[str] = None
    room_number: Optional[str] = None
    batch: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=2, max_length=50)
    phone: Optional[str] = Field(None, max_length=15)
    hostel_name: Optional[str] = Field(None, max_length=100)
    room_number: Optional[str] = Field(None, max_length=20)
    batch: Optional[str] = Field(None, max_length=20)


class PaginatedUsers(BaseModel):
    users: list[UserPublic]
    total: int
    page: int
    page_size: int
