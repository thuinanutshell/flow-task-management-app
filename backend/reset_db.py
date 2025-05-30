from app import app, db


def reset_database():
    """
    Drops all tables and recreates them based on current models.
    WARNING: This will delete ALL data in the database
    """
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()
        print("Database reset complete.")


if __name__ == "__main__":
    reset_database()
