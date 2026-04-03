"""Integration tests for POST /api/generate-pdf."""

import pytest


class TestGeneratePdfEndpoint:
    def test_returns_pdf_on_valid_input(self, client, valid_nda_payload):
        res = client.post("/api/generate-pdf", json=valid_nda_payload)
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert res.content[:4] == b"%PDF"

    def test_content_disposition_header(self, client, valid_nda_payload):
        res = client.post("/api/generate-pdf", json=valid_nda_payload)
        assert "mutual-nda.pdf" in res.headers["content-disposition"]

    def test_missing_purpose_returns_422(self, client, valid_nda_payload):
        payload = {k: v for k, v in valid_nda_payload.items() if k != "purpose"}
        res = client.post("/api/generate-pdf", json=payload)
        assert res.status_code == 422

    def test_missing_party1_returns_422(self, client, valid_nda_payload):
        payload = {k: v for k, v in valid_nda_payload.items() if k != "party1"}
        res = client.post("/api/generate-pdf", json=payload)
        assert res.status_code == 422

    def test_expires_with_no_years_returns_422(self, client, valid_nda_payload):
        payload = {
            **valid_nda_payload,
            "mnda_term": {"type": "expires", "years": None},
        }
        res = client.post("/api/generate-pdf", json=payload)
        assert res.status_code == 422

    def test_continues_without_years_is_valid(self, client, valid_nda_payload):
        payload = {
            **valid_nda_payload,
            "mnda_term": {"type": "continues", "years": None},
        }
        res = client.post("/api/generate-pdf", json=payload)
        assert res.status_code == 200

    def test_perpetuity_without_years_is_valid(self, client, valid_nda_payload):
        payload = {
            **valid_nda_payload,
            "term_of_confidentiality": {"type": "perpetuity", "years": None},
        }
        res = client.post("/api/generate-pdf", json=payload)
        assert res.status_code == 200

    def test_health_endpoint(self, client):
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}
