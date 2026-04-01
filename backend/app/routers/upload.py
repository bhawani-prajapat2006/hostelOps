from fastapi import APIRouter, HTTPException
from http import HTTPStatus
from datetime import datetime
import cloudinary
import cloudinary.utils
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter()

# Initialize Cloudinary with credentials
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)


class UploadSignatureRequest(BaseModel):
    """Request model for getting upload signature"""
    pass


@router.post("/generate-upload-signature")
async def generate_upload_signature():
    """
    Generate a signed upload request for Cloudinary uploads.
    
    Returns signature, timestamp, api_key, and cloud_name required for
    client-side uploads to Cloudinary.
    """
    try:
        if not all([
            settings.CLOUDINARY_CLOUD_NAME,
            settings.CLOUDINARY_API_KEY,
            settings.CLOUDINARY_API_SECRET
        ]):
            raise HTTPException(
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
                detail="Cloudinary credentials not configured"
            )

        timestamp = int(datetime.now().timestamp())

        # Sign the upload request
        signature = cloudinary.utils.api_sign_request(
            {"timestamp": timestamp},
            settings.CLOUDINARY_API_SECRET
        )

        return {
            "timestamp": timestamp,
            "signature": signature,
            "api_key": settings.CLOUDINARY_API_KEY,
            "cloud_name": settings.CLOUDINARY_CLOUD_NAME
        }

    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload signature: {str(err)}"
        )
