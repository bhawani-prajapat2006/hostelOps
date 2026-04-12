from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from http import HTTPStatus
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import verify_access_token
from app.db.database import get_db
from app import models

security_scheme = HTTPBearer()


def _is_token_blacklisted(jti: str, db: Session) -> bool:
    """Check if a token's JTI is in the blacklist."""
    return db.query(models.TokenBlacklist).filter(models.TokenBlacklist.jti == jti).first() is not None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> dict:
    """Decode JWT from Authorization header and return user info dict."""
    token = credentials.credentials
    try:
        payload = verify_access_token(token)
    except JWTError:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid or expired token")

    # Check token type
    if payload.get("type") not in ("access", None):
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid token type")

    # Check blacklist
    jti = payload.get("jti")
    if jti and _is_token_blacklisted(jti, db):
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Token has been revoked")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid token payload")

    user = db.get(models.User, int(user_id))
    if user is None:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="User not found")

    # Always return role and status as plain strings
    role_value = getattr(user.role, "value", user.role)
    status_value = getattr(user.status, "value", user.status)
    return {
        "id": user.id,
        "role": role_value,
        "status": status_value,
        "email": user.email,
        "username": user.username,
        "phone": user.phone,
        "hostel_name": user.hostel_name,
        "room_number": user.room_number,
        "batch": user.batch,
        "jti": payload.get("jti"),
        "token_exp": payload.get("exp"),
    }


def require_role(*allowed_roles: str):
    """Dependency factory: restricts access to users with one of the allowed roles.

    Usage:  dependencies=[Depends(require_role("admin"))]
            dependencies=[Depends(require_role("warden", "admin"))]
    """
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=HTTPStatus.FORBIDDEN,
                detail=f"Requires one of roles: {list(allowed_roles)}",
            )
        return current_user
    return role_checker


def require_active_status(current_user: dict = Depends(get_current_user)):
    """Dependency: ensures user is active (not pending or inactive)."""
    if current_user.get("status") != "active":
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail=f"Your account is not active. Current status: {current_user.get('status', 'unknown')}. Please wait for admin approval.",
        )
    return current_user


def require_role_and_active(*allowed_roles: str):
    """Dependency factory: restricts access to active users with one of the allowed roles."""
    def checker(current_user: dict = Depends(require_role(*allowed_roles))):
        if current_user.get("status") != "active":
            raise HTTPException(
                status_code=HTTPStatus.FORBIDDEN,
                detail=f"Your account is not active. Current status: {current_user.get('status', 'unknown')}. Please wait for admin approval.",
            )
        return current_user
    return checker
