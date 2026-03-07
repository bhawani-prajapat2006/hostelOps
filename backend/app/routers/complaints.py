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
from app.core.auth import get_current_user, require_role
from app.core.config import settings
from app.db.database import get_db
from app import models

router = APIRouter()


# ───── Create ─────

@router.post("/", response_model=ComplaintPublic, status_code=HTTPStatus.CREATED)
def create_complaint(
    complaint: ComplaintCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Students and wardens can create complaints."""
    if current_user["role"] not in (models.UserRoleEnum.student.value, models.UserRoleEnum.warden.value):
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Only students and wardens can create complaints")

    db_complaint = models.Complaint(
        title=complaint.title,
        description=complaint.description,
        category=models.ComplaintCategoryEnum(complaint.category.value),
        image_url=complaint.image_url,
        created_by=current_user["id"],
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
def my_complaints(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return complaints created by the current user."""
    complaints = db.query(models.Complaint).filter(
        models.Complaint.created_by == current_user["id"]
    ).order_by(models.Complaint.created_at.desc()).all()
    return complaints


# ───── Assigned to me (worker dashboard) ─────

@router.get("/assigned", response_model=List[ComplaintPublic])
def assigned_complaints(
    current_user: dict = Depends(require_role("worker")),
    db: Session = Depends(get_db),
):
    """Workers: see complaints assigned to them."""
    complaints = db.query(models.Complaint).filter(
        models.Complaint.assigned_to == current_user["id"]
    ).order_by(models.Complaint.created_at.desc()).all()
    return complaints


# ───── List all (with pagination + filtering) ─────

@router.get("/", response_model=PaginatedComplaints)
def list_complaints(
    current_user: dict = Depends(get_current_user),
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
    query = db.query(models.Complaint)

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
def get_complaint(complaint_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    complaint = db.get(models.Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Complaint not found")
    return complaint


# ───── Get complaint history ─────

@router.get("/{complaint_id}/history", response_model=List[ComplaintHistoryPublic])
def get_complaint_history(complaint_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    complaint = db.get(models.Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Complaint not found")
    return complaint.history


# ───── Update (with ownership check) ─────

@router.put("/{complaint_id}", response_model=ComplaintPublic)
def update_complaint(complaint_id: int, complaint: ComplaintUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.get(models.Complaint, complaint_id)
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

        # Email notification to complaint creator
        if settings.BREVO_API_KEY:
            creator = db.get(models.User, existing.created_by)
            if creator:
                from app.core.email import send_complaint_status_email
                send_complaint_status_email(
                    creator.email, creator.username, existing.title,
                    old_status, existing.status.value,
                )

    db.commit()
    db.refresh(existing)
    return existing


# ───── Assign worker ─────

@router.put("/{complaint_id}/assign", response_model=ComplaintPublic)
def assign_complaint(
    complaint_id: int,
    payload: ComplaintAssign,
    current_user: dict = Depends(require_role("warden", "admin")),
    db: Session = Depends(get_db),
):
    """Warden/Admin assigns a worker to a complaint."""
    complaint = db.get(models.Complaint, complaint_id)
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


# ───── Delete (with ownership check) ─────

@router.delete("/{complaint_id}", response_model=Message)
def delete_complaint(
    complaint_id: int,
    current_user: dict = Depends(get_current_user),
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
