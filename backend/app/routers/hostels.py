from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from http import HTTPStatus
from sqlalchemy.orm import Session

from app.schemas.hostel import HostelCreate, HostelUpdate, HostelPublic, HostelAssignWorkerPayload
from app.schemas.user import Message
from app.core.auth import get_current_user, require_role_and_active
from app.db.database import get_db
from app import models

router = APIRouter()


# ───── Create Hostel (Admin only) ─────

@router.post("/", response_model=HostelPublic, status_code=HTTPStatus.CREATED)
def create_hostel(
    payload: HostelCreate,
    current_user: dict = Depends(require_role_and_active("admin")),
    db: Session = Depends(get_db),
):
    """Admin: Create a new hostel."""
    # Check if hostel already exists
    existing = db.query(models.Hostel).filter(models.Hostel.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=HTTPStatus.CONFLICT, detail="Hostel with this name already exists")

    hostel = models.Hostel(
        name=payload.name,
        capacity=payload.capacity,
        description=payload.description,
    )
    db.add(hostel)
    db.commit()
    db.refresh(hostel)
    return hostel


# ───── List all Hostels ─────

@router.get("/", response_model=List[HostelPublic])
def list_hostels(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """List all hostels (viewable by all authenticated users)."""
    hostels = db.query(models.Hostel).offset(skip).limit(limit).all()
    return hostels


# ───── Get single Hostel ─────

@router.get("/{hostel_id}", response_model=HostelPublic)
def get_hostel(
    hostel_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single hostel by ID."""
    hostel = db.get(models.Hostel, hostel_id)
    if not hostel:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Hostel not found")
    return hostel


# ───── Update Hostel (Admin only) ─────

@router.put("/{hostel_id}", response_model=HostelPublic)
def update_hostel(
    hostel_id: int,
    payload: HostelUpdate,
    current_user: dict = Depends(require_role_and_active("admin")),
    db: Session = Depends(get_db),
):
    """Admin: Update hostel details."""
    hostel = db.get(models.Hostel, hostel_id)
    if not hostel:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Hostel not found")

    # Check name uniqueness if changing name
    if payload.name and payload.name != hostel.name:
        existing = db.query(models.Hostel).filter(models.Hostel.name == payload.name).first()
        if existing:
            raise HTTPException(status_code=HTTPStatus.CONFLICT, detail="Another hostel with this name already exists")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(hostel, field, value)

    db.commit()
    db.refresh(hostel)
    return hostel


# ───── Delete Hostel (Admin only) ─────

@router.delete("/{hostel_id}", response_model=Message)
def delete_hostel(
    hostel_id: int,
    current_user: dict = Depends(require_role_and_active("admin")),
    db: Session = Depends(get_db),
):
    """Admin: Delete a hostel."""
    hostel = db.get(models.Hostel, hostel_id)
    if not hostel:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Hostel not found")

    # Check if any users are assigned to this hostel
    users_count = db.query(models.User).filter(models.User.hostel_id == hostel_id).count()
    if users_count > 0:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail=f"Cannot delete hostel: {users_count} users are assigned to it. Unassign them first.",
        )

    db.delete(hostel)
    db.commit()
    return {"message": "Hostel deleted successfully"}


# ───── Assign User to Hostel (Admin only) ─────

@router.post("/{hostel_id}/assign/{user_id}", response_model=HostelPublic)
def assign_user_to_hostel(
    hostel_id: int,
    user_id: int,
    current_user: dict = Depends(require_role_and_active("admin")),
    db: Session = Depends(get_db),
):
    """Admin: Assign a worker/warden to a hostel."""
    hostel = db.get(models.Hostel, hostel_id)
    if not hostel:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Hostel not found")

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User not found")

    # Only workers and wardens can be assigned to hostels
    if user.role not in (models.UserRoleEnum.worker.value, models.UserRoleEnum.warden.value):
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Only workers and wardens can be assigned to hostels")

    user.hostel_id = hostel_id
    user.hostel_name = hostel.name  # Keep hostel_name in sync for backwards compatibility
    db.commit()
    db.refresh(hostel)
    return hostel


# ───── Assign Warden to Hostel (Admin only) ─────

@router.post("/{hostel_id}/assign-warden/{user_id}", response_model=HostelPublic)
def assign_warden_to_hostel(
    hostel_id: int,
    user_id: int,
    current_user: dict = Depends(require_role_and_active("admin")),
    db: Session = Depends(get_db),
):
    """Admin: Assign a warden to manage a hostel."""
    hostel = db.get(models.Hostel, hostel_id)
    if not hostel:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Hostel not found")

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User not found")

    if user.role != models.UserRoleEnum.warden:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Only wardens can be assigned to hostels")

    # If warden is already assigned to a different hostel, unassign from old hostel first
    if user.hostel_id and user.hostel_id != hostel_id:
        old_hostel = db.get(models.Hostel, user.hostel_id)
        if old_hostel:
            old_hostel.warden_id = None
            db.commit()

    # If this hostel already had a warden, they get replaced
    hostel.warden_id = user_id
    user.hostel_id = hostel_id
    user.hostel_name = hostel.name
    db.commit()
    db.refresh(hostel)
    return hostel

@router.post("/{hostel_id}/unassign/{user_id}", response_model=HostelPublic)
def unassign_user_from_hostel(
    hostel_id: int,
    user_id: int,
    current_user: dict = Depends(require_role_and_active("admin")),
    db: Session = Depends(get_db),
):
    """Admin: Remove a worker/warden from a hostel."""
    hostel = db.get(models.Hostel, hostel_id)
    if not hostel:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Hostel not found")

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User not found")

    if user.hostel_id != hostel_id:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="User is not assigned to this hostel")

    user.hostel_id = None
    user.hostel_name = None
    db.commit()
    db.refresh(hostel)
    return hostel


# ───── Get Hostel Users ─────

@router.get("/{hostel_id}/users", response_model=list)
def get_hostel_users(
    hostel_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    role: Optional[str] = None,
):
    """Get all users assigned to a hostel (optionally filtered by role)."""
    hostel = db.get(models.Hostel, hostel_id)
    if not hostel:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Hostel not found")

    query = db.query(models.User).filter(models.User.hostel_id == hostel_id)

    if role:
        try:
            query = query.filter(models.User.role == models.UserRoleEnum(role))
        except ValueError:
            raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail=f"Invalid role: {role}")

    users = query.all()
    return users
