import os

# Must be set before any app imports so database.py and auth_service.py pick them up
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SESSION_SECRET", "test-secret-not-for-production")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

import pytest
from fastapi.testclient import TestClient

from database import Base, engine, init_db
import models.user  # noqa: F401 — registers User with Base.metadata
from main import app


@pytest.fixture(autouse=True)
def reset_db():
    """Re-create all tables before each test for a clean slate."""
    Base.metadata.drop_all(bind=engine)
    init_db()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def valid_nda_payload():
    return {
        "purpose": "Evaluating a potential business relationship.",
        "effective_date": "2026-01-01",
        "mnda_term": {"type": "expires", "years": 1},
        "term_of_confidentiality": {"type": "years", "years": 2},
        "governing_law": "Delaware",
        "jurisdiction": "New Castle, DE",
        "modifications": "",
        "party1": {
            "company": "Acme Corp",
            "name": "Alice Smith",
            "title": "CEO",
            "address": "alice@acme.com",
        },
        "party2": {
            "company": "Beta LLC",
            "name": "Bob Jones",
            "title": "CTO",
            "address": "bob@beta.com",
        },
    }
