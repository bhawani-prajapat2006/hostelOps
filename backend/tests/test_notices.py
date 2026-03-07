"""Tests for notice board: CRUD, pinning, pagination."""

from http import HTTPStatus
from tests.conftest import create_user_and_token, auth_header


def test_warden_creates_notice(client, db):
    _, token = create_user_and_token(db, client, username="warden", email="war@test.com", role="warden")
    r = client.post("/notices/", headers=auth_header(token), json={
        "title": "Water supply cut",
        "content": "Water will be cut from 2pm to 4pm tomorrow for maintenance.",
    })
    assert r.status_code == HTTPStatus.CREATED
    assert r.json()["title"] == "Water supply cut"


def test_student_cannot_create_notice(client, db):
    _, token = create_user_and_token(db, client, username="student", email="stu@test.com", role="student")
    r = client.post("/notices/", headers=auth_header(token), json={
        "title": "My notice",
        "content": "Students can't post notices to the board.",
    })
    assert r.status_code == HTTPStatus.FORBIDDEN


def test_list_notices_pagination(client, db):
    _, token = create_user_and_token(db, client, username="warden", email="warlist@test.com", role="warden")
    for i in range(5):
        client.post("/notices/", headers=auth_header(token), json={
            "title": f"Notice {i}",
            "content": f"Content for notice {i} is here with some text.",
        })

    _, stu_token = create_user_and_token(db, client, username="student", email="stulist@test.com", role="student")
    r = client.get("/notices/?page=1&page_size=3", headers=auth_header(stu_token))
    assert r.status_code == HTTPStatus.OK
    assert r.json()["total"] == 5
    assert len(r.json()["notices"]) == 3


def test_update_notice(client, db):
    _, token = create_user_and_token(db, client, username="warden", email="warup@test.com", role="warden")
    r = client.post("/notices/", headers=auth_header(token), json={
        "title": "Original notice title",
        "content": "Original content that will be updated.",
    })
    nid = r.json()["id"]

    r2 = client.put(f"/notices/{nid}", headers=auth_header(token), json={
        "title": "Updated notice title",
        "is_pinned": True,
    })
    assert r2.status_code == HTTPStatus.OK
    assert r2.json()["title"] == "Updated notice title"
    assert r2.json()["is_pinned"] is True


def test_admin_deletes_notice(client, db):
    _, warden_token = create_user_and_token(db, client, username="warden", email="wardel@test.com", role="warden")
    r = client.post("/notices/", headers=auth_header(warden_token), json={
        "title": "Delete me notice",
        "content": "This notice will be deleted by admin.",
    })
    nid = r.json()["id"]

    _, admin_token = create_user_and_token(db, client, username="admin", email="admindel@test.com", role="admin")
    r2 = client.delete(f"/notices/{nid}", headers=auth_header(admin_token))
    assert r2.status_code == HTTPStatus.OK


def test_pinned_notices_come_first(client, db):
    _, token = create_user_and_token(db, client, username="warden", email="warpin@test.com", role="warden")
    # Create regular notice first
    client.post("/notices/", headers=auth_header(token), json={
        "title": "Regular notice here",
        "content": "This is a regular unpinned notice for testing.",
    })
    # Then a pinned one
    client.post("/notices/", headers=auth_header(token), json={
        "title": "PINNED notice here",
        "content": "This pinned notice should appear first in the list.",
        "is_pinned": True,
    })

    r = client.get("/notices/", headers=auth_header(token))
    notices = r.json()["notices"]
    assert notices[0]["is_pinned"] is True
