import os
import asyncio
import logging
from datetime import datetime, timezone
from http import HTTPStatus
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.schemas.user import Message, PaginatedUsers
from app.routers import complaints_router, auth_router, admin_router, rooms_router, notices_router
from app.routers.uploads import router as uploads_router
from app.db.database import engine, get_db, Base, _get_session_local
from app import models
from app.core.auth import get_current_user, require_role
from app.core.limiter import limiter

logger = logging.getLogger(__name__)

app = FastAPI(title="HostelOps API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ───── CORS ─────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create tables at startup
Base.metadata.create_all(bind=engine)


# ───── Auto-cleanup: expired tokens ─────

CLEANUP_INTERVAL_SECONDS = 30 * 60  # run every 30 minutes


def _cleanup_expired_tokens():
    """Delete expired blacklisted tokens and expired password reset tokens."""
    db = _get_session_local()()
    try:
        now = datetime.now(timezone.utc)
        bl = db.query(models.TokenBlacklist).filter(models.TokenBlacklist.expires_at < now).delete()
        pr = db.query(models.PasswordResetToken).filter(models.PasswordResetToken.expires_at < now).delete()
        db.commit()
        if bl or pr:
            logger.info(f"Token cleanup: removed {bl} blacklisted, {pr} reset tokens")
    except Exception as e:
        logger.error(f"Token cleanup error: {e}")
        db.rollback()
    finally:
        db.close()


async def _periodic_cleanup():
    """Background loop that cleans up expired tokens periodically."""
    while True:
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
        _cleanup_expired_tokens()


@app.on_event("startup")
async def startup_cleanup():
    # Run once at startup
    _cleanup_expired_tokens()
    # Schedule periodic cleanup
    asyncio.create_task(_periodic_cleanup())


# ───── Static files (uploads) ─────
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ───── API v1 ─────
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(complaints_router, prefix="/api/v1/complaints", tags=["Complaints"])
app.include_router(rooms_router, prefix="/api/v1/rooms", tags=["Rooms"])
app.include_router(notices_router, prefix="/api/v1/notices", tags=["Notices"])
app.include_router(uploads_router, prefix="/api/v1/uploads", tags=["Uploads"])

# Keep un-prefixed routes for backwards compatibility
app.include_router(auth_router, prefix="/auth", tags=["Auth (compat)"], include_in_schema=False)
app.include_router(admin_router, prefix="/admin", tags=["Admin (compat)"], include_in_schema=False)
app.include_router(complaints_router, prefix="/complaints", tags=["Complaints (compat)"], include_in_schema=False)
app.include_router(rooms_router, prefix="/rooms", tags=["Rooms (compat)"], include_in_schema=False)
app.include_router(notices_router, prefix="/notices", tags=["Notices (compat)"], include_in_schema=False)
app.include_router(uploads_router, prefix="/uploads", tags=["Uploads (compat)"], include_in_schema=False)


@app.get("/", status_code=HTTPStatus.OK, response_model=Message)
def read_root():
    return {"message": "HostelOps API is running"}


# ───── Admin-only User Management ─────

@app.get("/api/v1/users/", response_model=PaginatedUsers, tags=["Users"])
@app.get("/users/", response_model=PaginatedUsers, tags=["Users"], include_in_schema=False)
def list_users(
    current_user: dict = Depends(require_role("admin", "warden")),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Admin/Warden: list all users with pagination."""
    query = db.query(models.User)
    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"users": users, "total": total, "page": page, "page_size": page_size}


