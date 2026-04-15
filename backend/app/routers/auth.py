from datetime import datetime, timezone
from http import HTTPStatus
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from jose import JWTError

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.db.database import get_db
from app import models
from app.schemas.auth import (
    RegisterRequest, LoginRequest, GoogleLoginRequest, TokenResponse, RefreshRequest,
)
from app.schemas.user import UserPublic, UserProfileUpdate, Message
from app.core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    verify_access_token,
)
from app.core.config import settings
from app.core.auth import get_current_user

router = APIRouter()


def _build_token_response(user: models.User) -> dict:
    token_data = {"sub": str(user.id), "role": user.role.value, "status": user.status.value}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }


# ───── Profile ─────

@router.get("/me", response_model=UserPublic)
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the currently logged-in user's profile."""
    user = db.get(models.User, current_user["id"])
    return user


@router.put("/me", response_model=UserPublic)
def update_profile(
    payload: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's profile fields."""
    user = db.get(models.User, current_user["id"])
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/me", response_model=Message)
def delete_my_account(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete the currently logged-in user account and related references safely."""
    user = db.get(models.User, current_user["id"])
    if not user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User not found")

    if user.role == models.UserRoleEnum.admin:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Admin account deletion is not allowed")

    # Remove references that would block deleting this user due to foreign keys.
    db.query(models.Complaint).filter(models.Complaint.assigned_to == user.id).update(
        {models.Complaint.assigned_to: None},
        synchronize_session=False,
    )
    db.query(models.Hostel).filter(models.Hostel.warden_id == user.id).update(
        {models.Hostel.warden_id: None},
        synchronize_session=False,
    )
    db.query(models.ComplaintHistory).filter(models.ComplaintHistory.changed_by == user.id).delete(
        synchronize_session=False
    )

    db.delete(user)
    db.commit()
    return {"message": "Account deleted successfully"}


# ───── Registration ─────

@router.post("/register", response_model=TokenResponse, status_code=HTTPStatus.CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    existing = db.query(models.User).filter(func.lower(models.User.email) == normalized_email).first()
    if existing:
        if existing.auth_provider == "google":
            raise HTTPException(
                status_code=HTTPStatus.CONFLICT,
                detail="This email is registered with Google. Please continue with Google Sign-In.",
            )

        # Professional UX: if the local account already exists and password matches,
        # treat this as a returning sign-in instead of hard-failing registration.
        if existing.password and verify_password(payload.password, existing.password):
            return JSONResponse(status_code=HTTPStatus.OK, content=_build_token_response(existing))

        raise HTTPException(
            status_code=HTTPStatus.CONFLICT,
            detail="Email already registered. Please login with your existing password.",
        )

    # Determine initial status based on role
    # Students are immediately active, workers/wardens need approval
    role = models.UserRoleEnum(payload.role)
    status = models.UserStatusEnum.active if role == models.UserRoleEnum.student else models.UserStatusEnum.pending

    user = models.User(
        username=payload.username,
        email=normalized_email,
        password=hash_password(payload.password),
        role=role,
        status=status,
        auth_provider="local",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _build_token_response(user)


# ───── Login ─────

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == normalized_email).first()
    if not user:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="No account found for this email.")

    if user.auth_provider == "google" and not user.password:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail="This account uses Google Sign-In. Please continue with Google.",
        )

    if not user.password:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid account state. Please contact admin.")

    if not verify_password(payload.password, user.password):
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Incorrect password. Please try again.")

    if user.status == models.UserStatusEnum.inactive:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail="Your account is inactive. Please contact admin support.",
        )

    return _build_token_response(user)


# ───── Token Refresh ─────

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    try:
        data = verify_access_token(payload.refresh_token)
    except JWTError:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid or expired refresh token")

    if data.get("type") != "refresh":
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Not a refresh token")

    # Check blacklist
    jti = data.get("jti")
    if jti:
        blacklisted = db.query(models.TokenBlacklist).filter(models.TokenBlacklist.jti == jti).first()
        if blacklisted:
            raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Token has been revoked")
        # Blacklist the old refresh token
        db.add(models.TokenBlacklist(
            jti=jti,
            expires_at=datetime.fromtimestamp(data["exp"], tz=timezone.utc),
        ))
        db.commit()

    user = db.get(models.User, int(data["sub"]))
    if not user:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="User not found")

    token_data = {"sub": str(user.id), "role": user.role.value}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }


# ───── Logout (token revocation) ─────

@router.post("/logout", response_model=Message)
def logout(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Blacklist the current access token's JTI — effectively logging out."""
    jti = current_user.get("jti")
    token_exp = current_user.get("token_exp")
    if jti:
        expires_at = datetime.fromtimestamp(token_exp, tz=timezone.utc) if token_exp else datetime.now(timezone.utc)
        db.add(models.TokenBlacklist(jti=jti, expires_at=expires_at))
        db.commit()
    return {"message": "Logged out successfully"}


# ───── Google OAuth ─────

@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Verify a Google ID token, create user if new, return JWT."""
    is_new_google_user = False
    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            # Tolerate minor client/server clock drift.
            clock_skew_in_seconds=120,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail=f"Google sign-in verification failed. {str(e)}",
        )

    email = (idinfo.get("email") or "").strip().lower()
    name = idinfo.get("name", email.split("@")[0])

    if not email:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Google account has no email")

    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if user:
        # Prevent Google login from hijacking a local account
        if user.auth_provider == "local":
            raise HTTPException(
                status_code=HTTPStatus.CONFLICT,
                detail="An account with this email already exists. Please login with your password.",
            )
    else:
        user = models.User(
            username=name,
            email=email,
            password=None,
            role=models.UserRoleEnum.student,
            status=models.UserStatusEnum.active,  # Google users are active by default
            auth_provider="google",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_google_user = True

    token_data = {"sub": str(user.id), "role": user.role.value, "status": user.status.value}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
        "needs_role_selection": is_new_google_user,
    }


# ───── Role Selection (for Google OAuth users) ─────

from app.schemas.auth import RoleUpdateRequest

@router.post("/select-role", response_model=UserPublic)
def select_role(
    payload: RoleUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allow user to select role (for Google OAuth flow)."""
    user = db.get(models.User, current_user["id"])
    if not user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User not found")

    role = models.UserRoleEnum(payload.role.value)
    user.role = role
    user.status = models.UserStatusEnum.active if role == models.UserRoleEnum.student else models.UserStatusEnum.pending
    db.commit()
    db.refresh(user)
    return user


# ───── Admin: Approve/Reject Users ─────

@router.get("/pending-users", response_model=list[UserPublic], tags=["Admin"])
def get_pending_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin: Get all pending user approval requests."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Only admins can view pending users")

    pending = db.query(models.User).filter(models.User.status == models.UserStatusEnum.pending).all()
    return pending


@router.post("/approve-user/{user_id}", response_model=UserPublic, tags=["Admin"])
def approve_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin: Approve a pending user (worker/warden)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Only admins can approve users")

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User not found")

    if user.status != models.UserStatusEnum.pending:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="User is not pending approval")

    user.status = models.UserStatusEnum.active
    db.commit()
    db.refresh(user)
    return user


@router.post("/reject-user/{user_id}", response_model=UserPublic, tags=["Admin"])
def reject_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin: Reject a pending user application."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Only admins can reject users")

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User not found")

    if user.status != models.UserStatusEnum.pending:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="User is not pending approval")

    user.status = models.UserStatusEnum.inactive
    db.commit()
    db.refresh(user)
    return user
