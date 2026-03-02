from typing import List
from fastapi import APIRouter, HTTPException, Depends
from http import HTTPStatus
from sqlalchemy.orm import Session

from app.schemas.complaint import ComplaintCreate, ComplaintPublic, ComplaintStatus, ComplaintUpdate
from app.core.auth import get_current_user
from app.schemas.user import UserRole
from app.db.database import get_db
from app import models

router = APIRouter()


@router.post("/", response_model=ComplaintPublic, status_code=HTTPStatus.CREATED)
def create_complaint(
    complaint: ComplaintCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # only students may create complaints
    role = current_user.get("role")
    role_value = getattr(role, "value", role)
    if role_value != models.UserRoleEnum.student.value:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Only students can create complaints")

    # enforce created_by from current user, ignore client-supplied created_by
    db_complaint = models.Complaint(
        title=complaint.title,
        description=complaint.description,
        created_by=current_user.get("id"),
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return {
        "id": db_complaint.id,
        "title": db_complaint.title,
        "description": db_complaint.description,
        "created_by": db_complaint.created_by,
        "status": db_complaint.status.value,
    }


@router.get("/", response_model=List[ComplaintPublic])
def list_complaints(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    complaints = db.query(models.Complaint).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "created_by": c.created_by,
            "status": c.status.value,
        }
        for c in complaints
    ]


@router.get("/{complaint_id}", response_model=ComplaintPublic)
def get_complaint(complaint_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    complaint = db.get(models.Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Complaint not found")
    return {
        "id": complaint.id,
        "title": complaint.title,
        "description": complaint.description,
        "created_by": complaint.created_by,
        "status": complaint.status.value,
    }


@router.put("/{complaint_id}", response_model=ComplaintPublic)
def update_complaint(complaint_id: int, complaint: ComplaintUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.get(models.Complaint, complaint_id)
    if not existing:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Complaint not found")

    # Enforce lifecycle: closed complaints cannot be updated
    if existing.status == models.ComplaintStatusEnum.closed:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Closed complaints cannot be updated")

    # If a status update is requested, only wardens may change status
    if complaint.status is not None:
        role = current_user.get("role")
        role_value = getattr(role, "value", role)
        if role_value != models.UserRoleEnum.warden.value:
            raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Only wardens can update complaint status")

    # merge updates: only replace provided fields
    if complaint.title is not None:
        existing.title = complaint.title
    if complaint.description is not None:
        existing.description = complaint.description

    # handle status update if provided
    if complaint.status is not None:
        existing.status = models.ComplaintStatusEnum(complaint.status.value if hasattr(complaint.status, "value") else complaint.status)

    db.add(existing)
    db.commit()
    db.refresh(existing)
    return {
        "id": existing.id,
        "title": existing.title,
        "description": existing.description,
        "created_by": existing.created_by,
        "status": existing.status.value,
    }


@router.delete("/{complaint_id}")
def delete_complaint(complaint_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    complaint = db.get(models.Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Complaint not found")
    db.delete(complaint)
    db.commit()
    return {"message": "Complaint Deleted Successfully"}
