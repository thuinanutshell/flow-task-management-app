from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app.models import db, Categories, Users
from app.utils.helpers import create_response
from app.utils.validators import validate_hex_color

category_bp = Blueprint("category", __name__)


def serialize_category(category):
    """Helper function to consistently serialize category objects"""
    return {
        "id": category.id,
        "name": category.name,
        "color": category.color,
        "user_id": category.user_id,
        "task_count": len(category.tasks),  # Number of tasks using this category
        "created_at": category.created_at.isoformat() if category.created_at else None,
        "updated_at": category.updated_at.isoformat() if category.updated_at else None,
    }


@category_bp.route("/", methods=["POST"])
@jwt_required()
def create_category():
    """Create a new category for the current user"""
    try:
        data = request.get_json()

        if not data:
            return create_response(
                False,
                "Invalid JSON format or missing Content-Type: application/json header",
                status=400,
            )

        # Validate required fields
        required_fields = ["name", "color"]
        for field in required_fields:
            if field not in data:
                return create_response(
                    False, f"Missing required field: {field}", status=400
                )

        name = data["name"].strip()
        color = data["color"].strip()

        # Validate name
        if not name:
            return create_response(False, "Category name cannot be empty", status=400)

        # Validate color format
        if not validate_hex_color(color):
            return create_response(
                False,
                "Color must be a valid hex color code (e.g., #FF5733)",
                status=400,
            )

        user_id = get_jwt_identity()

        # Check for duplicate category names for this user
        existing_category = Categories.query.filter_by(
            name=name, user_id=user_id
        ).first()
        if existing_category:
            return create_response(
                False,
                "Category name already exists. Please choose a different name.",
                status=400,
            )

        # Create new category
        new_category = Categories(name=name, color=color, user_id=user_id)
        db.session.add(new_category)
        db.session.commit()

        return create_response(
            message="Category created successfully",
            data=serialize_category(new_category),
        )

    except Exception as e:
        current_app.logger.error(f"Create category error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@category_bp.route("/", methods=["GET"])
@jwt_required()
def get_user_categories():
    """Get all categories for the current user"""
    try:
        user_id = get_jwt_identity()
        categories = Categories.query.filter_by(user_id=user_id).all()

        categories_data = [serialize_category(category) for category in categories]

        return create_response(
            message="Retrieved user categories successfully", data=categories_data
        )

    except Exception as e:
        current_app.logger.error(f"Get categories error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@category_bp.route("/<int:category_id>", methods=["PATCH"])
@jwt_required()
def update_category(category_id):
    """Update a category"""
    try:
        data = request.get_json()

        if not data:
            return create_response(
                False,
                "Invalid JSON format or missing Content-Type: application/json header",
                status=400,
            )

        user_id = get_jwt_identity()
        category = Categories.query.filter_by(id=category_id, user_id=user_id).first()

        if not category:
            return create_response(False, "Category not found", status=404)

        # Update name if provided
        if "name" in data:
            new_name = data["name"].strip()
            if not new_name:
                return create_response(
                    False, "Category name cannot be empty", status=400
                )

            # Check for duplicate names (excluding current category)
            existing_category = Categories.query.filter(
                Categories.name == new_name,
                Categories.id != category_id,
                Categories.user_id == user_id,
            ).first()
            if existing_category:
                return create_response(
                    False,
                    "Category name already exists. Please choose a different name.",
                    status=400,
                )
            category.name = new_name

        # Update color if provided
        if "color" in data:
            new_color = data["color"].strip()
            if not validate_hex_color(new_color):
                return create_response(
                    False,
                    "Color must be a valid hex color code (e.g., #FF5733)",
                    status=400,
                )
            category.color = new_color

        category.updated_at = datetime.utcnow()
        db.session.commit()

        return create_response(
            message="Category updated successfully", data=serialize_category(category)
        )

    except Exception as e:
        current_app.logger.error(f"Update category error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@category_bp.route("/<int:category_id>", methods=["DELETE"])
@jwt_required()
def delete_category(category_id):
    """Delete a category"""
    try:
        user_id = get_jwt_identity()
        category = Categories.query.filter_by(id=category_id, user_id=user_id).first()

        if not category:
            return create_response(False, "Category not found", status=404)

        # Check if category is being used by any tasks
        if len(category.tasks) > 0:
            return create_response(
                False,
                f"Cannot delete category. It is currently used by {len(category.tasks)} task(s). "
                "Please remove the category from all tasks first or choose a different category for them.",
                status=400,
            )

        db.session.delete(category)
        db.session.commit()

        return create_response(message="Category deleted successfully")

    except Exception as e:
        current_app.logger.error(f"Delete category error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


@category_bp.route("/<int:category_id>/tasks", methods=["GET"])
@jwt_required()
def get_category_tasks(category_id):
    """Get all tasks that belong to a specific category"""
    try:
        user_id = get_jwt_identity()
        category = Categories.query.filter_by(id=category_id, user_id=user_id).first()

        if not category:
            return create_response(False, "Category not found", status=404)

        # Import here to avoid circular imports
        from app.routes.tasks import serialize_task

        tasks_data = [serialize_task(task) for task in category.tasks]

        return create_response(
            message=f"Retrieved tasks for category '{category.name}' successfully",
            data={"category": serialize_category(category), "tasks": tasks_data},
        )

    except Exception as e:
        current_app.logger.error(f"Get category tasks error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )


# Utility endpoint for frontend dropdowns
@category_bp.route("/options", methods=["GET"])
@jwt_required()
def get_category_options():
    """Get simplified category list for dropdowns/selectors"""
    try:
        user_id = get_jwt_identity()
        categories = Categories.query.filter_by(user_id=user_id).all()

        options = [
            {"id": category.id, "name": category.name, "color": category.color}
            for category in categories
        ]

        return create_response(
            message="Retrieved category options successfully", data=options
        )

    except Exception as e:
        current_app.logger.error(f"Get category options error: {str(e)}")
        return create_response(
            False, "Unable to process request. Please try again.", status=500
        )
