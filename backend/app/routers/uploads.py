"""File upload router — stores files locally in /uploads directory."""

import os
import uuid
from http import HTTPStatus
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.core.auth import get_current_user
from app.core.config import settings
from app.schemas.upload import UploadResponse

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"}
MAX_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024  # convert to bytes


@router.post("/", response_model=UploadResponse, status_code=HTTPStatus.CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload an image/document file. Returns the URL to access it.

    Allowed types: jpg, jpeg, png, gif, webp, pdf
    Max size: configured via MAX_UPLOAD_SIZE_MB (default 5 MB)
    """
    # Validate extension
    _, ext = os.path.splitext(file.filename or "")
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content with size check
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE_MB} MB",
        )

    # Generate unique filename
    unique_name = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_name)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(contents)

    return {
        "filename": unique_name,
        "original_name": file.filename,
        "url": f"/uploads/{unique_name}",
        "size": len(contents),
    }
