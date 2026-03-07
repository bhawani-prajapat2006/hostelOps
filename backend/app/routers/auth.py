from datetime import datetime, timezone
from http import HTTPStatus
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from jose import JWTError

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.db.database import get_db
from app import models
from app.schemas.auth import (
    RegisterRequest, LoginRequest, GoogleLoginRequest, TokenResponse, RefreshRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.schemas.user import UserPublic, UserProfileUpdate, Message
from app.core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    verify_access_token,
)
from app.core.config import settings
from app.core.auth import get_current_user
from app.core.limiter import limiter

router = APIRouter()


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


# ───── Registration ─────

@router.post("/register", response_model=TokenResponse, status_code=HTTPStatus.CREATED)
@limiter.limit(settings.LOGIN_RATE_LIMIT)
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=HTTPStatus.CONFLICT, detail="Email already registered")

    user = models.User(
        username=payload.username,
        email=payload.email,
        password=hash_password(payload.password),
        role=models.UserRoleEnum.student,
        auth_provider="local",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token_data = {"sub": str(user.id), "role": user.role.value}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }


# ───── Login ─────

@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.LOGIN_RATE_LIMIT)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.password:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(payload.password, user.password):
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid email or password")

    token_data = {"sub": str(user.id), "role": user.role.value}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }


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
@limiter.limit(settings.LOGIN_RATE_LIMIT)
def google_login(request: Request, payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Verify a Google ID token, create user if new, return JWT."""
    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid Google token")

    email = idinfo.get("email")
    name = idinfo.get("name", email.split("@")[0])

    if not email:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Google account has no email")

    user = db.query(models.User).filter(models.User.email == email).first()
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
            auth_provider="google",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token_data = {"sub": str(user.id), "role": user.role.value}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }


# ───── Password Reset ─────

@router.post("/forgot-password", response_model=Message)
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a password reset token and (optionally) email it.

    If BREVO_API_KEY is set, sends the reset link via Brevo.
    Otherwise, returns the token directly (for dev/testing).
    """
    import uuid

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        # Don't reveal whether the email exists
        return {"message": "If that email is registered, a reset link has been sent."}

    if user.auth_provider != "local":
        return {"message": "If that email is registered, a reset link has been sent."}

    # Remove any existing reset tokens for this user
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id
    ).delete()

    token = uuid.uuid4().hex
    from datetime import timedelta
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    db.add(models.PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at))
    db.commit()

    # Try to send email if Brevo is configured
    if settings.BREVO_API_KEY:
        from app.core.email import send_password_reset_email
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_password_reset_email(user.email, user.username, reset_link)
        return {"message": "If that email is registered, a reset link has been sent."}

    # Dev mode: return token directly
    return {"message": f"Reset token (dev mode): {token}"}


@router.post("/reset-password", response_model=Message)
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using a valid reset token."""
    reset = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == payload.token
    ).first()

    if not reset:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Invalid or expired reset token")

    if reset.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        db.delete(reset)
        db.commit()
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Invalid or expired reset token")

    user = db.get(models.User, reset.user_id)
    if not user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User not found")

    user.password = hash_password(payload.new_password)
    db.delete(reset)
    db.commit()

    return {"message": "Password has been reset successfully"}
