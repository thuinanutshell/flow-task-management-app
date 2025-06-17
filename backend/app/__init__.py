from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from app.models.base import db
from app.config import config

# Initialize extensions
migrate = Migrate()
jwt = JWTManager()
cors = CORS()


def create_app(config_name="default"):
    """Application factory pattern."""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)

    # Import models
    from app.models import (
        Users,
        Projects,
        Categories,
        Lists,
        Tasks,
        CategoryAnalytics,
        ProjectAnalytics,
        DailyAnalytics,
        ExperimentTypes,
        UserExperiments,
        ExperimentTasks,
        ExperimentResults,
    )

    # Register blueprints
    from app.api.auth import auth_bp, check_if_token_is_revoked

    app.register_blueprint(auth_bp, url_prefix="/auth")

    # Configure JWT token blocklist
    jwt.token_in_blocklist_loader(check_if_token_is_revoked)

    # Log Redis connection status
    import redis

    redis_client = None
    try:
        redis_client = redis.StrictRedis(
            host=app.config.get("REDIS_HOST", "localhost"),
            port=app.config.get("REDIS_PORT", 6379),
            db=0,
            decode_responses=True,
        )
        redis_client.ping()
        app.logger.info("Redis connection successful")

        # Make redis_client available to the application
        app.redis = redis_client
    except redis.ConnectionError:
        app.logger.warning(
            "Redis connection failed. JWT logout functionality will be limited."
        )
        app.redis = None

    return app
