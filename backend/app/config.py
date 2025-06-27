# backend/app/config.py
import os
from datetime import timedelta


class Config:
    """Base configuration."""

    # Database - Handle Railway's DATABASE_URL format conversion
    database_url = os.getenv("DATABASE_URL")
    if database_url and database_url.startswith("postgres://"):
        # Railway provides postgres:// but SQLAlchemy needs postgresql://
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = database_url or "sqlite:///task_app.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_ALGORITHM = "HS256"

    # Google OAuth
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    # Redis Configuration - Support both URL and individual configs
    REDIS_URL = os.getenv("REDIS_URL")  # Railway provides this
    REDIS_ENABLED = os.getenv("REDIS_ENABLED", "True").lower() == "true"
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB = int(os.getenv("REDIS_DB", 0))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    SQLALCHEMY_ECHO = True

    # Make Redis optional in development
    REDIS_ENABLED = os.getenv("REDIS_ENABLED", "False").lower() == "true"


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    # Redis should be enabled in production
    REDIS_ENABLED = os.getenv("REDIS_ENABLED", "True").lower() == "true"

    # Add production-specific database settings for better connection handling
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,        # Verify connections before use
        'pool_recycle': 300,          # Recycle connections every 5 minutes
        'connect_args': {
            'connect_timeout': 10,    # Connection timeout
        }
    }


class TestingConfig(Config):
    """Testing configuration."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    REDIS_ENABLED = False  # Disable Redis for tests


# Configuration dictionary
config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
