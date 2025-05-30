from backend.app import create_app
from backend.models import db


def reset_database():
    app = create_app()
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()
        print("Database reset completed.")


if __name__ == "__main__":
    reset_database()
