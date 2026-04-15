import asyncio
import logging
from datetime import datetime, timezone
from http import HTTPStatus
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.schemas.user import Message, PaginatedUsers
from app.routers import complaints_router, auth_router, hostels_router
from app.db.database import engine, get_db, Base, _get_session_local
from app import models
from app.core.auth import get_current_user, require_role, require_role_and_active, require_active_status

logger = logging.getLogger(__name__)

app = FastAPI(title="HostelOps API", version="1.0.0")

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
    """Delete expired blacklisted tokens."""
    db = _get_session_local()()
    try:
        now = datetime.now(timezone.utc)
        bl = db.query(models.TokenBlacklist).filter(models.TokenBlacklist.expires_at < now).delete()
        db.commit()
        if bl:
            logger.info(f"Token cleanup: removed {bl} blacklisted tokens")
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


# ───── API v1 ─────
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(complaints_router, prefix="/api/v1/complaints", tags=["Complaints"])
app.include_router(hostels_router, prefix="/api/v1/hostels", tags=["Hostels"])

# Keep un-prefixed routes for backwards compatibility
app.include_router(auth_router, prefix="/auth", tags=["Auth (compat)"], include_in_schema=False)
app.include_router(complaints_router, prefix="/complaints", tags=["Complaints (compat)"], include_in_schema=False)
app.include_router(hostels_router, prefix="/hostels", tags=["Hostels (compat)"], include_in_schema=False)


@app.get("/", status_code=HTTPStatus.OK, response_model=Message)
def read_root():
    return {"message": "HostelOps API is running"}


# ───── Admin-only User Management ─────

@app.get("/api/v1/users/", response_model=PaginatedUsers, tags=["Users"])
@app.get("/users/", response_model=PaginatedUsers, tags=["Users"], include_in_schema=False)
def list_users(
    current_user: dict = Depends(require_role_and_active("admin", "warden")),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Admin/Warden: list users with pagination (must be active)."""
    query = db.query(models.User)

    # Wardens can only see users in their hostel
    if current_user.get("role") == "warden":
        user = db.get(models.User, current_user["id"])
        if user and user.hostel_id:
            query = query.filter(models.User.hostel_id == user.hostel_id)
        else:
            # Warden not assigned to hostel can't see anyone
            return {"users": [], "total": 0, "page": page, "page_size": page_size}

    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"users": users, "total": total, "page": page, "page_size": page_size}


