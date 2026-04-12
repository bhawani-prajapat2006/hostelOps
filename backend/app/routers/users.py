from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from http import HTTPStatus
from sqlalchemy.orm import Session

from app.schemas.user import UserPublic, PaginatedUsers
from app.core.auth import get_current_user, require_role
from app.db.database import get_db
from app import models

router = APIRouter()


# ───── List all users (Admin only) ─────

@router.get("/", response_model=PaginatedUsers)
def list_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|username|email)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
):
    """List all users with pagination and filtering (Admin only)."""
    # Check authorization
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Only admins can view all users")

    query = db.query(models.User)

    # Filter by role
    if role:
        try:
            query = query.filter(models.User.role == models.UserRoleEnum(role))
        except ValueError:
            raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail=f"Invalid role: {role}")

    # Filter by status
    if status:
        try:
            query = query.filter(models.User.status == models.UserStatusEnum(status))
        except ValueError:
            raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail=f"Invalid status: {status}")

    # Sorting
    sort_col = getattr(models.User, sort_by, models.User.created_at)
    query = query.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "users": users,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ───── Get single user (for internal use) ─────

@router.get("/{user_id}", response_model=UserPublic)
def get_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single user by ID."""
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User not found")
    return user
