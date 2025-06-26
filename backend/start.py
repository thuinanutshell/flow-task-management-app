import os
import sys
import subprocess


def initialize_database():
    """Initialize database tables"""
    print("🔄 Initializing database...")

    try:
        from app import create_app
        from app.models.base import db

        app = create_app(os.getenv("FLASK_CONFIG", "production"))

        with app.app_context():
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully!")

    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)}")
        sys.exit(1)


def start_server():
    """Start the Gunicorn server"""
    print("🌟 Starting Gunicorn server...")

    port = os.getenv("PORT", "5001")
    cmd = ["gunicorn", "--bind", f"0.0.0.0:{port}", "run:app"]

    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    print("🚀 Starting Flask application...")
    initialize_database()
    start_server()
