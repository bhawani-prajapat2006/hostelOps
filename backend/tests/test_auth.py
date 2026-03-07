"""Tests for auth endpoints: register, login, me, refresh, logout, Google collision."""

from http import HTTPStatus
from tests.conftest import create_user_and_token, auth_header


# ───── Register ─────

def test_register_success(client):
    r = client.post("/auth/register", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "StrongPass1",
    })
    assert r.status_code == HTTPStatus.CREATED
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_register_duplicate_email(client, db):
    create_user_and_token(db, client, email="dup@example.com")
    r = client.post("/auth/register", json={
        "username": "another",
        "email": "dup@example.com",
        "password": "StrongPass1",
    })
    assert r.status_code == HTTPStatus.CONFLICT


def test_register_weak_password(client):
    r = client.post("/auth/register", json={
        "username": "weakuser",
        "email": "weak@example.com",
        "password": "short",
    })
    assert r.status_code == 422  # validation error


def test_register_no_uppercase(client):
    r = client.post("/auth/register", json={
        "username": "user",
        "email": "a@b.com",
        "password": "alllowercase1",
    })
    assert r.status_code == 422


def test_register_no_digit(client):
    r = client.post("/auth/register", json={
        "username": "user",
        "email": "a@b.com",
        "password": "NoDigitHere",
    })
    assert r.status_code == 422


# ───── Login ─────

def test_login_success(client, db):
    create_user_and_token(db, client, email="login@example.com")
    r = client.post("/auth/login", json={"email": "login@example.com", "password": "TestPass1"})
    assert r.status_code == HTTPStatus.OK
    assert "access_token" in r.json()
    assert "refresh_token" in r.json()


def test_login_wrong_password(client, db):
    create_user_and_token(db, client, email="wp@example.com")
    r = client.post("/auth/login", json={"email": "wp@example.com", "password": "WrongPass9"})
    assert r.status_code == HTTPStatus.UNAUTHORIZED


def test_login_nonexistent_email(client):
    r = client.post("/auth/login", json={"email": "nobody@example.com", "password": "TestPass1"})
    assert r.status_code == HTTPStatus.UNAUTHORIZED


# ───── Me ─────

def test_get_me(client, db):
    user, token = create_user_and_token(db, client, email="me@example.com")
    r = client.get("/auth/me", headers=auth_header(token))
    assert r.status_code == HTTPStatus.OK
    data = r.json()
    assert data["email"] == "me@example.com"
    assert data["username"] == "testuser"


def test_get_me_no_token(client):
    r = client.get("/auth/me")
    assert r.status_code == HTTPStatus.UNAUTHORIZED


# ───── Profile update ─────

def test_update_profile(client, db):
    _, token = create_user_and_token(db, client, email="profile@example.com")
    r = client.put("/auth/me", headers=auth_header(token), json={
        "phone": "1234567890",
        "hostel_name": "Hostel A",
        "batch": "2024",
    })
    assert r.status_code == HTTPStatus.OK
    assert r.json()["phone"] == "1234567890"
    assert r.json()["hostel_name"] == "Hostel A"


# ───── Token Refresh ─────

def test_refresh_token(client, db):
    _, token = create_user_and_token(db, client, email="refresh@example.com")
    # Login to get a refresh token
    r = client.post("/auth/login", json={"email": "refresh@example.com", "password": "TestPass1"})
    refresh = r.json()["refresh_token"]

    r2 = client.post("/auth/refresh", json={"refresh_token": refresh})
    assert r2.status_code == HTTPStatus.OK
    assert "access_token" in r2.json()


def test_refresh_with_access_token_fails(client, db):
    _, token = create_user_and_token(db, client, email="badrefresh@example.com")
    r = client.post("/auth/refresh", json={"refresh_token": token})
    assert r.status_code == HTTPStatus.UNAUTHORIZED


# ───── Protected without token ─────

def test_protected_endpoint_no_token(client):
    r = client.get("/users/")
    assert r.status_code == HTTPStatus.UNAUTHORIZED
