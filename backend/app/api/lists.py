from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
import os
from datetime import datetime, timezone

from app.services.project_service import ProjectService
from app.models import Lists, Projects, Users, db

from app.utils.helpers import create_response

list_bp = Blueprint("list", __name__)


@list_bp.route("/<int:project_id>", methods=["POST"])
@jwt_required()
def create_new_list(project_id):
    """Create a new list in a project"""
    try:
        # Try to parse JSON data with better error handling
        try:
            data = request.get_json()
            if data is None:
                return create_response(
                    False,
                    "Invalid JSON format or missing Content-Type: application/json header",
                    status=400,
                )
        except Exception as json_error:
            current_app.logger.error(f"JSON parsing error: {str(json_error)}")
            return create_response(
                False, f"Invalid JSON format: {str(json_error)}", status=400
            )

        # Validate required fields
        if "name" not in data:
            return create_response(False, "Missing required field: name", status=400)

        if not data["name"] or not data["name"].strip():
            return create_response(False, "List name cannot be empty", status=400)

        project_service = ProjectService(db)
        new_list = project_service.add_new_list(data, project_id)
        return create_response(
            message="List created successfully",
            data=project_service.serialize_list(new_list),
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Create list error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@list_bp.route("/<int:list_id>", methods=["GET"])
@jwt_required()
def get_one_list(list_id):
    """Get a specific list with all its tasks"""
    try:
        project_service = ProjectService(db)
        list_data = project_service.read_one_list(list_id)

        if not list_data:
            return create_response(False, "List not found", status=404)

        return create_response(
            message="Retrieved list's tasks successfully", data=list_data
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Get list error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@list_bp.route("/<int:list_id>", methods=["PATCH"])
@jwt_required()
def update_one_list(list_id):
    try:
        data = request.get_json()

        if not data:
            return create_response(
                False,
                "Invalid JSON format or missing Content-Type: application/json header",
                status=400,
            )

        # Validate name if provided
        if "name" in data and (not data["name"] or not data["name"].strip()):
            return create_response(False, "List name cannot be empty", status=400)

        # Validate progress if provided
        if "progress" in data:
            progress = data["progress"]
            if (
                not isinstance(progress, (int, float))
                or progress < 0.0
                or progress > 1.0
            ):
                return create_response(
                    False, "Progress must be a number between 0.0 and 1.0", status=400
                )

        project_service = ProjectService(db)
        list_item = project_service.update_one_list(list_id, data)
        return create_response(
            message="Updated list successfully", data=serialize_list(list_item)
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Update list error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@list_bp.route("/<int:list_id>", methods=["DELETE"])
@jwt_required()
def delete_one_list(list_id):
    """Delete a list and all its associated tasks"""
    try:
        project_service = ProjectService(db)
        project_service.delete_one_list(list_id)
        return create_response(message="Deleted list successfully")
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Delete list error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@list_bp.route("/<int:list_id>/summary", methods=["GET"])
@jwt_required()
def get_list_summary(list_id):
    """Get list summary without full task details (for dashboard views)"""
    try:
        list_item = Lists.query.filter_by(id=list_id).first()

        if not list_item:
            return create_response(False, "List not found", status=404)

        return create_response(
            message="Retrieved list summary successfully",
            data=serialize_list(list_item),
        )
    except Exception as e:
        current_app.logger.error(f"Get list summary error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )
