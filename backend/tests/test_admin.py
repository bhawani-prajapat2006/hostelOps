"""Tests for admin endpoints: role update, self-demotion guard, stats."""

from http import HTTPStatus
from tests.conftest import create_user_and_token, auth_header


def test_admin_can_promote_user(client, db):
    _, admin_token = create_user_and_token(db, client, username="admin", email="admin@test.com", role="admin")
    student, _ = create_user_and_token(db, client, username="student", email="student@test.com", role="student")

    r = client.put(f"/admin/users/{student.id}/role", headers=auth_header(admin_token), json={
        "role": "worker",
    })
    assert r.status_code == HTTPStatus.OK
    assert r.json()["role"] == "worker"


def test_student_cannot_promote(client, db):
    _, stu_token = create_user_and_token(db, client, username="student", email="stu@test.com", role="student")
    r = client.put("/admin/users/1/role", headers=auth_header(stu_token), json={
        "role": "admin",
    })
    assert r.status_code == HTTPStatus.FORBIDDEN


def test_admin_cannot_self_demote(client, db):
    admin, admin_token = create_user_and_token(db, client, username="admin", email="admin2@test.com", role="admin")
    r = client.put(f"/admin/users/{admin.id}/role", headers=auth_header(admin_token), json={
        "role": "student",
    })
    assert r.status_code == HTTPStatus.BAD_REQUEST
    assert "demote yourself" in r.json()["detail"].lower()


def test_invalid_role_rejected(client, db):
    _, admin_token = create_user_and_token(db, client, username="admin", email="admin3@test.com", role="admin")
    r = client.put("/admin/users/999/role", headers=auth_header(admin_token), json={
        "role": "superadmin",
    })
    assert r.status_code == 422  # pydantic validation via enum


def test_admin_stats(client, db):
    _, admin_token = create_user_and_token(db, client, username="admin", email="stats@test.com", role="admin")
    r = client.get("/admin/stats", headers=auth_header(admin_token))
    assert r.status_code == HTTPStatus.OK
    data = r.json()
    assert "total_users" in data
    assert "total_complaints" in data
    assert "total_rooms" in data


def test_student_cannot_see_stats(client, db):
    _, stu_token = create_user_and_token(db, client, username="student", email="stustats@test.com", role="student")
    r = client.get("/admin/stats", headers=auth_header(stu_token))
    assert r.status_code == HTTPStatus.FORBIDDEN
