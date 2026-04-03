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
    """Valid payload for POST /api/generate-pdf using the new generic format."""
    return {
        "document_type": "mutual-nda",
        "effective_date": "2026-01-01",
        "governing_law": "Delaware",
        "jurisdiction": "New Castle, DE",
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
        "extra_fields": {
            "purpose": "Evaluating a potential business relationship.",
            "mnda_term_type": "expires",
            "mnda_term_years": "1",
            "term_of_confidentiality_type": "years",
            "term_of_confidentiality_years": "2",
            "modifications": "",
        },
    }


@pytest.fixture
def valid_cloud_service_payload():
    """Valid payload for POST /api/generate-pdf using Cloud Service Agreement."""
    return {
        "document_type": "cloud-service-agreement",
        "effective_date": "2026-01-01",
        "governing_law": "California",
        "jurisdiction": "Santa Clara County, CA",
        "party1": {
            "company": "CloudCo Inc.",
            "name": "Carol Chen",
            "title": "CEO",
            "address": "carol@cloudco.com",
        },
        "party2": {
            "company": "Customer Corp",
            "name": "Dave Davis",
            "title": "CTO",
            "address": "dave@customer.com",
        },
        "extra_fields": {
            "cloud_service_name": "CloudCo Platform",
            "subscription_period": "1 year",
            "fees": "$1,000/month",
            "payment_process": "invoicing",
            "general_cap_amount": "fees paid in the prior 12 months",
            "increased_cap_amount": "2x fees paid in the prior 12 months",
            "additional_warranties": "",
        },
    }
