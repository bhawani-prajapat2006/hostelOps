from typing import Optional
from http import HTTPStatus
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.schemas.notice import NoticeCreate, NoticePublic, NoticeUpdate, PaginatedNotices
from app.schemas.user import Message
from app.core.auth import get_current_user, require_role
from app.db.database import get_db
from app import models

router = APIRouter()


@router.post("/", response_model=NoticePublic, status_code=HTTPStatus.CREATED)
def create_notice(
    notice: NoticeCreate,
    current_user: dict = Depends(require_role("warden", "admin")),
    db: Session = Depends(get_db),
):
    """Warden/Admin can post notices."""
    db_notice = models.Notice(
        title=notice.title,
        content=notice.content,
        is_pinned=notice.is_pinned,
        posted_by=current_user["id"],
    )
    db.add(db_notice)
    db.commit()
    db.refresh(db_notice)
    return db_notice


@router.get("/", response_model=PaginatedNotices)
def list_notices(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, min_length=1, max_length=200, description="Search in title/content"),
):
    """List all notices, pinned first, then by date. Optional keyword search."""
    query = db.query(models.Notice)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Notice.title.ilike(pattern),
                models.Notice.content.ilike(pattern),
            )
        )

    query = query.order_by(
        models.Notice.is_pinned.desc(),
        models.Notice.created_at.desc(),
    )
    total = query.count()
    notices = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"notices": notices, "total": total, "page": page, "page_size": page_size}


@router.get("/{notice_id}", response_model=NoticePublic)
def get_notice(notice_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    notice = db.get(models.Notice, notice_id)
    if not notice:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Notice not found")
    return notice


@router.put("/{notice_id}", response_model=NoticePublic)
def update_notice(
    notice_id: int,
    payload: NoticeUpdate,
    current_user: dict = Depends(require_role("warden", "admin")),
    db: Session = Depends(get_db),
):
    notice = db.get(models.Notice, notice_id)
    if not notice:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Notice not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(notice, field, value)
    db.commit()
    db.refresh(notice)
    return notice


@router.delete("/{notice_id}", response_model=Message)
def delete_notice(
    notice_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    notice = db.get(models.Notice, notice_id)
    if not notice:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Notice not found")
    db.delete(notice)
    db.commit()
    return {"message": "Notice deleted"}
