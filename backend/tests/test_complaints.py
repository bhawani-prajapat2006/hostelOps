"""Tests for complaints: CRUD, ownership, pagination, filtering, history, worker dashboard."""

from http import HTTPStatus
from tests.conftest import create_user_and_token, auth_header


def _make_student(db, client, email="student@test.com"):
    return create_user_and_token(db, client, username="student", email=email, role="student")


def _make_warden(db, client, email="warden@test.com"):
    return create_user_and_token(db, client, username="warden", email=email, role="warden")


def _make_worker(db, client, email="worker@test.com"):
    return create_user_and_token(db, client, username="worker", email=email, role="worker")


def _make_admin(db, client, email="admin@test.com"):
    return create_user_and_token(db, client, username="admin", email=email, role="admin")


# ───── Create ─────

def test_student_creates_complaint(client, db):
    _, token = _make_student(db, client)
    r = client.post("/complaints/", headers=auth_header(token), json={
        "title": "Broken pipe",
        "description": "Water leaking in bathroom sink area",
        "category": "plumbing",
    })
    assert r.status_code == HTTPStatus.CREATED
    assert r.json()["category"] == "plumbing"
    assert r.json()["status"] == "open"
    assert r.json()["created_at"] is not None


def test_warden_cannot_create_complaint(client, db):
    _, token = _make_warden(db, client)
    r = client.post("/complaints/", headers=auth_header(token), json={
        "title": "Some issue",
        "description": "Some long enough description here",
    })
    assert r.status_code == HTTPStatus.FORBIDDEN


def test_create_complaint_validation(client, db):
    _, token = _make_student(db, client)
    # Title too short
    r = client.post("/complaints/", headers=auth_header(token), json={
        "title": "ab",
        "description": "Some long enough description here",
    })
    assert r.status_code == 422


# ───── Ownership on update ─────

def test_student_can_edit_own_complaint(client, db):
    _, token = _make_student(db, client, email="owner@test.com")
    r = client.post("/complaints/", headers=auth_header(token), json={
        "title": "My broken pipe",
        "description": "Water leaking badly in bathroom",
    })
    cid = r.json()["id"]

    r2 = client.put(f"/complaints/{cid}", headers=auth_header(token), json={
        "title": "Updated pipe issue",
    })
    assert r2.status_code == HTTPStatus.OK
    assert r2.json()["title"] == "Updated pipe issue"


def test_other_student_cannot_edit(client, db):
    _, token1 = _make_student(db, client, email="owner2@test.com")
    _, token2 = create_user_and_token(db, client, username="other", email="other@test.com", role="student")

    r = client.post("/complaints/", headers=auth_header(token1), json={
        "title": "Owner's complaint",
        "description": "This belongs to the first student",
    })
    cid = r.json()["id"]

    r2 = client.put(f"/complaints/{cid}", headers=auth_header(token2), json={
        "title": "Hijacked title",
    })
    assert r2.status_code == HTTPStatus.FORBIDDEN


def test_student_cannot_change_status(client, db):
    _, token = _make_student(db, client, email="nostatus@test.com")
    r = client.post("/complaints/", headers=auth_header(token), json={
        "title": "Status test",
        "description": "Long enough description for testing",
    })
    cid = r.json()["id"]

    r2 = client.put(f"/complaints/{cid}", headers=auth_header(token), json={
        "status": "closed",
    })
    assert r2.status_code == HTTPStatus.FORBIDDEN


# ───── Ownership on delete ─────

def test_student_can_delete_own(client, db):
    _, token = _make_student(db, client, email="delowner@test.com")
    r = client.post("/complaints/", headers=auth_header(token), json={
        "title": "Delete me",
        "description": "This complaint will be deleted soon",
    })
    cid = r.json()["id"]

    r2 = client.delete(f"/complaints/{cid}", headers=auth_header(token))
    assert r2.status_code == HTTPStatus.OK


