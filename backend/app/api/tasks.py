from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app.services.task_service import TaskService
from app.models import db, TaskStatus, TaskPriority, MentalState
from app.utils.helpers import create_response

task_bp = Blueprint("task", __name__)


def serialize_task(task):
    """Helper function to consistently serialize task objects"""
    return {
        "id": task.id,
        "name": task.name,
        "description": task.description,
        "status": task.status.value,
        "priority": task.priority.value,
        "planned_duration": task.planned_duration,
        "total_time_worked": task.total_time_worked,
        "first_started_at": (
            task.first_started_at.isoformat() if task.first_started_at else None
        ),
        "completed_at": (task.completed_at.isoformat() if task.completed_at else None),
        "mental_state": task.mental_state.value if task.mental_state else None,
        "reflection": task.reflection,
        "list_id": task.list_id,
        "category_id": task.category_id,
        "is_timer_active": task.is_timer_active,
    }


def validate_enum_fields(data):
    """Validate enum fields in request data"""
    enum_validations = {
        "priority": TaskPriority,
        "status": TaskStatus,
        "mental_state": MentalState,
    }

    for field, enum_class in enum_validations.items():
        if field in data and data[field] is not None:
            try:
                data[field] = enum_class(data[field])
            except ValueError:
                valid_values = [e.value for e in enum_class]
                raise ValueError(
                    f"Invalid {field} value. Valid options: {valid_values}"
                )

    return data


