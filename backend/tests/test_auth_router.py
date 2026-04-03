import pytest
from fastapi.testclient import TestClient


_SIGNUP_URL = "/api/auth/signup"
_SIGNIN_URL = "/api/auth/signin"
_SIGNOUT_URL = "/api/auth/signout"
_ME_URL = "/api/auth/me"

_VALID_EMAIL = "alice@example.com"
_VALID_PASSWORD = "securepassword123"


def _signup(client: TestClient, email: str = _VALID_EMAIL, password: str = _VALID_PASSWORD):
    return client.post(_SIGNUP_URL, json={"email": email, "password": password})


class TestSignup:
    def test_signup_creates_user(self, client: TestClient):
        r = _signup(client)
        assert r.status_code == 201
        data = r.json()
        assert data["email"] == _VALID_EMAIL
        assert "id" in data
        assert "hashed_password" not in data

    def test_signup_sets_session_cookie(self, client: TestClient):
        r = _signup(client)
        assert r.status_code == 201
        assert "session" in r.cookies

    def test_signup_duplicate_email_returns_409(self, client: TestClient):
        _signup(client)
        r = _signup(client)
        assert r.status_code == 409

    def test_signup_short_password_returns_422(self, client: TestClient):
        r = client.post(_SIGNUP_URL, json={"email": _VALID_EMAIL, "password": "short"})
        assert r.status_code == 422

    def test_signup_invalid_email_returns_422(self, client: TestClient):
        r = client.post(_SIGNUP_URL, json={"email": "not-an-email", "password": _VALID_PASSWORD})
        assert r.status_code == 422


class TestSignin:
    def test_signin_returns_user(self, client: TestClient):
        _signup(client)
        r = client.post(_SIGNIN_URL, json={"email": _VALID_EMAIL, "password": _VALID_PASSWORD})
        assert r.status_code == 200
        assert r.json()["email"] == _VALID_EMAIL

    def test_signin_sets_session_cookie(self, client: TestClient):
        _signup(client)
        r = client.post(_SIGNIN_URL, json={"email": _VALID_EMAIL, "password": _VALID_PASSWORD})
        assert "session" in r.cookies

    def test_signin_wrong_password_returns_401(self, client: TestClient):
        _signup(client)
        r = client.post(_SIGNIN_URL, json={"email": _VALID_EMAIL, "password": "wrongpassword"})
        assert r.status_code == 401
        assert r.json()["detail"] == "Invalid email or password"

    def test_signin_unknown_email_returns_401(self, client: TestClient):
        r = client.post(_SIGNIN_URL, json={"email": "nobody@example.com", "password": _VALID_PASSWORD})
        assert r.status_code == 401
        assert r.json()["detail"] == "Invalid email or password"


class TestSignout:
    def test_signout_returns_200(self, client: TestClient):
        _signup(client)
        r = client.post(_SIGNOUT_URL)
        assert r.status_code == 200

    def test_signout_clears_cookie(self, client: TestClient):
        _signup(client)
        client.post(_SIGNOUT_URL)
        # After signout, /me should return 401
        r = client.get(_ME_URL)
        assert r.status_code == 401


class TestMe:
    def test_me_returns_user_when_authenticated(self, client: TestClient):
        _signup(client)
        r = client.get(_ME_URL)
        assert r.status_code == 200
        assert r.json()["email"] == _VALID_EMAIL

    def test_me_returns_401_without_cookie(self, client: TestClient):
        r = client.get(_ME_URL)
        assert r.status_code == 401

    def test_me_returns_401_with_invalid_cookie(self, client: TestClient):
        client.cookies.set("session", "invalid-token")
        r = client.get(_ME_URL)
        assert r.status_code == 401
