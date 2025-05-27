import pytest
import os
import tempfile
from backend.app import create_app

class TestConfig:
    def test_testing_config(self):
        """Test that testing configuration is properly set"""
        db_fd, db_path = tempfile.mkstemp()
        
        app = create_app()
        app.config.update({
            "TESTING": True,
            "SECRET_KEY": "test-secret-key",
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
        })
        
        assert app.config["TESTING"] is True
        assert app.config["SECRET_KEY"] == "test-secret-key"
        assert "sqlite://" in app.config["SQLALCHEMY_DATABASE_URI"]
        
        # Clean up
        os.close(db_fd)
        os.unlink(db_path)