from flask import Flask
from flask_cors import CORS
from models import db, User
from bp_tasks import bp_task
from bp_lists import bp_list
from bp_auth import bp_auth
from flask_login import LoginManager
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

# Load .env from root folder (one level up from backend)
load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
)

app = Flask(__name__)
app.url_map.strict_slashes = False
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
app.secret_key = os.getenv("SECRET_KEY")

app.register_blueprint(bp_auth, url_prefix="/auth")
app.register_blueprint(bp_list, url_prefix="/lists")
app.register_blueprint(bp_task, url_prefix="/tasks")

login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(id):
    return db.session.get(User, id)


db.init_app(app)
migrate = Migrate(app, db)

with app.app_context():
    db.create_all()


@app.route("/")
def index():
    return "<p>Backend is working! </p>"


if __name__ == "__main__":
    app.run(port=5001, debug=True)
