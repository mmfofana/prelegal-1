import pytest
from fastapi.testclient import TestClient

from main import app


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
