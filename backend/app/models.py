import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base


class UserRoleEnum(str, enum.Enum):
    student = "student"
    warden = "warden"
    admin = "admin"


class ComplaintStatusEnum(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=False)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRoleEnum), default=UserRoleEnum.student, nullable=False)

    complaints = relationship("Complaint", back_populates="creator", cascade="all, delete-orphan")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ComplaintStatusEnum), default=ComplaintStatusEnum.open, nullable=False)

    creator = relationship("User", back_populates="complaints")
