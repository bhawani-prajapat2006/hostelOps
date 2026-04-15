import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class UserRoleEnum(str, enum.Enum):
    student = "student"
    worker = "worker"
    warden = "warden"
    admin = "admin"


class UserStatusEnum(str, enum.Enum):
    pending = "pending"      # Awaiting admin approval
    active = "active"        # Approved and active
    inactive = "inactive"    # Deactivated by admin


class ComplaintStatusEnum(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"


class ComplaintCategoryEnum(str, enum.Enum):
    plumbing = "plumbing"
    electrical = "electrical"
    cleanliness = "cleanliness"
    furniture = "furniture"
    network = "network"
    other = "other"


# ───── Hostels ─────

class Hostel(Base):
    __tablename__ = "hostels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    address = Column(String(255), nullable=True)
    total_rooms = Column(Integer, nullable=True)  # Total rooms in hostel
    capacity = Column(Integer, nullable=True)  # Max students overall
    warden_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Assigned warden
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    # Relationships
    users = relationship("User", foreign_keys="[User.hostel_id]", back_populates="hostel")
    complaints = relationship("Complaint", foreign_keys="[Complaint.hostel_id]", back_populates="hostel")
    warden = relationship("User", foreign_keys="[Hostel.warden_id]")


# ───── Users ─────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    password = Column(String, nullable=True)  # nullable for Google OAuth users
    role = Column(Enum(UserRoleEnum), default=UserRoleEnum.student, nullable=False)
    status = Column(Enum(UserStatusEnum), default=UserStatusEnum.active, nullable=False)  # pending for worker/warden, active otherwise
    auth_provider = Column(String, default="local", nullable=False)  # "local" or "google"

    # Hostel assignment (for students, workers, wardens)
    hostel_id = Column(Integer, ForeignKey("hostels.id"), nullable=True)

    # Worker work type (for workers only)
    work_type = Column(String(50), nullable=True)  # e.g., "plumbing", "electrical", etc.

    # Student profile fields
    phone = Column(String(15), nullable=True)
    hostel_name = Column(String(100), nullable=True)
    room_number = Column(String(20), nullable=True)
    batch = Column(String(20), nullable=True)

    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    # Relationships
    hostel = relationship("Hostel", foreign_keys="[User.hostel_id]", back_populates="users")
    complaints = relationship("Complaint", foreign_keys="[Complaint.created_by]", back_populates="creator", cascade="all, delete-orphan")


# ───── Complaints ─────

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(ComplaintCategoryEnum), default=ComplaintCategoryEnum.other, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(ComplaintStatusEnum), default=ComplaintStatusEnum.open, nullable=False)
    image_url = Column(String(512), nullable=True)
    image_after_solved = Column(String(512), nullable=True)
    awaiting_warden_review = Column(Boolean, default=False, nullable=False)

    # Hostel this complaint is from
    hostel_id = Column(Integer, ForeignKey("hostels.id"), nullable=False)

    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    creator = relationship("User", foreign_keys=[created_by], back_populates="complaints")
    assigned_worker = relationship("User", foreign_keys=[assigned_to])
    hostel = relationship("Hostel", foreign_keys="[Complaint.hostel_id]", back_populates="complaints")
    history = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintHistory.created_at")


class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="history")
    user = relationship("User", foreign_keys=[changed_by])


# ───── Token Blacklist ─────

class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String(64), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)
