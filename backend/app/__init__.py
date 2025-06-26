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

    # Configure CORS to allow requests from your frontend
    cors.init_app(
        app,
        origins=[
            "http://localhost:5173",  # Local development
            "http://localhost:3000",  # Local development
            "https://flow-task-management-app.vercel.app",  # Vercel domain
            "https://*.vercel.app",  # All Vercel domains (for preview deployments)
        ],
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        supports_credentials=True,
    )

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
    from app.api.projects import project_bp
    from app.api.lists import list_bp
    from app.api.categories import category_bp
    from app.api.tasks import task_bp
    from app.api.analytics import analytics_bp
    from app.api.experiments import experiment_bp

    app.register_blueprint(analytics_bp, url_prefix="/analytics")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(project_bp, url_prefix="/project")
    app.register_blueprint(list_bp, url_prefix="/list")
    app.register_blueprint(category_bp, url_prefix="/categories")
    app.register_blueprint(task_bp, url_prefix="/task")
    app.register_blueprint(experiment_bp, url_prefix="/experiment")

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

    @app.route("/health")
    def health_check():
        """Simple health check endpoint for Railway"""
        return {"status": "healthy", "service": "flow-backend"}, 200

    return app
