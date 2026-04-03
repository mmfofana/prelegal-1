import json

import pytest
from fastapi.testclient import TestClient

_SIGNUP_URL = "/api/auth/signup"
_DOCS_URL = "/api/documents"
_PDF_URL = "/api/generate-pdf"

_EMAIL = "doc-user@example.com"
_PASSWORD = "securepassword123"
_EMAIL_2 = "other-user@example.com"


def _signup(client: TestClient, email: str = _EMAIL) -> None:
    client.post(_SIGNUP_URL, json={"email": email, "password": _PASSWORD})


def _valid_pdf_payload(document_type: str = "mutual-nda") -> dict:
    return {
        "document_type": document_type,
        "effective_date": "2026-01-01",
        "governing_law": "Delaware",
        "jurisdiction": "New Castle, DE",
        "party1": {"company": "Acme Corp", "name": "Alice", "title": "CEO", "address": "alice@acme.com"},
        "party2": {"company": "Beta LLC", "name": "Bob", "title": "CTO", "address": "bob@beta.com"},
        "extra_fields": {
            "purpose": "Evaluating a potential business relationship.",
            "mnda_term_type": "expires",
            "mnda_term_years": "1",
            "term_of_confidentiality_type": "years",
            "term_of_confidentiality_years": "2",
            "modifications": "",
        },
    }


class TestListDocuments:
    def test_requires_auth(self, client: TestClient):
        r = client.get(_DOCS_URL)
        assert r.status_code == 401

    def test_returns_empty_list_for_new_user(self, client: TestClient):
        _signup(client)
        r = client.get(_DOCS_URL)
        assert r.status_code == 200
        assert r.json() == []

    def test_returns_document_after_pdf_download(self, client: TestClient):
        _signup(client)
        client.post(_PDF_URL, json=_valid_pdf_payload())
        r = client.get(_DOCS_URL)
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) == 1
        assert docs[0]["document_type"] == "mutual-nda"
        assert "Acme Corp" in docs[0]["title"]
        assert "Beta LLC" in docs[0]["title"]

    def test_returns_documents_newest_first(self, client: TestClient):
        _signup(client)
        client.post(_PDF_URL, json=_valid_pdf_payload("mutual-nda"))
        client.post(_PDF_URL, json=_valid_pdf_payload("cloud-service-agreement"))
        r = client.get(_DOCS_URL)
        docs = r.json()
        assert len(docs) == 2
        assert docs[0]["document_type"] == "cloud-service-agreement"

    def test_only_returns_own_documents(self, client: TestClient):
        _signup(client)
        client.post(_PDF_URL, json=_valid_pdf_payload())

        # Sign in as different user
        client.post(_SIGNUP_URL, json={"email": _EMAIL_2, "password": _PASSWORD})
        r = client.get(_DOCS_URL)
        assert r.json() == []


class TestGetDocument:
    def test_requires_auth(self, client: TestClient):
        r = client.get(f"{_DOCS_URL}/1")
        assert r.status_code == 401

    def test_returns_404_for_unknown_id(self, client: TestClient):
        _signup(client)
        r = client.get(f"{_DOCS_URL}/999")
        assert r.status_code == 404

    def test_returns_404_for_other_users_document(self, client: TestClient):
        _signup(client)
        client.post(_PDF_URL, json=_valid_pdf_payload())
        doc_id = client.get(_DOCS_URL).json()[0]["id"]

        # Sign in as different user
        client.post(_SIGNUP_URL, json={"email": _EMAIL_2, "password": _PASSWORD})
        r = client.get(f"{_DOCS_URL}/{doc_id}")
        assert r.status_code == 404

    def test_returns_full_fields(self, client: TestClient):
        _signup(client)
        client.post(_PDF_URL, json=_valid_pdf_payload())
        doc_id = client.get(_DOCS_URL).json()[0]["id"]

        r = client.get(f"{_DOCS_URL}/{doc_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["document_type"] == "mutual-nda"
        assert data["fields"]["party1"]["company"] == "Acme Corp"
        assert data["fields"]["extra_fields"]["purpose"] == "Evaluating a potential business relationship."


class TestDeleteDocument:
    def test_requires_auth(self, client: TestClient):
        r = client.delete(f"{_DOCS_URL}/1")
        assert r.status_code == 401

    def test_returns_404_for_unknown_id(self, client: TestClient):
        _signup(client)
        r = client.delete(f"{_DOCS_URL}/999")
        assert r.status_code == 404

    def test_deletes_own_document(self, client: TestClient):
        _signup(client)
        client.post(_PDF_URL, json=_valid_pdf_payload())
        doc_id = client.get(_DOCS_URL).json()[0]["id"]

        r = client.delete(f"{_DOCS_URL}/{doc_id}")
        assert r.status_code == 204

        r = client.get(_DOCS_URL)
        assert r.json() == []

    def test_cannot_delete_other_users_document(self, client: TestClient):
        _signup(client)
        client.post(_PDF_URL, json=_valid_pdf_payload())
        doc_id = client.get(_DOCS_URL).json()[0]["id"]

        client.post(_SIGNUP_URL, json={"email": _EMAIL_2, "password": _PASSWORD})
        r = client.delete(f"{_DOCS_URL}/{doc_id}")
        assert r.status_code == 404


class TestPdfSavesDocument:
    def test_authenticated_pdf_download_saves_document(self, client: TestClient):
        _signup(client)
        r = client.post(_PDF_URL, json=_valid_pdf_payload())
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"

        docs = client.get(_DOCS_URL).json()
        assert len(docs) == 1

    def test_unauthenticated_pdf_download_does_not_save(self, client: TestClient):
        # No signup — no session cookie
        r = client.post(_PDF_URL, json=_valid_pdf_payload())
        assert r.status_code == 200  # PDF still generated

        # Sign up and check — no docs
        _signup(client)
        docs = client.get(_DOCS_URL).json()
        assert docs == []


class TestDocumentTitle:
    def test_title_includes_both_companies(self, client: TestClient):
        _signup(client)
        client.post(_PDF_URL, json=_valid_pdf_payload())
        doc = client.get(_DOCS_URL).json()[0]
        assert doc["title"] == "Acme Corp / Beta LLC — Mutual Non-Disclosure Agreement"

    def test_title_fallback_when_no_companies(self, client: TestClient):
        _signup(client)
        payload = _valid_pdf_payload()
        payload["party1"]["company"] = ""
        payload["party2"]["company"] = ""
        client.post(_PDF_URL, json=payload)
        doc = client.get(_DOCS_URL).json()[0]
        assert doc["title"] == "Mutual Non-Disclosure Agreement — Draft"
