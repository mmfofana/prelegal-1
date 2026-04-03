import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool


DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./prelegal.db")

# StaticPool ensures all connections share the same in-memory SQLite database.
# Required for testing; harmless for file-based SQLite.
_engine_kwargs: dict = {"connect_args": {"check_same_thread": False}}
if DATABASE_URL == "sqlite:///:memory:":
    _engine_kwargs["poolclass"] = StaticPool

engine = create_engine(DATABASE_URL, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from models import user, saved_document  # noqa: F401 — ensures models are registered with Base

    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
