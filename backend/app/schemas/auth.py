from enum import Enum
from pydantic import BaseModel, EmailStr, Field


# Define ValidRole first (before RegisterRequest uses it)
class ValidRole(str, Enum):
    student = "student"
    worker = "worker"
    warden = "warden"
    admin = "admin"


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: ValidRole = ValidRole.student  # Default to student, can be: student, worker, warden


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    """Frontend sends the Google ID token after Google sign-in."""
    id_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    needs_role_selection: bool = False


class RefreshRequest(BaseModel):
    refresh_token: str


class RoleUpdateRequest(BaseModel):
    role: ValidRole
