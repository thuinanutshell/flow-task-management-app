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

from app.utils.helpers import create_response

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


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        required = ["first_name", "last_name", "email", "username", "password"]
        if not all(field in data for field in required):
            return create_response(False, "Missing required fields", status=400)

        auth_service = AuthService(db)
        user = auth_service.register_user(
            data["email"],
            data["username"],
            data["password"],
            data["first_name"],
            data["last_name"],
        )

        # Create JWT token (string format)
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
                "user": {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "username": user.username,
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
            username=idinfo.get("name", "").replace(" ", "_").lower(),
        )

        token = create_access_token(identity=user.id)
        auth_service.store_token(user, token)

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
        current_app.logger.info(f"Getting profile for user ID: {user_id}")

        user = Users.query.get(user_id)

        if not user:
            current_app.logger.warning(f"User not found with ID: {user_id}")
            return create_response(False, "User not found", status=404)

        # Format dates safely
        created_at = user.created_at.isoformat() if user.created_at else None

        return create_response(
            data={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "created_at": created_at,
            }
        )

    except Exception as e:
        current_app.logger.error(f"Profile error: {str(e)}")
        # Add more detailed error information in development
        error_details = str(e) if current_app.debug else "Failed to get profile"
        return create_response(False, error_details, status=500)


@auth_bp.route("/update", methods=["PATCH"])
@jwt_required()
def update_profile():
    """Update user profile using the AuthService"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data:
            return (
                jsonify({"success": False, "message": "No update data provided"}),
                400,
            )

        # Use the auth service
        auth_service = AuthService(db)
        user = auth_service.update_profile(user_id, data)

        # Log the updated user
        current_app.logger.info(
            f"Updated user: {user.id}, {user.first_name}, {user.last_name}"
        )

        # Create a response with only the necessary user data
        user_data = {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }

        # Return the response with the correct message
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Profile updated successfully",
                    "data": user_data,
                }
            ),
            200,
        )

    except ValueError as e:
        current_app.logger.error(f"Value error in update_profile: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception as e:
        import traceback

        current_app.logger.error(f"Update profile error: {str(e)}")
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        # Ensure the session is rolled back
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@auth_bp.route("/delete", methods=["DELETE"])
@jwt_required()
def delete_account():
    try:
        user_id = get_jwt_identity()
        auth_service = AuthService(db)
        user = auth_service.delete_account(user_id)

        # Revoke current token
        jwt_payload = get_jwt()
        jti = jwt_payload["jti"]
        if current_app.redis:
            exp_timestamp = jwt_payload["exp"]
            current_timestamp = int(datetime.now(timezone.utc).timestamp())
            ttl = exp_timestamp - current_timestamp
            current_app.redis.setex(f"revoked_token:{jti}", ttl, "1")

        # Todo: add more information to the response
        return create_response(
            message="Account deleted successfully",
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Profile delete error: {str(e)}")
        return create_response(False, "Failed to delete profile", status=500)


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
