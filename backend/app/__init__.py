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
    from flask import Flask
    from flask_cors import CORS
    from flask_jwt_extended import JWTManager
    from flask_migrate import Migrate
    from datetime import datetime

    app = Flask(__name__)

    # Import config after Flask app creation
    from app.config import config
    from app.models.base import db

    # Load configuration
    app.config.from_object(config[config_name])

    # Initialize extensions with app
    db.init_app(app)
    migrate = Migrate()
    migrate.init_app(app, db)
    jwt = JWTManager()
    jwt.init_app(app)

    # Configure CORS
    cors = CORS()
    cors.init_app(
        app,
        origins=[
            "http://localhost:5173",
            "http://localhost:3000",
            "https://flow-task-management-app.vercel.app",
            "https://*.vercel.app",
        ],
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        supports_credentials=True,
    )

    # Import models (same as before)
    from app.models import (
        Users, Projects, Categories, Lists, Tasks,
        CategoryAnalytics, ProjectAnalytics, DailyAnalytics,
        ExperimentTypes, UserExperiments, ExperimentTasks, ExperimentResults,
    )

    # Register blueprints (same as before)
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

    # Enhanced Redis connection with better error handling
    import redis
    import urllib.parse

    redis_client = None
    try:
        # Try Redis URL first (Railway often provides this)
        redis_url = app.config.get("REDIS_URL")
        if redis_url:
            # Parse Redis URL
            parsed_url = urllib.parse.urlparse(redis_url)
            redis_client = redis.StrictRedis(
                host=parsed_url.hostname,
                port=parsed_url.port or 6379,
                password=parsed_url.password,
                db=0,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
        else:
            # Fallback to individual config values
            redis_client = redis.StrictRedis(
                host=app.config.get("REDIS_HOST", "localhost"),
                port=app.config.get("REDIS_PORT", 6379),
                password=app.config.get("REDIS_PASSWORD"),
                db=app.config.get("REDIS_DB", 0),
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )

        # Test the connection
        redis_client.ping()
        app.logger.info("✅ Redis connection successful")
        app.redis = redis_client

    except redis.ConnectionError as e:
        app.logger.warning(f"🔴 Redis connection failed: {str(e)}")
        app.logger.warning("JWT logout functionality will be limited.")
        app.redis = None
    except Exception as e:
        app.logger.error(f"🔴 Unexpected Redis error: {str(e)}")
        app.redis = None

    @app.route("/health")
    def health_check():
        """Health check endpoint with Redis status"""
        health_status = {
            "status": "healthy",
            "service": "flow-backend",
            "timestamp": datetime.utcnow().isoformat()
        }

        # Check database connection
        try:
            db.engine.connect()
            health_status["database"] = "connected"
        except Exception as e:
            health_status["database"] = f"error: {str(e)}"
            health_status["status"] = "unhealthy"

        # Check Redis connection
        redis_status = "connected" if app.redis else "disconnected"
        health_status["redis"] = redis_status

        # Return appropriate status code
        status_code = 200 if health_status["status"] == "healthy" else 503

        return health_status, status_code

    return app
