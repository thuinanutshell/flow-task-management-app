import os
import sys
import subprocess
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def initialize_database():
    """Initialize database tables"""
    logger.info("🔄 Initializing database...")

    try:
        from app import create_app
        from app.models.base import db

        config_name = os.getenv("FLASK_CONFIG", "production")
        logger.info(f"Using config: {config_name}")

        app = create_app(config_name)

        with app.app_context():
            # Test database connection first
            try:
                db.engine.connect()
                logger.info("✅ Database connection successful")
            except Exception as e:
                logger.error(f"❌ Database connection failed: {str(e)}")
                raise

            # Create all tables
            db.create_all()
            logger.info("✅ Database tables created successfully!")

    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        sys.exit(1)


def start_server():
    """Start the Gunicorn server"""
    logger.info("🌟 Starting Gunicorn server...")

    port = os.getenv("PORT", "5001")
    workers = os.getenv("WEB_CONCURRENCY", "1")

    cmd = [
        "gunicorn",
        "--bind", f"0.0.0.0:{port}",
        "--workers", workers,
        "--timeout", "120",
        "--log-level", "info",
        "run:app"
    ]

    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to start server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    logger.info("🚀 Starting Flask application...")
    initialize_database()
    start_server()
