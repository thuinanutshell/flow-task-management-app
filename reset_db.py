from backend.app import create_app
from backend.models import db

def reset_database(app):
    with app.app_context():
        db.drop_all()
        print("Dropped all tables")
        db.create_all()
        print("Created all tables")

if __name__ == "__main__":
    app = create_app()
    reset_database(app)
