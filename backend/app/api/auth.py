from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime, timezone

# Import the AuthService and User model
from app.services.auth_service import AuthService
from app.models import Users, db

auth_bp = Blueprint("auth", __name__)


def check_if_token_is_revoked(jwt_header, jwt_payload):
    """
    Callback function to check if a JWT token is revoked or not

    Args:
        jwt_header (dict): JWT header
        jwt_payload (dict): JWT payload

    Returns:
        bool: True if token is revoked, False otherwise
    """
    jti = jwt_payload["jti"]

    # If Redis is not available, we can't check if token is revoked
    if not current_app.redis:
        return False

    # Check if token is in the blocklist
    token_in_redis = current_app.redis.get(f"revoked_token:{jti}")
    return token_in_redis is not None


def create_response(success=True, message="", data=None, status=200):
    """Create standardized API response"""
    response = {"success": success, "message": message}
    if data:
        response["data"] = data
    return jsonify(response), status


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        # Basic validation
        required = ["email", "username", "password"]
        if not all(field in data for field in required):
            return create_response(False, "Missing required fields", status=400)

        auth_service = AuthService(db)
        user = auth_service.register_user(
            data["email"], data["username"], data["password"]
        )

        # Create JWT token
        token = create_access_token(identity=user.id)

        # Store token in user record
        auth_service.store_token(user, token)

        return create_response(
            message="Registration successful",
            data={
                "token": token,
                "user": {"id": user.id, "email": user.email, "username": user.username},
            },
        )

    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Registration error: {str(e)}")
        return create_response(False, "Registration failed", status=500)


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        if not data.get("login") or not data.get("password"):
            return create_response(
                False, "Email/username and password required", status=400
            )

        auth_service = AuthService(db)
        user = auth_service.login_user(data["login"], data["password"])

        # Create JWT token
        token = create_access_token(identity=user.id)

        # Store token in user record
        auth_service.store_token(user, token)

        return create_response(
            message="Login successful",
            data={
                "token": token,
                "user": {"id": user.id, "email": user.email, "username": user.username},
            },
        )

    except ValueError as e:
        return create_response(False, str(e), status=401)
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return create_response(False, "Login failed", status=500)


