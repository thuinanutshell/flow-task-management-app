from flask import Flask
from flask_login import LoginManager
from backend.models import db
from backend.bp.auth import auth_bp
from backend.bp.main import main_bp


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)

    app.config["SECRET_KEY"] = "task123"
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///task.sqlite"

    # Initialize LoginManager
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"

    # User loader function
    from backend.models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Initialize database
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)

    # Create tables
    with app.app_context():
        try:
            db.create_all()
            app.logger.info("Database tables created successfully")
        except Exception as e:
            app.logger.error(f"Failed to create database tables: {e}")
            raise

    app.logger.info("Application created successfully")

    return app


# Create the app instance
app = create_app()
