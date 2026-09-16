def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "password": "strongpassword1",
            "business_name": "Jane's Bakery",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "jane@example.com"
    assert "hashed_password" not in body


def test_register_duplicate_email_fails(client):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "password": "strongpassword1",
    }
    client.post("/api/v1/auth/register", json=payload)
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400


def test_login_success_returns_jwt(client):
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "Jane Doe", "email": "jane@example.com", "password": "strongpassword1"},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "jane@example.com", "password": "strongpassword1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "Jane Doe", "email": "jane@example.com", "password": "strongpassword1"},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "jane@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_me_requires_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_with_valid_token(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
