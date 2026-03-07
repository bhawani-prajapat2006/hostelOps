"""Shared test fixtures — in-memory DB, test client, helper functions."""

import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Override DATABASE_URL BEFORE importing anything from app
os.environ["DATABASE_URL"] = "sqlite:///file::memory:?cache=shared"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-1234567890"

from app.db.database import Base, get_db, _get_engine  # noqa: E402
from app.main import app  # noqa: E402
from app import models  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.core.limiter import limiter  # noqa: E402

# Disable rate limiting during tests
limiter.enabled = False


# In-memory engine shared by all tests
TEST_ENGINE = create_engine("sqlite:///file::memory:?cache=shared", connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test and drop them after."""
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture
def db():
    """Direct DB session for test setup."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    return TestClient(app)


# ───── Helper: create user and return (user_obj, token) ─────

def create_user_and_token(
    db_session,
    client: TestClient,
    username: str = "testuser",
    email: str = "test@example.com",
    password: str = "TestPass1",
    role: str = "student",
) -> tuple:
    """Create a user in the DB and return (user, access_token)."""
    user = models.User(
        username=username,
        email=email,
        password=hash_password(password),
        role=models.UserRoleEnum(role),
        auth_provider="local",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Login to get a token
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed: {r.json()}"
    token = r.json()["access_token"]
    return user, token


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