@task_bp.route("/", methods=["POST"])
@jwt_required()
def create_task():
    """Create a new task in a list"""
    try:
        data = request.get_json()

        if not data:
            return create_response(
                False,
                "Invalid JSON format or missing Content-Type: application/json header",
                status=400,
            )

        # Validate required fields
        required_fields = ["name", "list_id", "priority", "planned_duration"]
        for field in required_fields:
            if field not in data:
                return create_response(
                    False, f"Missing required field: {field}", status=400
                )

        # Validate enum values
        try:
            data = validate_enum_fields(data)
        except ValueError as e:
            return create_response(False, str(e), status=400)

        # Validate planned duration
        if (
            not isinstance(data["planned_duration"], int)
            or data["planned_duration"] <= 0
        ):
            return create_response(
                False, "Planned duration must be a positive integer", status=400
            )

        task_service = TaskService(db)
        task = task_service.add_new_task(data, data["list_id"])

        return create_response(
            message="Task created successfully", data=serialize_task(task)
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Create task error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@task_bp.route("/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    """Get a specific task by ID"""
    try:
        task_service = TaskService(db)
        task = task_service.read_one_task(task_id)

        if not task:
            return create_response(False, "Task not found", status=404)

        return create_response(data=serialize_task(task))
    except Exception as e:
        current_app.logger.error(f"Get task error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@task_bp.route("/<int:task_id>", methods=["PATCH"])
@jwt_required()
def update_task(task_id):
    try:
        data = request.get_json()

        if not data:
            return create_response(
                False,
                "Invalid JSON format or missing Content-Type: application/json header",
                status=400,
            )

        # Validate enum values if provided
        try:
            data = validate_enum_fields(data)
        except ValueError as e:
            return create_response(False, str(e), status=400)

        # Validate planned duration if provided
        if "planned_duration" in data:
            if (
                not isinstance(data["planned_duration"], int)
                or data["planned_duration"] <= 0
            ):
                return create_response(
                    False, "Planned duration must be a positive integer", status=400
                )

        task_service = TaskService(db)
        task = task_service.update_one_task(task_id, data)

        if not task:
            return create_response(False, "Task not found", status=404)

        return create_response(
            message="Task updated successfully", data=serialize_task(task)
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Update task error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@task_bp.route("/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    """Delete a task"""
    try:
        task_service = TaskService(db)
        success = task_service.delete_one_task(task_id)

        if not success:
            return create_response(False, "Task not found", status=404)

        return create_response(message="Task deleted successfully")
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Delete task error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


# ===============================
# TIMER ENDPOINTS
# ===============================


@task_bp.route("/<int:task_id>/timer/work", methods=["POST"])
@jwt_required()
def start_or_resume_timer(task_id):
    """Start timer for new task OR resume timer for paused task"""
    try:
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

        if "duration_minutes" not in data:
            return create_response(False, "duration_minutes is required", status=400)

        duration_minutes = data["duration_minutes"]
        if not isinstance(duration_minutes, int) or duration_minutes <= 0:
            return create_response(
                False, "duration_minutes must be a positive integer", status=400
            )

        task_service = TaskService(db)
        timer_info = task_service.start_or_resume_timer(task_id, duration_minutes)

        return create_response(message="Timer started successfully", data=timer_info)
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Start timer error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@task_bp.route("/<int:task_id>/timer/pause", methods=["POST"])
@jwt_required()
def pause_timer(task_id):
    try:
        task_service = TaskService(db)
        pause_info = task_service.pause_timer(task_id)

        return create_response(message="Timer paused successfully", data=pause_info)
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Pause timer error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@task_bp.route("/<int:task_id>/timer/complete", methods=["POST"])
@jwt_required()
def complete_timer(task_id):
    """Complete timer and mark task as done (requires mental_state and reflection)"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data or "mental_state" not in data or "reflection" not in data:
            return create_response(
                False, "mental_state and reflection are required", status=400
            )

        mental_state = data["mental_state"]
        reflection = data["reflection"]

        if not mental_state or not reflection:
            return create_response(
                False, "mental_state and reflection cannot be empty", status=400
            )

        task_service = TaskService(db)
        completion_info = task_service.complete_timer(task_id, mental_state, reflection)

        return create_response(
            message="Task completed successfully", data=completion_info
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Complete timer error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@task_bp.route("/<int:task_id>/timer/status", methods=["GET"])
@jwt_required()
def get_timer_status(task_id):
    """Get current timer status for a task"""
    try:
        task_service = TaskService(db)
        timer_status = task_service.get_timer_status(task_id)

        # Convert datetime objects to ISO strings for JSON serialization
        datetime_fields = [
            "first_started_at",
            "completed_at",
            "current_work_start",
            "current_planned_end",
        ]
        for field in datetime_fields:
            if timer_status.get(field):
                timer_status[field] = timer_status[field].isoformat()

        return create_response(data=timer_status)
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Get timer status error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@task_bp.route("/<int:task_id>/timer/expired", methods=["GET"])
@jwt_required()
def check_timer_expired(task_id):
    """Check if timer has expired and needs user action"""
    try:
        task_service = TaskService(db)
        expiration_info = task_service.check_timer_expiration(task_id)

        return create_response(data=expiration_info)
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Check timer expired error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@task_bp.route("/<int:task_id>/timer/poll", methods=["GET"])
@jwt_required()
def poll_timer_status(task_id):
    """Lightweight endpoint for frontend polling"""
    try:
        task_service = TaskService(db)
        poll_info = task_service.get_timer_poll_data(task_id)

        return create_response(data=poll_info)
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Poll timer status error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@task_bp.route("/create-options", methods=["GET"])
@jwt_required()
def get_task_create_options():
    """Get options needed for task creation (categories, etc.)"""
    try:
        user_id = get_jwt_identity()
        from app.services.category_service import CategoryService

        category_service = CategoryService(db)
        categories = category_service.get_category_options(user_id)

        return create_response(
            message="Retrieved task creation options successfully",
            data={
                "categories": categories,
                "priorities": [p.value for p in TaskPriority],
            },
        )
    except Exception as e:
        current_app.logger.error(f"Get task options error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@task_bp.route("/<int:task_id>/timer/extend", methods=["POST"])
@jwt_required()
def extend_timer(task_id):
    """Extend active timer with additional minutes"""
    try:
        data = request.get_json()

        if not data or "additional_minutes" not in data:
            return create_response(False, "additional_minutes is required", status=400)

        additional_minutes = data["additional_minutes"]
        if not isinstance(additional_minutes, int) or additional_minutes <= 0:
            return create_response(
                False, "additional_minutes must be a positive integer", status=400
            )

        task_service = TaskService(db)
        timer_info = task_service.extend_timer(task_id, additional_minutes)

        return create_response(message="Timer extended successfully", data=timer_info)
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Extend timer error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )
