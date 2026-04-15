from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from http import HTTPStatus
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.schemas.complaint import (
    ComplaintCreate, ComplaintPublic, ComplaintUpdate, ComplaintAssign,
    ComplaintHistoryPublic, PaginatedComplaints, ComplaintStatus, ComplaintCategory,
)
from app.schemas.user import Message
from app.core.auth import get_current_user, require_role, require_role_and_active, require_active_status
from app.db.database import get_db
from app import models

router = APIRouter()


# ───── Create ─────

@router.post("/", response_model=ComplaintPublic, status_code=HTTPStatus.CREATED)
def create_complaint(
    complaint: ComplaintCreate,
    current_user: dict = Depends(require_active_status),
    db: Session = Depends(get_db),
    hostel_id: Optional[int] = Query(None),
):
    """Students, wardens, and admin can create complaints (must be active)."""
    if current_user["role"] not in (models.UserRoleEnum.student.value, models.UserRoleEnum.warden.value, models.UserRoleEnum.admin.value):
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Only students, wardens, and admins can create complaints")

    # Get the user
    user = db.get(models.User, current_user["id"])

    # Determine hostel_id based on role
    if current_user["role"] == "admin":
        # Admin must provide hostel_id
        if not hostel_id:
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail="Admin must select a hostel when creating a complaint",
            )
        complaint_hostel_id = hostel_id
    else:
        # Students and wardens use their assigned hostel
        if not user.hostel_id:
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail="You must be assigned to a hostel to create complaints. Please update your profile.",
            )
        complaint_hostel_id = user.hostel_id

    db_complaint = models.Complaint(
        title=complaint.title,
        description=complaint.description,
        category=models.ComplaintCategoryEnum(complaint.category.value),
        image_url=complaint.image_url,
        created_by=current_user["id"],
        hostel_id=complaint_hostel_id,  # Set based on role
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)

    # Record creation in history
    db.add(models.ComplaintHistory(
        complaint_id=db_complaint.id,
        changed_by=current_user["id"],
        new_status="open",
        comment="Complaint created",
    ))
    db.commit()

    return db_complaint


# ───── My complaints ─────

@router.get("/my", response_model=List[ComplaintPublic])
def my_complaints(current_user: dict = Depends(require_active_status), db: Session = Depends(get_db)):
    """Return complaints created by the current user."""
    from sqlalchemy.orm import selectinload
    complaints = db.query(models.Complaint).options(
        selectinload(models.Complaint.assigned_worker)
    ).filter(
        models.Complaint.created_by == current_user["id"]
    ).order_by(models.Complaint.created_at.desc()).all()
    return complaints


# ───── Assigned to me (worker dashboard) ─────

@router.get("/assigned", response_model=List[ComplaintPublic])
def assigned_complaints(
    current_user: dict = Depends(require_role_and_active("worker")),
    db: Session = Depends(get_db),
):
    """Workers: see complaints assigned to them."""
    from sqlalchemy.orm import selectinload
    complaints = db.query(models.Complaint).options(
        selectinload(models.Complaint.assigned_worker)
    ).filter(
        models.Complaint.assigned_to == current_user["id"]
    ).order_by(models.Complaint.created_at.desc()).all()
    return complaints


# ───── List all (with pagination + filtering) ─────

@router.get("/", response_model=PaginatedComplaints)
def list_complaints(
    current_user: dict = Depends(require_active_status),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[ComplaintStatus] = None,
    category: Optional[ComplaintCategory] = None,
    assigned_to: Optional[int] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|status|category)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: Optional[str] = Query(None, min_length=1, max_length=200, description="Search in title/description"),
):
    """List all complaints with pagination, filtering, sorting, and search."""
    from sqlalchemy.orm import selectinload
    query = db.query(models.Complaint).options(
        selectinload(models.Complaint.assigned_worker)
    )

    # Hostel-based access control
    if current_user["role"] in ("student", "worker", "warden"):
        # Non-admins can only see complaints from their hostel
        user = db.get(models.User, current_user["id"])
        if not user.hostel_id:
            # Return empty list if not assigned to hostel
            return {
                "complaints": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
            }
        query = query.filter(models.Complaint.hostel_id == user.hostel_id)

    # Full-text search (case-insensitive LIKE)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Complaint.title.ilike(pattern),
                models.Complaint.description.ilike(pattern),
            )
        )

    if status:
        query = query.filter(models.Complaint.status == models.ComplaintStatusEnum(status.value))
    if category:
        query = query.filter(models.Complaint.category == models.ComplaintCategoryEnum(category.value))
    if assigned_to is not None:
        query = query.filter(models.Complaint.assigned_to == assigned_to)

    # Sorting
    sort_col = getattr(models.Complaint, sort_by, models.Complaint.created_at)
    query = query.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

    total = query.count()
    complaints = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "complaints": complaints,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ───── Get single ─────

@router.get("/{complaint_id}", response_model=ComplaintPublic)
def get_complaint(complaint_id: int, current_user: dict = Depends(require_active_status), db: Session = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    complaint = db.query(models.Complaint).options(selectinload(models.Complaint.assigned_worker)).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Complaint not found")
    return complaint


# ───── Get complaint history ─────

@router.get("/{complaint_id}/history", response_model=List[ComplaintHistoryPublic])
def get_complaint_history(complaint_id: int, current_user: dict = Depends(require_active_status), db: Session = Depends(get_db)):
    complaint = db.get(models.Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Complaint not found")
    return complaint.history


# ───── Update (with ownership check) ─────

@router.put("/{complaint_id}", response_model=ComplaintPublic)
def update_complaint(complaint_id: int, complaint: ComplaintUpdate, current_user: dict = Depends(require_active_status), db: Session = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    existing = db.query(models.Complaint).options(
        selectinload(models.Complaint.assigned_worker)
    ).filter(models.Complaint.id == complaint_id).first()
    if not existing:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Complaint not found")

    if existing.status == models.ComplaintStatusEnum.closed:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Closed complaints cannot be updated")

    role = current_user["role"]

    # Title/description changes — only the creator or wardens/admins
    if complaint.title is not None or complaint.description is not None:
        if existing.created_by != current_user["id"] and role not in ("warden", "admin"):
            raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="You can only edit your own complaints")

    # Status changes — only wardens/admins
    if complaint.status is not None:
        if role not in ("warden", "admin"):
            raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Only wardens/admins can update complaint status")

    old_status = existing.status.value

    if complaint.title is not None:
        existing.title = complaint.title
    if complaint.description is not None:
        existing.description = complaint.description
    if complaint.status is not None:
        existing.status = models.ComplaintStatusEnum(complaint.status.value if hasattr(complaint.status, "value") else complaint.status)

    # Record in history if status changed
    if complaint.status is not None and old_status != existing.status.value:
        db.add(models.ComplaintHistory(
            complaint_id=existing.id,
            changed_by=current_user["id"],
            old_status=old_status,
            new_status=existing.status.value,
        ))

    db.commit()
    db.refresh(existing)
    return existing


# ───── Assign worker ─────

@router.put("/{complaint_id}/assign", response_model=ComplaintPublic)
def assign_complaint(
    complaint_id: int,
    payload: ComplaintAssign,
    current_user: dict = Depends(require_role_and_active("warden", "admin")),
    db: Session = Depends(get_db),
):
    """Warden/Admin assigns a worker to a complaint."""
    from sqlalchemy.orm import selectinload
    complaint = db.query(models.Complaint).options(
        selectinload(models.Complaint.assigned_worker)
    ).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Complaint not found")

    worker = db.get(models.User, payload.worker_id)
    if not worker:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Worker not found")
    if worker.role != models.UserRoleEnum.worker:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="User is not a worker")

    old_status = complaint.status.value
    complaint.assigned_to = worker.id
    if complaint.status == models.ComplaintStatusEnum.open:
        complaint.status = models.ComplaintStatusEnum.in_progress

    # History
    db.add(models.ComplaintHistory(
        complaint_id=complaint.id,
        changed_by=current_user["id"],
        old_status=old_status,
        new_status=complaint.status.value,
        comment=f"Assigned to worker #{worker.id}",
    ))

    db.commit()
    db.refresh(complaint)
    return complaint


# ───── Get available workers ─────

@router.get("/{complaint_id}/available-workers", response_model=list)
def get_available_workers(
    complaint_id: int,
    current_user: dict = Depends(require_role_and_active("warden", "admin")),
    db: Session = Depends(get_db),
):
    """Get available workers for a complaint (matching work type).

    Workers are independent and NOT assigned to hostels.
    Only filtering by active status and matching work_type.
    """
    complaint = db.get(models.Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Complaint not found")

    # Get all active workers with matching work type
    # Workers are independent - no hostel assignment needed
    workers = db.query(models.User).filter(
        models.User.role == models.UserRoleEnum.worker,
        models.User.status == models.UserStatusEnum.active,
        models.User.work_type == complaint.category.value,
    ).all()

    from app.schemas.user import UserPublic
    return [UserPublic.model_validate(w) for w in workers]


# ───── Delete (with ownership check) ─────

@router.delete("/{complaint_id}", response_model=Message)
def delete_complaint(
    complaint_id: int,
    current_user: dict = Depends(require_active_status),
    db: Session = Depends(get_db),
):
    complaint = db.get(models.Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Complaint not found")

    # Only the creator can delete
    if complaint.created_by != current_user["id"]:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="You can only delete your own complaints")

    db.delete(complaint)
    db.commit()
    return {"message": "Complaint Deleted Successfully"}
