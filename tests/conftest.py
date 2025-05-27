import pytest
import os
import sys
import tempfile

# Add the parent directory to Python path so we can import from backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app import create_app
from backend.models import db


class AuthActions(object):
    def __init__(self, client):
        self._client = client
        
    def register(self, username="test", email="test@gmail.com", password="test"):
        return self._client.post(
            "/auth/register",
            json={"username": username, "email": email, "password": password},
            content_type='application/json'
        )
        
    def login(self, identifier="test@gmail.com", password="test"):
        return self._client.post(
            "/auth/login", 
            json={"identifier": identifier, "password": password},
            content_type='application/json'
        )

    def logout(self):
        return self._client.post("/auth/logout")


@pytest.fixture()
def app():
    # Create a temporary database file for testing
    db_fd, db_path = tempfile.mkstemp()
    
    # Set environment variables for testing before creating the app
    test_config = {
        "TESTING": True,
        "SECRET_KEY": "test-secret-key-different-from-production",
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
        "WTF_CSRF_ENABLED": False,  # Disable CSRF for testing
    }
    
    # Temporarily set environment variables
    original_secret = os.environ.get("SECRET_KEY")
    original_db_uri = os.environ.get("SQLALCHEMY_DATABASE_URI")
    
    os.environ["SECRET_KEY"] = test_config["SECRET_KEY"]
    os.environ["SQLALCHEMY_DATABASE_URI"] = test_config["SQLALCHEMY_DATABASE_URI"]
    
    try:
        app = create_app()
        app.config.update(test_config)
        
        with app.app_context():
            db.create_all()
            yield app
            db.drop_all()
    finally:
        # Restore original environment variables
        if original_secret is not None:
            os.environ["SECRET_KEY"] = original_secret
        elif "SECRET_KEY" in os.environ:
            del os.environ["SECRET_KEY"]
            
        if original_db_uri is not None:
            os.environ["SQLALCHEMY_DATABASE_URI"] = original_db_uri
        elif "SQLALCHEMY_DATABASE_URI" in os.environ:
            del os.environ["SQLALCHEMY_DATABASE_URI"]
        
        # Clean up the temporary database
        os.close(db_fd)
        os.unlink(db_path)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def runner(app):
    return app.test_cli_runner()


@pytest.fixture
def auth(client):
    return AuthActions(client)