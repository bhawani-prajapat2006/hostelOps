"""Tests for room management: CRUD, assignments."""

from http import HTTPStatus
from tests.conftest import create_user_and_token, auth_header


def test_create_room(client, db):
    _, token = create_user_and_token(db, client, username="warden", email="war@test.com", role="warden")
    r = client.post("/rooms/", headers=auth_header(token), json={
        "room_number": "A101",
        "hostel_name": "Hostel A",
        "capacity": 2,
        "floor": 1,
    })
    assert r.status_code == HTTPStatus.CREATED
    assert r.json()["room_number"] == "A101"
    assert r.json()["occupants"] == 0


def test_student_cannot_create_room(client, db):
    _, token = create_user_and_token(db, client, username="student", email="stu@test.com", role="student")
    r = client.post("/rooms/", headers=auth_header(token), json={
        "room_number": "A102",
        "hostel_name": "Hostel A",
        "capacity": 1,
    })
    assert r.status_code == HTTPStatus.FORBIDDEN


def test_list_rooms_pagination(client, db):
    _, token = create_user_and_token(db, client, username="warden", email="warlist@test.com", role="warden")
    for i in range(3):
        client.post("/rooms/", headers=auth_header(token), json={
            "room_number": f"B{100+i}",
            "hostel_name": "Hostel B",
            "capacity": 2,
        })

    r = client.get("/rooms/?page=1&page_size=2", headers=auth_header(token))
    assert r.status_code == HTTPStatus.OK
    assert r.json()["total"] == 3
    assert len(r.json()["rooms"]) == 2


def test_assign_student_to_room(client, db):
    _, warden_token = create_user_and_token(db, client, username="warden", email="warassign@test.com", role="warden")
    student, _ = create_user_and_token(db, client, username="student", email="stuassign@test.com", role="student")

    r = client.post("/rooms/", headers=auth_header(warden_token), json={
        "room_number": "C101",
        "hostel_name": "Hostel C",
        "capacity": 2,
    })
    room_id = r.json()["id"]

    r2 = client.post(f"/rooms/{room_id}/assign", headers=auth_header(warden_token), json={
        "student_id": student.id,
    })
    assert r2.status_code == HTTPStatus.CREATED


def test_cannot_assign_beyond_capacity(client, db):
    _, warden_token = create_user_and_token(db, client, username="warden", email="warcap@test.com", role="warden")
    stu1, _ = create_user_and_token(db, client, username="s1", email="s1@test.com", role="student")
    stu2, _ = create_user_and_token(db, client, username="s2", email="s2@test.com", role="student")

    r = client.post("/rooms/", headers=auth_header(warden_token), json={
        "room_number": "D101",
        "hostel_name": "Hostel D",
        "capacity": 1,
    })
    room_id = r.json()["id"]

    client.post(f"/rooms/{room_id}/assign", headers=auth_header(warden_token), json={"student_id": stu1.id})
    r2 = client.post(f"/rooms/{room_id}/assign", headers=auth_header(warden_token), json={"student_id": stu2.id})
    assert r2.status_code == HTTPStatus.BAD_REQUEST
    assert "full" in r2.json()["detail"].lower()


def test_unassign_student(client, db):
    _, warden_token = create_user_and_token(db, client, username="warden", email="warunas@test.com", role="warden")
    student, _ = create_user_and_token(db, client, username="student", email="stuunas@test.com", role="student")

    r = client.post("/rooms/", headers=auth_header(warden_token), json={
        "room_number": "E101",
        "hostel_name": "Hostel E",
        "capacity": 2,
    })
    room_id = r.json()["id"]
    client.post(f"/rooms/{room_id}/assign", headers=auth_header(warden_token), json={"student_id": student.id})

    r2 = client.delete(f"/rooms/{room_id}/assign/{student.id}", headers=auth_header(warden_token))
    assert r2.status_code == HTTPStatus.OK


def test_duplicate_room_number(client, db):
    _, token = create_user_and_token(db, client, username="warden", email="wardup@test.com", role="warden")
    client.post("/rooms/", headers=auth_header(token), json={
        "room_number": "F101",
        "hostel_name": "Hostel F",
        "capacity": 1,
    })
    r = client.post("/rooms/", headers=auth_header(token), json={
        "room_number": "F101",
        "hostel_name": "Hostel F",
        "capacity": 1,
    })
    assert r.status_code == HTTPStatus.CONFLICT
