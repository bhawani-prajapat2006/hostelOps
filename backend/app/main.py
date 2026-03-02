from http import HTTPStatus
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session

from app.schemas.user import Message, UserSchema, UserPublic, UserDB, UserList
from app.routers import complaints_router
from app.db.database import engine, get_db
from app.db.database import Base
from app import models
from app.db.database import SessionLocal

app = FastAPI()

# create tables at startup/import time (simple for SQLite)
Base.metadata.create_all(bind=engine)

# ensure a default user with id=1 exists to satisfy fake auth and FK relations
session = SessionLocal()
try:
    user_one = session.get(models.User, 1)
    if user_one is None:
        seed = models.User(username="seed_student", email="seed@example.com", password="", role=models.UserRoleEnum.student)
        session.add(seed)
        session.commit()
finally:
    session.close()


@app.get("/", status_code=HTTPStatus.OK, response_model=Message)
def read_root():
    return {"message": "Olá Mundo!"}


@app.post("/users/", status_code=HTTPStatus.CREATED, response_model=UserPublic)
def create_user(user: UserSchema, db: Session = Depends(get_db)):
    db_user = models.User(
        username=user.username,
        email=user.email,
        password=user.password,
        role=models.UserRoleEnum(user.role.value if hasattr(user.role, "value") else user.role),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"id": db_user.id, "username": db_user.username, "email": db_user.email, "role": db_user.role.value}


@app.get("/users/", response_model=UserList)
def read_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return {"users": [{"id": u.id, "username": u.username, "email": u.email, "role": u.role.value} for u in users]}


@app.put("/users/{user_id}", response_model=UserPublic)
def update_user(user_id: int, user: UserSchema, db: Session = Depends(get_db)):
    db_user = db.get(models.User, user_id)
    if not db_user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User Not Found")
    db_user.username = user.username
    db_user.email = user.email
    db_user.password = user.password
    db_user.role = models.UserRoleEnum(user.role.value if hasattr(user.role, "value") else user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"id": db_user.id, "username": db_user.username, "email": db_user.email, "role": db_user.role.value}


@app.delete("/users/{user_id}", response_model=Message)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.get(models.User, user_id)
    if not db_user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User Not Found")
    db.delete(db_user)
    db.commit()
    return {"message": "User Deleted Successfully"}


# register complaints router (implements its own paths)
if complaints_router is not None:
    app.include_router(complaints_router, prefix="/complaints")