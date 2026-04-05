"""Tests for document version history endpoints."""
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


def _signup_and_save_doc(client: TestClient, email: str = "user@test.com") -> int:
    client.post("/api/auth/signup", json={"email": email, "password": "pass1234"})
    client.post("/api/auth/signin", json={"email": email, "password": "pass1234"})
    # Save a document by downloading a PDF
    payload = {
        "document_type": "mutual-nda",
        "effective_date": "2026-01-01",
        "governing_law": "Delaware",
        "jurisdiction": "New Castle, DE",
        "party1": {"company": "Acme", "name": "Alice", "title": "CEO", "address": "a@acme.com"},
        "party2": {"company": "Beta", "name": "Bob", "title": "CTO", "address": "b@beta.com"},
        "extra_fields": {
            "purpose": "Test",
            "mnda_term_type": "expires",
            "mnda_term_years": "1",
            "term_of_confidentiality_type": "years",
            "term_of_confidentiality_years": "2",
            "modifications": "",
        },
    }
    with patch("services.pdf_service.generate_pdf", return_value=b"%PDF-fake"):
        client.post("/api/generate-pdf", json=payload)
    docs = client.get("/api/documents").json()
    return docs[0]["id"]


class TestListVersions:
    def test_requires_auth(self, client: TestClient) -> None:
        resp = client.get("/api/documents/1/versions")
        assert resp.status_code == 401

    def test_returns_version_after_save(self, client: TestClient) -> None:
        doc_id = _signup_and_save_doc(client)
        resp = client.get(f"/api/documents/{doc_id}/versions")
        assert resp.status_code == 200
        versions = resp.json()
        assert len(versions) == 1
        assert versions[0]["version_number"] == 1
        assert "created_at" in versions[0]

    def test_404_for_nonexistent_doc(self, client: TestClient) -> None:
        client.post("/api/auth/signup", json={"email": "user@test.com", "password": "pass1234"})
        client.post("/api/auth/signin", json={"email": "user@test.com", "password": "pass1234"})
        resp = client.get("/api/documents/9999/versions")
        assert resp.status_code == 404


class TestGetVersion:
    def test_returns_version_detail(self, client: TestClient) -> None:
        doc_id = _signup_and_save_doc(client)
        resp = client.get(f"/api/documents/{doc_id}/versions/1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["version_number"] == 1
        assert "fields" in data

    def test_404_for_nonexistent_version(self, client: TestClient) -> None:
        doc_id = _signup_and_save_doc(client)
        resp = client.get(f"/api/documents/{doc_id}/versions/999")
        assert resp.status_code == 404

    def test_isolated_between_users(self, client: TestClient) -> None:
        doc_id = _signup_and_save_doc(client, "user1@test.com")

        # Sign in as a different user
        client.post("/api/auth/signup", json={"email": "user2@test.com", "password": "pass1234"})
        client.post("/api/auth/signin", json={"email": "user2@test.com", "password": "pass1234"})

        resp = client.get(f"/api/documents/{doc_id}/versions")
        assert resp.status_code == 404
