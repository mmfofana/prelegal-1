"""Tests for /api/parties CRUD endpoints."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def _signup(client: TestClient, email: str = "user@test.com") -> None:
    client.post("/api/auth/signup", json={"email": email, "password": "pass1234"})
    client.post("/api/auth/signin", json={"email": email, "password": "pass1234"})


_PARTY_BODY = {
    "label": "Acme Corp",
    "company": "Acme Corporation",
    "name": "Alice Smith",
    "title": "CEO",
    "address": "alice@acme.com",
}


class TestListParties:
    def test_requires_auth(self, client: TestClient) -> None:
        resp = client.get("/api/parties")
        assert resp.status_code == 401

    def test_returns_empty_list(self, client: TestClient) -> None:
        _signup(client)
        resp = client.get("/api/parties")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_saved_parties(self, client: TestClient) -> None:
        _signup(client)
        client.post("/api/parties", json=_PARTY_BODY)
        resp = client.get("/api/parties")
        assert len(resp.json()) == 1
        assert resp.json()[0]["label"] == "Acme Corp"


class TestCreateParty:
    def test_requires_auth(self, client: TestClient) -> None:
        resp = client.post("/api/parties", json=_PARTY_BODY)
        assert resp.status_code == 401

    def test_creates_party(self, client: TestClient) -> None:
        _signup(client)
        resp = client.post("/api/parties", json=_PARTY_BODY)
        assert resp.status_code == 201
        data = resp.json()
        assert data["label"] == "Acme Corp"
        assert data["company"] == "Acme Corporation"
        assert "id" in data
        assert "created_at" in data

    def test_label_required(self, client: TestClient) -> None:
        _signup(client)
        resp = client.post("/api/parties", json={"company": "Acme"})
        assert resp.status_code == 422


class TestUpdateParty:
    def test_updates_own_party(self, client: TestClient) -> None:
        _signup(client)
        create_resp = client.post("/api/parties", json=_PARTY_BODY)
        party_id = create_resp.json()["id"]

        resp = client.put(f"/api/parties/{party_id}", json={"label": "Updated Label"})
        assert resp.status_code == 200
        assert resp.json()["label"] == "Updated Label"

    def test_404_for_nonexistent(self, client: TestClient) -> None:
        _signup(client)
        resp = client.put("/api/parties/9999", json={"label": "X"})
        assert resp.status_code == 404


class TestDeleteParty:
    def test_deletes_own_party(self, client: TestClient) -> None:
        _signup(client)
        create_resp = client.post("/api/parties", json=_PARTY_BODY)
        party_id = create_resp.json()["id"]

        resp = client.delete(f"/api/parties/{party_id}")
        assert resp.status_code == 204

        list_resp = client.get("/api/parties")
        assert list_resp.json() == []

    def test_404_for_nonexistent(self, client: TestClient) -> None:
        _signup(client)
        resp = client.delete("/api/parties/9999")
        assert resp.status_code == 404

    def test_cannot_delete_other_users_party(self, client: TestClient) -> None:
        _signup(client, "user1@test.com")
        create_resp = client.post("/api/parties", json=_PARTY_BODY)
        party_id = create_resp.json()["id"]

        # Sign in as user 2
        client.post("/api/auth/signup", json={"email": "user2@test.com", "password": "pass1234"})
        client.post("/api/auth/signin", json={"email": "user2@test.com", "password": "pass1234"})

        resp = client.delete(f"/api/parties/{party_id}")
        assert resp.status_code == 404
