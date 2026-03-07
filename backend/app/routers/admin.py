from http import HTTPStatus
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app import models
from app.schemas.auth import RoleUpdateRequest
from app.schemas.user import UserPublic
from app.core.auth import require_role

router = APIRouter()


@router.put("/users/{user_id}/role", response_model=UserPublic)
def update_user_role(
    user_id: int,
    payload: RoleUpdateRequest,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Admin-only: promote or demote a user's role."""
    new_role = models.UserRoleEnum(payload.role.value)

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User not found")

    # Prevent admin from demoting themselves
    if user.id == current_user["id"] and new_role != models.UserRoleEnum.admin:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail="Cannot demote yourself. Ask another admin.",
        )

    user.role = new_role
    db.commit()
    db.refresh(user)
    return user


@router.get("/stats")
def admin_stats(
    current_user: dict = Depends(require_role("admin", "warden")),
    db: Session = Depends(get_db),
):
    """Admin/Warden dashboard stats."""
    total_users = db.query(func.count(models.User.id)).scalar()
    total_complaints = db.query(func.count(models.Complaint.id)).scalar()
    open_complaints = db.query(func.count(models.Complaint.id)).filter(
        models.Complaint.status == models.ComplaintStatusEnum.open
    ).scalar()
    in_progress = db.query(func.count(models.Complaint.id)).filter(
        models.Complaint.status == models.ComplaintStatusEnum.in_progress
    ).scalar()
    closed_complaints = db.query(func.count(models.Complaint.id)).filter(
        models.Complaint.status == models.ComplaintStatusEnum.closed
    ).scalar()
    total_rooms = db.query(func.count(models.Room.id)).scalar()

    return {
        "total_users": total_users,
        "total_complaints": total_complaints,
        "open_complaints": open_complaints,
        "in_progress_complaints": in_progress,
        "closed_complaints": closed_complaints,
        "total_rooms": total_rooms,
    }
