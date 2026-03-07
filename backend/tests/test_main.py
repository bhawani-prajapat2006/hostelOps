"""Tests for the root endpoint and user management."""

from http import HTTPStatus
from tests.conftest import create_user_and_token, auth_header


def test_root_returns_ok_and_message(client):
    response = client.get("/")
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert "message" in data


def test_list_users_requires_auth(client):
    r = client.get("/users/")
    assert r.status_code == HTTPStatus.UNAUTHORIZED


def test_admin_can_list_users(client, db):
    _, token = create_user_and_token(db, client, username="admin", email="admin@test.com", role="admin")
    r = client.get("/users/", headers=auth_header(token))
    assert r.status_code == HTTPStatus.OK
    assert "users" in r.json()
    assert "total" in r.json()
    assert r.json()["total"] >= 1


def test_student_cannot_list_users(client, db):
    _, token = create_user_and_token(db, client, username="student", email="stu@test.com", role="student")
    r = client.get("/users/", headers=auth_header(token))
    assert r.status_code == HTTPStatus.FORBIDDEN


def test_admin_can_delete_user(client, db):
    admin, admin_token = create_user_and_token(db, client, username="admin", email="admin2@test.com", role="admin")
    target, _ = create_user_and_token(db, client, username="target", email="target@test.com", role="student")

    r = client.delete(f"/users/{target.id}", headers=auth_header(admin_token))
    assert r.status_code == HTTPStatus.OK


def test_admin_cannot_delete_self(client, db):
    admin, admin_token = create_user_and_token(db, client, username="admin", email="admin3@test.com", role="admin")
    r = client.delete(f"/users/{admin.id}", headers=auth_header(admin_token))
    assert r.status_code == HTTPStatus.BAD_REQUEST


def test_users_pagination(client, db):
    _, token = create_user_and_token(db, client, username="admin", email="adminpag@test.com", role="admin")
    # Create a few more users
    for i in range(3):
        create_user_and_token(db, client, username=f"u{i}", email=f"u{i}@test.com", role="student")

    r = client.get("/users/?page=1&page_size=2", headers=auth_header(token))
    assert r.status_code == HTTPStatus.OK
    assert r.json()["total"] == 4  # admin + 3 students
    assert len(r.json()["users"]) == 2