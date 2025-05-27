import pytest


def test_success_register(client, app):
    """Test successful user registration"""
    response = client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
        },
        content_type="application/json",
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "New user is created"
    assert "id" in data
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


def test_success_login(client, auth):
    """Test successful user login"""
    # First register a user
    auth.register(username="testuser", email="test@example.com", password="testpass123")

    # Then try to login
    response = client.post(
        "/auth/login",
        json={"identifier": "test@example.com", "password": "testpass123"},
        content_type="application/json",
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Logged in successfully"
    assert "user" in data
    assert data["user"]["username"] == "testuser"
    assert data["user"]["email"] == "test@example.com"


def test_register_existing_username(client, auth):
    """Test registration with existing username"""
    # First register a user
    auth.register(username="testuser", email="test@example.com", password="testpass123")

    # Try to register with same username but different email
    response = client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "different@example.com",
            "password": "testpass123",
        },
        content_type="application/json",
    )
    assert response.status_code == 409
    data = response.get_json()
    assert "error" in data
    assert "already exists" in data["error"].lower()


def test_register_existing_email(client, auth):
    """Test registration with existing email"""
    # First register a user
    auth.register(username="testuser", email="test@example.com", password="testpass123")

    # Try to register with same email but different username
    response = client.post(
        "/auth/register",
        json={
            "username": "differentuser",
            "email": "test@example.com",
            "password": "testpass123",
        },
        content_type="application/json",
    )
    assert response.status_code == 409
    data = response.get_json()
    assert "error" in data


def test_login_invalid_email(client, auth):
    """Test login with non-existent email"""
    response = client.post(
        "/auth/login",
        json={"identifier": "nonexistent@example.com", "password": "testpass123"},
        content_type="application/json",
    )
    assert response.status_code == 401
    data = response.get_json()
    assert data["error"] == "Invalid credentials"


def test_login_invalid_password(client, auth):
    """Test login with wrong password"""
    # First register a user
    auth.register(username="testuser", email="test@example.com", password="testpass123")

    # Try to login with wrong password
    response = client.post(
        "/auth/login",
        json={"identifier": "test@example.com", "password": "wrongpassword"},
        content_type="application/json",
    )
    assert response.status_code == 401
    data = response.get_json()
    assert data["error"] == "Invalid credentials"


def test_login_with_username(client, auth):
    """Test login using username instead of email"""
    # First register a user
    auth.register(username="testuser", email="test@example.com", password="testpass123")

    # Try to login with username
    response = client.post(
        "/auth/login",
        json={"identifier": "testuser", "password": "testpass123"},
        content_type="application/json",
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Logged in successfully"


def test_logout(client, auth):
    """Test user logout"""
    # Register and login first
    auth.register(username="testuser", email="test@example.com", password="testpass123")
    auth.login(identifier="test@example.com", password="testpass123")

    # Then logout
    response = auth.logout()
    assert response.status_code == 200
    data = response.get_json()
    assert "message" in data
