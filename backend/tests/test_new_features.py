"""Tests for new features: password reset, logout, search, file upload."""

import io
from http import HTTPStatus
from tests.conftest import create_user_and_token, auth_header


# ───── Logout (token blacklisting) ─────

def test_logout_blacklists_token(db, client):
    _, token = create_user_and_token(db, client, email="logout@test.com")
    # Logout
    r = client.post("/auth/logout", headers=auth_header(token))
    assert r.status_code == 200
    assert r.json()["message"] == "Logged out successfully"

    # Token should now be rejected
    r = client.get("/auth/me", headers=auth_header(token))
    assert r.status_code == HTTPStatus.UNAUTHORIZED


# ───── Password Reset ─────

def test_forgot_password_returns_token_in_dev_mode(db, client):
    """Without BREVO_API_KEY, returns reset token directly."""
    create_user_and_token(db, client, email="reset@test.com")
    r = client.post("/auth/forgot-password", json={"email": "reset@test.com"})
    assert r.status_code == 200
    assert "Reset token (dev mode):" in r.json()["message"]


def test_forgot_password_nonexistent_email(db, client):
    """Should not reveal whether email exists."""
    r = client.post("/auth/forgot-password", json={"email": "nobody@test.com"})
    assert r.status_code == 200
    assert "reset link has been sent" in r.json()["message"]


def test_reset_password_flow(db, client):
    """Full forgot + reset flow."""
    create_user_and_token(db, client, email="fullreset@test.com")

    # Get reset token
    r = client.post("/auth/forgot-password", json={"email": "fullreset@test.com"})
    token = r.json()["message"].split(": ")[1]

    # Reset password
    r = client.post("/auth/reset-password", json={"token": token, "new_password": "NewPass123"})
    assert r.status_code == 200
    assert "reset successfully" in r.json()["message"]

    # Login with new password
    r = client.post("/auth/login", json={"email": "fullreset@test.com", "password": "NewPass123"})
    assert r.status_code == 200


def test_reset_password_invalid_token(db, client):
    r = client.post("/auth/reset-password", json={"token": "badtoken", "new_password": "NewPass123"})
    assert r.status_code == HTTPStatus.BAD_REQUEST


def test_reset_password_weak_password(db, client):
    create_user_and_token(db, client, email="weakreset@test.com")
    r = client.post("/auth/forgot-password", json={"email": "weakreset@test.com"})
    token = r.json()["message"].split(": ")[1]

    r = client.post("/auth/reset-password", json={"token": token, "new_password": "short"})
    assert r.status_code == HTTPStatus.UNPROCESSABLE_ENTITY


# ───── Search ─────

def test_search_complaints(db, client):
    _, token = create_user_and_token(db, client, email="search@test.com", role="student")
    h = auth_header(token)
    # Create a complaint with a unique keyword
    client.post("/complaints/", json={
        "title": "Broken faucet in bathroom",
        "description": "The bathroom faucet is leaking water continuously",
        "category": "plumbing",
    }, headers=h)
    client.post("/complaints/", json={
        "title": "Light not working",
        "description": "The ceiling light in room 302 is not working",
        "category": "electrical",
    }, headers=h)

    # Search by keyword in title
    r = client.get("/complaints/?search=faucet", headers=h)
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert "faucet" in r.json()["complaints"][0]["title"].lower()

    # Search by keyword in description
    r = client.get("/complaints/?search=ceiling", headers=h)
    assert r.status_code == 200
    assert r.json()["total"] == 1


def test_search_notices(db, client):
    _, token = create_user_and_token(db, client, email="searchnotice@test.com", role="warden")
    h = auth_header(token)
    client.post("/notices/", json={"title": "Water supply disruption", "content": "Water will be cut off tomorrow from 10am to 2pm"}, headers=h)
    client.post("/notices/", json={"title": "Annual sports day", "content": "Register for sports events by Friday"}, headers=h)

    r = client.get("/notices/?search=water", headers=h)
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert "water" in r.json()["notices"][0]["title"].lower()


# ───── File Upload ─────

def test_upload_image(db, client):
    _, token = create_user_and_token(db, client, email="upload@test.com")
    h = auth_header(token)

    # Create a fake image file
    file_content = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100  # minimal PNG-like bytes
    r = client.post(
        "/api/v1/uploads/",
        headers=h,
        files={"file": ("test_image.png", io.BytesIO(file_content), "image/png")},
    )
    assert r.status_code == HTTPStatus.CREATED
    data = r.json()
    assert data["filename"].endswith(".png")
    assert data["url"].startswith("/uploads/")
    assert data["original_name"] == "test_image.png"


def test_upload_rejects_disallowed_type(db, client):
    _, token = create_user_and_token(db, client, email="badupload@test.com")
    h = auth_header(token)

    r = client.post(
        "/api/v1/uploads/",
        headers=h,
        files={"file": ("malware.exe", io.BytesIO(b"bad"), "application/octet-stream")},
    )
    assert r.status_code == HTTPStatus.BAD_REQUEST
    assert "not allowed" in r.json()["detail"]


def test_upload_requires_auth(client):
    r = client.post(
        "/api/v1/uploads/",
        files={"file": ("test.png", io.BytesIO(b"data"), "image/png")},
    )
    assert r.status_code == HTTPStatus.UNAUTHORIZED
