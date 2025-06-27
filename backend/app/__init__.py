def create_app(config_name="default"):
    """Application factory pattern."""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Configure CORS
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
        redis_status = "connected" if app.redis else "disconnected"
        return {
            "status": "healthy",
            "service": "flow-backend",
            "redis": redis_status
        }, 200

    return app
