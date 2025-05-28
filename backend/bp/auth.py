from flask import Blueprint, jsonify, request, current_app
from flask_login import current_user, login_required, logout_user, login_user
from werkzeug.security import generate_password_hash, check_password_hash
from backend.models import db, User

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409
    elif User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409
    else:
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
        )
        db.session.add(new_user)
        db.session.commit()
        return (
            jsonify(
                {
                    "message": "New user is created",
                    "id": new_user.id,
                    "username": new_user.username,
                    "email": new_user.email,
                }
            ),
            201,
        )


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return jsonify({"message": "Please POST your credentials"}), 200

    # Check content type first
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400

    # Get user's information for login (identifier can be email or username)
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    identifier = data.get("identifier", "").strip()
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Both identifier and password are required"}), 400

    # Check if user exists in the database
    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()
    if user and check_password_hash(user.password_hash, password):
        login_user(user)
        current_app.logger.info(f"User logged in: {user.username}")
        return jsonify(
            {
                "message": "Logged in successfully",
                "user": {"id": user.id, "username": user.username, "email": user.email},
            }
        )
    else:
        current_app.logger.warning(f"Failed login attempt for identifier: {identifier}")
        return jsonify({"error": "Invalid credentials"}), 401


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200