def test_other_student_cannot_delete(client, db):
    _, token1 = _make_student(db, client, email="delown2@test.com")
    _, token2 = create_user_and_token(db, client, username="other2", email="delother@test.com", role="student")

    r = client.post("/complaints/", headers=auth_header(token1), json={
        "title": "Don't delete me",
        "description": "Only the owner should be able to delete",
    })
    cid = r.json()["id"]

    r2 = client.delete(f"/complaints/{cid}", headers=auth_header(token2))
    assert r2.status_code == HTTPStatus.FORBIDDEN


def test_admin_can_delete_any(client, db):
    _, stu_token = _make_student(db, client, email="stufordel@test.com")
    _, admin_token = _make_admin(db, client, email="admindel@test.com")

    r = client.post("/complaints/", headers=auth_header(stu_token), json={
        "title": "Admin will delete this",
        "description": "Admin has power to delete any complaint",
    })
    cid = r.json()["id"]

    r2 = client.delete(f"/complaints/{cid}", headers=auth_header(admin_token))
    assert r2.status_code == HTTPStatus.OK


# ───── Pagination + filtering ─────

def test_list_complaints_pagination(client, db):
    _, token = _make_student(db, client, email="pagstu@test.com")
    for i in range(5):
        client.post("/complaints/", headers=auth_header(token), json={
            "title": f"Issue {i} title here",
            "description": f"Long description for issue {i} here",
        })

    r = client.get("/complaints/?page=1&page_size=2", headers=auth_header(token))
    assert r.status_code == HTTPStatus.OK
    data = r.json()
    assert data["total"] == 5
    assert len(data["complaints"]) == 2
    assert data["page"] == 1


def test_filter_by_status(client, db):
    _, token = _make_student(db, client, email="filtstu@test.com")
    client.post("/complaints/", headers=auth_header(token), json={
        "title": "Filter test open",
        "description": "Long enough description for filter test",
    })

    r = client.get("/complaints/?status=open", headers=auth_header(token))
    assert r.status_code == HTTPStatus.OK
    assert r.json()["total"] >= 1


def test_filter_by_category(client, db):
    _, token = _make_student(db, client, email="catstu@test.com")
    client.post("/complaints/", headers=auth_header(token), json={
        "title": "Electrical problem",
        "description": "Socket not working properly here",
        "category": "electrical",
    })

    r = client.get("/complaints/?category=electrical", headers=auth_header(token))
    assert r.status_code == HTTPStatus.OK
    assert all(c["category"] == "electrical" for c in r.json()["complaints"])


# ───── Worker dashboard ─────

def test_worker_sees_assigned_complaints(client, db):
    _, stu_token = _make_student(db, client, email="stuwork@test.com")
    _, warden_token = _make_warden(db, client, email="warwork@test.com")
    worker, worker_token = _make_worker(db, client, email="workdash@test.com")

    r = client.post("/complaints/", headers=auth_header(stu_token), json={
        "title": "Assign me to a worker",
        "description": "This complaint needs worker assignment",
    })
    cid = r.json()["id"]

    client.put(f"/complaints/{cid}/assign", headers=auth_header(warden_token), json={
        "worker_id": worker.id,
    })

    r2 = client.get("/complaints/assigned", headers=auth_header(worker_token))
    assert r2.status_code == HTTPStatus.OK
    assert len(r2.json()) == 1
    assert r2.json()[0]["assigned_to"] == worker.id


# ───── History ─────

def test_complaint_history(client, db):
    _, stu_token = _make_student(db, client, email="histstu@test.com")
    _, warden_token = _make_warden(db, client, email="histwar@test.com")

    r = client.post("/complaints/", headers=auth_header(stu_token), json={
        "title": "History test complaint",
        "description": "This complaint will have history entries",
    })
    cid = r.json()["id"]

    # Warden closes it
    client.put(f"/complaints/{cid}", headers=auth_header(warden_token), json={
        "status": "closed",
    })

    r2 = client.get(f"/complaints/{cid}/history", headers=auth_header(stu_token))
    assert r2.status_code == HTTPStatus.OK
    history = r2.json()
    assert len(history) >= 2  # created + status change
