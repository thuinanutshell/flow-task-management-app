from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from backend.models import db
from backend.bp.auth import auth_bp
from backend.bp.main import main_bp
from backend.bp.folder import folder_bp
from backend.bp.task import task_bp
import os


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)

    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "..", "instance", "app.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False  # recommended setting
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_SECURE'] = True  # For HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True

    cors_origins = ["http://localhost:5173"]
    CORS(
        app,
        origins=cors_origins,
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
    )

    # Initialize LoginManager
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"

    from backend.models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Initialize database
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(folder_bp)
    app.register_blueprint(task_bp)

    with app.app_context():
        try:
            # This creates all tables based on your models
            db.create_all()
            app.logger.info("Database tables created successfully")
        except Exception as e:
            app.logger.error(f"Failed to create database tables: {e}")
            raise

    app.logger.info("Application created successfully")

    return app
