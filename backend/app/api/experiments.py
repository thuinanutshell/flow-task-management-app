from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app.services.experiment_service import ExperimentService
from app.models import db, Categories
from app.utils.helpers import create_response

experiment_bp = Blueprint("experiment", __name__)


@experiment_bp.route("/", methods=["GET"])
@jwt_required()
def get_user_experiments():
    """Get all experiments for the current user"""
    try:
        user_id = get_jwt_identity()
        experiment_service = ExperimentService(db)
        experiments = experiment_service.get_active_experiments(user_id)

        experiments_data = []
        for exp in experiments:
            experiments_data.append(
                {
                    "id": exp.id,
                    "name": exp.name,
                    "status": exp.status.value,
                    "intervention_category": exp.experiment_type.intervention_category,
                    "target_category": exp.target_category.name,
                    "start_date": exp.start_date.isoformat(),
                    "end_date": exp.end_date.isoformat(),
                    "parameters": exp.parameters,
                }
            )

        return create_response(
            message="Retrieved user experiments successfully", data=experiments_data
        )
    except Exception as e:
        current_app.logger.error(f"Get experiments error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@experiment_bp.route("/create", methods=["POST"])
@jwt_required()
def create_experiment():
    """Create a new experiment"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data:
            return create_response(False, "Invalid JSON format", status=400)

        required_fields = ["name", "category_id", "experiment_type"]
        for field in required_fields:
            if field not in data:
                return create_response(
                    False, f"Missing required field: {field}", status=400
                )

        experiment_service = ExperimentService(db)

        # Only support time estimation for now
        if data["experiment_type"] != "time_estimation":
            return create_response(
                False,
                "Only time_estimation experiments are supported currently",
                status=400,
            )

        # Verify category belongs to user
        category = Categories.query.filter_by(
            id=data["category_id"], user_id=user_id
        ).first()

        if not category:
            return create_response(False, "Category not found", status=404)

        experiment = experiment_service.create_time_estimation_experiment(
            user_id=user_id,
            category_id=data["category_id"],
            experiment_name=data["name"],
            duration_days=data.get("duration_days", 14),
        )

        return create_response(
            message="Experiment created successfully",
            data={
                "id": experiment.id,
                "name": experiment.name,
                "status": experiment.status.value,
            },
        )

    except Exception as e:
        current_app.logger.error(f"Create experiment error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@experiment_bp.route("/<int:experiment_id>/results", methods=["GET"])
@jwt_required()
def get_experiment_results(experiment_id):
    """Get results for a specific experiment"""
    try:
        experiment_service = ExperimentService(db)
        results = experiment_service.get_experiment_results(experiment_id)

        return create_response(
            message="Retrieved experiment results successfully", data=results
        )
    except Exception as e:
        current_app.logger.error(f"Get experiment results error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@experiment_bp.route("/task-intervention", methods=["POST"])
@jwt_required()
def check_task_intervention():
    """Check if a task should receive experimental intervention"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or "category_id" not in data:
            return create_response(False, "category_id is required", status=400)

        experiment_service = ExperimentService(db)
        intervention_data = experiment_service.should_apply_intervention(
            task_category_id=data["category_id"], user_id=user_id
        )

        if not intervention_data:
            return create_response(
                message="No active experiments for this category",
                data={"has_intervention": False},
            )

        response_data = {"has_intervention": True, **intervention_data}

        # If it's a time estimation intervention, apply it
        if (
            intervention_data["should_apply"]
            and intervention_data["intervention_type"] == "time_estimation"
            and "original_estimate" in data
        ):

            intervention_result = experiment_service.apply_time_estimation_intervention(
                original_estimate=data["original_estimate"],
                parameters=intervention_data["parameters"],
            )
            response_data.update(intervention_result)

        return create_response(
            message="Intervention check completed", data=response_data
        )

    except Exception as e:
        current_app.logger.error(f"Task intervention check error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@experiment_bp.route("/<int:experiment_id>", methods=["PATCH"])
@jwt_required()
def update_experiment(experiment_id):
    """Update an experiment"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data:
            return create_response(False, "Invalid JSON format", status=400)

        experiment_service = ExperimentService(db)
        experiment = experiment_service.update_experiment(experiment_id, user_id, data)

        return create_response(
            message="Experiment updated successfully",
            data={
                "id": experiment.id,
                "name": experiment.name,
                "status": experiment.status.value,
            },
        )
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Update experiment error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@experiment_bp.route("/<int:experiment_id>", methods=["DELETE"])
@jwt_required()
def delete_experiment(experiment_id):
    """Delete an experiment"""
    try:
        user_id = get_jwt_identity()
        experiment_service = ExperimentService(db)
        experiment_service.delete_experiment(experiment_id, user_id)

        return create_response(message="Experiment deleted successfully")
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Delete experiment error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )
