# backend/app/config.py
import os
from datetime import timedelta


class Config:
    """Base configuration."""

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///task_app.db")
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
