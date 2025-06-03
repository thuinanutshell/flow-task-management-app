from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from models import User, db

bp_auth = Blueprint("auth", __name__)


@bp_auth.route("/register", methods=["POST"])
def register():
    """
    Registers a new user with the provided username, email, and password.

    Returns:
        A JSON response containing a success or error message.
    """
    try:
        # Get user information from the client side
        data = request.get_json()
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        # Hash the user's password for security
        password_hash = generate_password_hash(password)

        # Check if the username or email already exist
        if User.query.filter_by(username=username).first():
            return jsonify({"message": "Username already exists!"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email already exists!"}), 400

        # Define new user and add the information to the database
        new_user = User(username=username, email=email, password_hash=password_hash)
        db.session.add(new_user)
        db.session.commit()
        print(f"New user created: {new_user.username}")
        return jsonify({"message": "New user created!"}), 201

    except Exception as e:
        print(f"Error creating new user: {e}")
        return jsonify({"message": f"Error creating new user: {e}"}), 400


@bp_auth.route("/login", methods=["POST"])
def login():
    """
    Logs in a user with the provided login credentials.

    Returns:
        A JSON response containing a success or error message and the user's username.
    """
    try:
        data = request.get_json()

        # Login information can either be username or email
        login = data.get("login")
        password = data.get("password")

        # Query to check if the user exists in the database
        user = (
            User.query.filter_by(username=login).first()
            or User.query.filter_by(email=login).first()
        )

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"message": "Username or password is incorrect!"}), 400

        # Login the user using the built-in flask_login method: login_user()
        login_user(user)
        print(f"User {user.username} logged in successfully! Session id: {user.id}")
        return jsonify({"message": "Logged in successfully!", "username": user.username}), 200
    
    except Exception as e:
        print(f"Error logging in: {e}")
        return jsonify({"message": f"Error logging in: {e}"}), 400


@bp_auth.route("/logout", methods=["POST"])
@login_required
def logout():
    """
    Logs out the current user and returns a JSON response with a success message.

    Returns:
        A JSON response with a success message and a status code of 200.
        If an error occurs during logout, returns a JSON response with an error message and a status code of 400.
    """
    try:
        print(f"User {current_user.username} logged out successfully!")
        logout_user()
        return jsonify({"message": "Logged out successfully!"}), 200
    except Exception as e:
        return jsonify({"message": f"Error logging out: {e}"}), 400
