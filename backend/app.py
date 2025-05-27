from flask import Flask
from flask_login import LoginManager
from flask_migrate import Migrate
from backend.models import db
from backend.bp.auth import auth_bp
from backend.bp.main import main_bp
from backend.bp.folder import folder_bp
from backend.bp.task import task_bp
import os

migrate = Migrate()


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")

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
    migrate.init_app(app, db)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(folder_bp)
    app.register_blueprint(task_bp)

    app.logger.info("Application created successfully")

    return app
