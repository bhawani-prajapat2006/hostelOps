from http import HTTPStatus
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.room import RoomCreate, RoomPublic, RoomUpdate, RoomAssignRequest, RoomAssignmentPublic, PaginatedRooms
from app.schemas.user import Message
from app.core.auth import require_role, get_current_user
from app.db.database import get_db
from app import models

router = APIRouter()


@router.post("/", response_model=RoomPublic, status_code=HTTPStatus.CREATED)
def create_room(
    room: RoomCreate,
    current_user: dict = Depends(require_role("admin", "warden")),
    db: Session = Depends(get_db),
):
    existing = db.query(models.Room).filter(models.Room.room_number == room.room_number).first()
    if existing:
        raise HTTPException(status_code=HTTPStatus.CONFLICT, detail="Room number already exists")

    db_room = models.Room(**room.model_dump())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return _room_with_occupants(db_room, db)


@router.get("/", response_model=PaginatedRooms)
def list_rooms(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    hostel_name: str | None = None,
    available_only: bool = False,
):
    query = db.query(models.Room)
    if hostel_name:
        query = query.filter(models.Room.hostel_name == hostel_name)
    if available_only:
        query = query.filter(models.Room.is_available == True)

    total = query.count()
    rooms = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "rooms": [_room_with_occupants(r, db) for r in rooms],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{room_id}", response_model=RoomPublic)
def get_room(room_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Room not found")
    return _room_with_occupants(room, db)


@router.put("/{room_id}", response_model=RoomPublic)
def update_room(
    room_id: int,
    payload: RoomUpdate,
    current_user: dict = Depends(require_role("admin", "warden")),
    db: Session = Depends(get_db),
):
    room = db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Room not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(room, field, value)
    db.commit()
    db.refresh(room)
    return _room_with_occupants(room, db)


@router.delete("/{room_id}", response_model=Message)
def delete_room(
    room_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    room = db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Room not found")
    db.delete(room)
    db.commit()
    return {"message": "Room deleted"}


# ───── Room assignments ─────

@router.post("/{room_id}/assign", response_model=RoomAssignmentPublic, status_code=HTTPStatus.CREATED)
def assign_student_to_room(
    room_id: int,
    payload: RoomAssignRequest,
    current_user: dict = Depends(require_role("admin", "warden")),
    db: Session = Depends(get_db),
):
    room = db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Room not found")

    current_occupants = db.query(models.RoomAssignment).filter(models.RoomAssignment.room_id == room_id).count()
    if current_occupants >= room.capacity:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Room is full")

    student = db.get(models.User, payload.student_id)
    if not student or student.role != models.UserRoleEnum.student:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Invalid student")

    existing = db.query(models.RoomAssignment).filter(models.RoomAssignment.student_id == payload.student_id).first()
    if existing:
        raise HTTPException(status_code=HTTPStatus.CONFLICT, detail="Student is already assigned to a room")

    assignment = models.RoomAssignment(room_id=room_id, student_id=payload.student_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{room_id}/assign/{student_id}", response_model=Message)
def unassign_student(
    room_id: int,
    student_id: int,
    current_user: dict = Depends(require_role("admin", "warden")),
    db: Session = Depends(get_db),
):
    assignment = db.query(models.RoomAssignment).filter(
        models.RoomAssignment.room_id == room_id,
        models.RoomAssignment.student_id == student_id,
    ).first()
    if not assignment:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return {"message": "Student unassigned from room"}


def _room_with_occupants(room: models.Room, db: Session) -> dict:
    occupants = db.query(models.RoomAssignment).filter(models.RoomAssignment.room_id == room.id).count()
    return {
        "id": room.id,
        "room_number": room.room_number,
        "hostel_name": room.hostel_name,
        "capacity": room.capacity,
        "floor": room.floor,
        "is_available": room.is_available,
        "created_at": room.created_at,
        "occupants": occupants,
    }