@auth_bp.route("/oauth/google", methods=["POST"])
def google_oauth():
    try:
        data = request.get_json()
        token = data.get("id_token")

        if not token:
            return create_response(False, "ID token required", status=400)

        # Verify Google token
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), client_id
        )

        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            return create_response(False, "Invalid token issuer", status=400)

        auth_service = AuthService(db)
        user = auth_service.oauth_login(
            email=idinfo["email"],
            external_id=idinfo["sub"],
            username=idinfo.get("name", "").replace(" ", "_").lower(),
        )

        token = create_access_token(identity=user.id)

        return create_response(
            message="OAuth login successful",
            data={
                "token": token,
                "user": {"id": user.id, "email": user.email, "username": user.username},
            },
        )

    except Exception as e:
        current_app.logger.error(f"OAuth error: {str(e)}")
        return create_response(False, "OAuth login failed", status=500)


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return create_response(False, "User not found", status=404)

        return create_response(
            data={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "auth_type": user.auth_type,
                "created_at": user.created_at.isoformat(),
            }
        )

    except Exception as e:
        current_app.logger.error(f"Profile error: {str(e)}")
        return create_response(False, "Failed to get profile", status=500)


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Revoke the current access token"""
    jwt_payload = get_jwt()
    jti = jwt_payload["jti"]
    user_id = get_jwt_identity()

    try:
        # If Redis is available, use it for token blacklisting
        if current_app.redis:
            # Store the JTI in Redis with an expiry time matching the token's
            exp_timestamp = jwt_payload["exp"]
            current_timestamp = int(datetime.now(timezone.utc).timestamp())
            ttl = exp_timestamp - current_timestamp
            current_app.redis.setex(f"revoked_token:{jti}", ttl, "1")

        # Also update the user's token status in the database
        user = Users.query.get(user_id)
        if user:
            auth_service = AuthService(db)
            auth_service.revoke_token(user)

        return create_response(message="Successfully logged out")
    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return create_response(False, "Logout failed", status=500)


# auth_service.py - Simplified version
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_
from app.models import Users, Authentications, db


class AuthService:
    def __init__(self, db):
        self.db = db

    def register_user(self, email, username, password, first_name="", last_name=""):
        """Register a new traditional user"""
        # Check if user exists
        if Users.query.filter(
            or_(Users.email == email, Users.username == username)
        ).first():
            raise ValueError("User already exists")

        # Create user
        user = Users(
            email=email,
            username=username,
            first_name=first_name or email.split("@")[0].title(),
            last_name=last_name or "User",
        )
        self.db.session.add(user)
        self.db.session.flush()  # Get user ID

        # Create authentication record
        auth = Authentications(
            user_id=user.id,
            auth_type="traditional",
            password_hash=generate_password_hash(password),
        )
        self.db.session.add(auth)
        self.db.session.commit()
        return user

    def login_user(self, login, password):
        """Login a traditional user"""
        # Find user by email or username
        user = Users.query.filter(
            or_(Users.email == login, Users.username == login)
        ).first()

        if not user:
            raise ValueError("Invalid credentials")

        # Find traditional auth record
        auth = Authentications.query.filter_by(
            user_id=user.id, auth_type="traditional"
        ).first()

        if not auth or not check_password_hash(auth.password_hash, password):
            raise ValueError("Invalid credentials")

        return user

    def oauth_login(self, email, external_id, name=""):
        """Login or register OAuth user"""
        # Try to find existing OAuth user
        auth = Authentications.query.filter_by(
            external_id=external_id, auth_type="oauth"
        ).first()

        if auth:
            return auth.user

        # Create new OAuth user
        username = email.split("@")[0] + "_oauth"
        names = name.split(" ", 1) if name else ["User", ""]

        user = Users(
            email=email,
            username=username,
            first_name=names[0],
            last_name=names[1] if len(names) > 1 else "User",
        )
        self.db.session.add(user)
        self.db.session.flush()

        # Create OAuth auth record
        auth = Authentications(
            user_id=user.id, auth_type="oauth", external_id=external_id
        )
        self.db.session.add(auth)
        self.db.session.commit()
        return user


# auth.py - Simplified version
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime, timezone

from app.services.auth_service import AuthService
from app.models import Users, db

auth_bp = Blueprint("auth", __name__)


def check_if_token_is_revoked(jwt_header, jwt_payload):
    """Check if a JWT token is revoked (Redis only - keep it simple)"""
    if not current_app.redis:
        return False

    jti = jwt_payload["jti"]
    return current_app.redis.get(f"revoked_token:{jti}") is not None


def create_response(success=True, message="", data=None, status=200):
    """Create standardized API response"""
    response = {"success": success, "message": message}
    if data:
        response["data"] = data
    return jsonify(response), status


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        # Basic validation
        required = ["email", "username", "password"]
        if not all(field in data for field in required):
            return create_response(False, "Missing required fields", status=400)

        auth_service = AuthService(db)
        user = auth_service.register_user(
            email=data["email"],
            username=data["username"],
            password=data["password"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
        )

        # Create JWT token (no database storage - keep it simple)
        token = create_access_token(identity=user.id)

        return create_response(
            message="Registration successful",
            data={
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
            },
        )

    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Registration error: {str(e)}")
        return create_response(False, "Registration failed", status=500)


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        if not data.get("login") or not data.get("password"):
            return create_response(
                False, "Email/username and password required", status=400
            )

        auth_service = AuthService(db)
        user = auth_service.login_user(data["login"], data["password"])

        # Create JWT token
        token = create_access_token(identity=user.id)

        return create_response(
            message="Login successful",
            data={
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
            },
        )

    except ValueError as e:
        return create_response(False, str(e), status=401)
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return create_response(False, "Login failed", status=500)


@auth_bp.route("/oauth/google", methods=["POST"])
def google_oauth():
    try:
        data = request.get_json()
        token = data.get("id_token")

        if not token:
            return create_response(False, "ID token required", status=400)

        # Verify Google token
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), client_id
        )

        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            return create_response(False, "Invalid token issuer", status=400)

        auth_service = AuthService(db)
        user = auth_service.oauth_login(
            email=idinfo["email"],
            external_id=idinfo["sub"],
            name=idinfo.get("name", ""),
        )

        # Create JWT token
        token = create_access_token(identity=user.id)

        return create_response(
            message="OAuth login successful",
            data={
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
            },
        )

    except Exception as e:
        current_app.logger.error(f"OAuth error: {str(e)}")
        return create_response(False, "OAuth login failed", status=500)


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = Users.query.get(user_id)  # Fixed: was "User"

        if not user:
            return create_response(False, "User not found", status=404)

        return create_response(
            data={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "created_at": user.created_at.isoformat(),
            }
        )

    except Exception as e:
        current_app.logger.error(f"Profile error: {str(e)}")
        return create_response(False, "Failed to get profile", status=500)


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Revoke the current access token (Redis only - simple approach)"""
    try:
        jwt_payload = get_jwt()
        jti = jwt_payload["jti"]

        # Only use Redis for token blacklisting - no database storage
        if current_app.redis:
            exp_timestamp = jwt_payload["exp"]
            current_timestamp = int(datetime.now(timezone.utc).timestamp())
            ttl = exp_timestamp - current_timestamp
            current_app.redis.setex(f"revoked_token:{jti}", ttl, "1")

        return create_response(message="Successfully logged out")

    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return create_response(False, "Logout failed", status=500)
