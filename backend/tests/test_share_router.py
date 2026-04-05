"""Tests for document share link endpoints."""
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


def _signup_and_save_doc(client: TestClient) -> int:
    client.post("/api/auth/signup", json={"email": "user@test.com", "password": "pass1234"})
    client.post("/api/auth/signin", json={"email": "user@test.com", "password": "pass1234"})
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
    return client.get("/api/documents").json()[0]["id"]


class TestCreateShare:
    def test_requires_auth(self, client: TestClient) -> None:
        resp = client.post("/api/documents/1/share")
        assert resp.status_code == 401

    def test_creates_share_link(self, client: TestClient) -> None:
        doc_id = _signup_and_save_doc(client)
        resp = client.post(f"/api/documents/{doc_id}/share")
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert "url" in data
        assert data["token"] in data["url"]

    def test_404_for_wrong_owner(self, client: TestClient) -> None:
        doc_id = _signup_and_save_doc(client)
        # Sign in as different user
        client.post("/api/auth/signup", json={"email": "other@test.com", "password": "pass1234"})
        client.post("/api/auth/signin", json={"email": "other@test.com", "password": "pass1234"})
        resp = client.post(f"/api/documents/{doc_id}/share")
        assert resp.status_code == 404


class TestGetSharedDocument:
    def test_returns_document_for_valid_token(self, client: TestClient) -> None:
        doc_id = _signup_and_save_doc(client)
        share_resp = client.post(f"/api/documents/{doc_id}/share")
        token = share_resp.json()["token"]

        # Access without auth
        client.cookies.clear()
        resp = client.get(f"/api/share/{token}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["document_type"] == "mutual-nda"
        assert "fields" in data

    def test_404_for_invalid_token(self, client: TestClient) -> None:
        resp = client.get("/api/share/invalidtoken123")
        assert resp.status_code == 404
