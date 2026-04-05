"""Tests for POST /api/generate-docx."""
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

_VALID_BODY = {
    "document_type": "mutual-nda",
    "effective_date": "2026-01-01",
    "governing_law": "Delaware",
    "jurisdiction": "New Castle, DE",
    "party1": {"company": "Acme Corp", "name": "Alice", "title": "CEO", "address": "alice@acme.com"},
    "party2": {"company": "Beta LLC", "name": "Bob", "title": "CTO", "address": "bob@beta.com"},
    "extra_fields": {
        "purpose": "Evaluating a business relationship.",
        "mnda_term_type": "expires",
        "mnda_term_years": "1",
        "term_of_confidentiality_type": "years",
        "term_of_confidentiality_years": "2",
        "modifications": "",
    },
}


class TestDocxGeneration:
    def test_valid_payload_returns_docx(self, client: TestClient) -> None:
        resp = client.post("/api/generate-docx", json=_VALID_BODY)
        assert resp.status_code == 200
        assert DOCX_MIME in resp.headers["content-type"]
        assert "mutual-nda.docx" in resp.headers["content-disposition"]
        assert len(resp.content) > 0

    def test_unauthenticated_user_can_download(self, client: TestClient) -> None:
        resp = client.post("/api/generate-docx", json=_VALID_BODY)
        assert resp.status_code == 200

    def test_invalid_document_type_returns_422(self, client: TestClient) -> None:
        body = {**_VALID_BODY, "document_type": "not-a-real-type"}
        resp = client.post("/api/generate-docx", json=body)
        assert resp.status_code == 422

    def test_generation_error_returns_500(self, client: TestClient) -> None:
        with patch("routers.docx.generate_docx", side_effect=RuntimeError("fail")):
            resp = client.post("/api/generate-docx", json=_VALID_BODY)
        assert resp.status_code == 500
