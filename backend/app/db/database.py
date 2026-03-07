from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

# Lazy engine — initialized on first use so tests can override DATABASE_URL
_engine = None
_SessionLocal = None


def _get_engine():
    global _engine
    if _engine is None:
        from app.core.config import settings
        connect_args = {}
        url = settings.DATABASE_URL

        if url.startswith("sqlite"):
            connect_args["check_same_thread"] = False
            _engine = create_engine(url, connect_args=connect_args, echo=False)
        else:
            # PostgreSQL / production: use connection pooling
            _engine = create_engine(
                url,
                echo=False,
                pool_size=5,
                max_overflow=10,
                pool_timeout=30,
                pool_recycle=1800,  # recycle connections every 30 min
            )
    return _engine


def _get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_get_engine())
    return _SessionLocal


# Backwards-compatible `engine` property for create_all in main.py
class _EngineProxy:
    """Lazy proxy so `from app.db.database import engine` still works."""
    def __getattr__(self, name):
        return getattr(_get_engine(), name)

    def __repr__(self):
        return repr(_get_engine())


engine = _EngineProxy()


def get_db():
    SessionLocal = _get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
