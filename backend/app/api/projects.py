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
from app.models import Projects, Users, db

from app.utils.helpers import create_response

project_bp = Blueprint("project", __name__)


def serialize_project(project, include_summary=True):
    """Helper function to consistently serialize project objects"""
    from app.models import TaskStatus

    project_data = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }

    if include_summary:
        project_data.update(
            {
                "total_lists": project.list_count,
                "total_tasks": project.total_tasks,
                "completed_tasks": project.completed_tasks,
                "progress": project.progress,
            }
        )

    return project_data


@project_bp.route("/", methods=["POST"])
@jwt_required()
def create_project():
    """Create a new project"""
    try:
        data = request.get_json()

        if not data:
            return create_response(
                False,
                "Invalid JSON format or missing Content-Type: application/json header",
                status=400,
            )

        # Validate required fields
        required_fields = ["name", "status"]
        for field in required_fields:
            if field not in data:
                return create_response(
                    False, f"Missing required field: {field}", status=400
                )

        # Validate name is not empty
        if not data["name"] or not data["name"].strip():
            return create_response(False, "Project name cannot be empty", status=400)

        # Validate status
        valid_statuses = ["not_started", "in_progress", "pending", "done"]
        if data["status"] not in valid_statuses:
            return create_response(
                False, f"Invalid status. Valid options: {valid_statuses}", status=400
            )

        user_id = get_jwt_identity()
        project_service = ProjectService(db)
        project = project_service.add_new_project(data, user_id)
        return create_response(
            message="Project created successfully",
            data=serialize_project(project, include_summary=False),
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Create project error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@project_bp.route("/", methods=["GET"])
@jwt_required()
def retrieve_all_projects():
    """Get all projects for the current user"""
    try:
        user_id = get_jwt_identity()
        project_service = ProjectService(db)
        projects_data = project_service.get_user_projects(user_id)
        return create_response(
            message="Retrieved user projects successfully", data=projects_data
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Retrieve projects error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@project_bp.route("/<int:project_id>", methods=["GET"])
@jwt_required()
def retrieve_one_project(project_id):
    """Get a specific project with all its lists"""
    try:
        project_service = ProjectService(db)
        project_data = project_service.read_one_project(project_id)

        if not project_data:
            return create_response(False, "Project not found", status=404)

        return create_response(
            message="Project's lists retrieved successfully", data=project_data
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Retrieve project error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@project_bp.route("/<int:project_id>", methods=["PATCH"])
@jwt_required()
def update_one_project(project_id):
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
            return create_response(False, "Project name cannot be empty", status=400)

        # Validate status if provided
        if "status" in data:
            valid_statuses = ["not_started", "in_progress", "pending", "done"]
            if data["status"] not in valid_statuses:
                return create_response(
                    False,
                    f"Invalid status. Valid options: {valid_statuses}",
                    status=400,
                )

        project_service = ProjectService(db)
        project = project_service.update_one_project(project_id, data)
        return create_response(
            message="Project updated successfully",
            data=serialize_project(project, include_summary=False),
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Update project error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@project_bp.route("/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_one_project(project_id):
    """Delete a project and all its associated lists and tasks"""
    try:
        project_service = ProjectService(db)
        project_service.delete_one_project(project_id)
        return create_response(message="Project deleted successfully")
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Delete project error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@project_bp.route("/<int:project_id>/summary", methods=["GET"])
@jwt_required()
def get_project_summary(project_id):
    """Get project summary without detailed list information (for dashboard views)"""
    try:
        project = Projects.query.filter_by(id=project_id).first()

        if not project:
            return create_response(False, "Project not found", status=404)

        return create_response(
            message="Retrieved project summary successfully",
            data=serialize_project(project, include_summary=True),
        )
    except Exception as e:
        current_app.logger.error(f"Get project summary error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )
