import os
import sys

# Add the project root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.models.base import db


def reset_database():
    """Drop all tables and recreate them"""
    app = create_app("development")  # Use the same config as your main app

    with app.app_context():
        print("🗑️  Dropping all tables...")
        db.drop_all()
        print("✅ Tables dropped")

        print("🏗️  Creating all tables...")
        db.create_all()
        print("✅ Tables created")

        print("🎉 Database reset complete!")


if __name__ == "__main__":
    reset_database()
