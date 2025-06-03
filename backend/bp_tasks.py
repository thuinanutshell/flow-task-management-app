from flask import jsonify, request, Blueprint
from models import Task, db
from flask_login import login_required, current_user
from datetime import datetime

bp_task = Blueprint("task", __name__)


@bp_task.route("/", methods=["POST"])
@login_required
def add_task():
    """
    Adds a new task to the database.
    Returns:
        A JSON response containing a success or failure message and a status code.
    """
    success_message = "Successfully added task to the database."
    failure_message = "Failed to add task to the database."
    success_status = 200

    try:
        task_data = request.get_json()
        list_id = task_data.get("list_id")
        new_task = Task(
            name=task_data.get("name"),
            list_id=list_id,
            is_completed=False,
        )

        db.session.add(new_task)
        db.session.commit()

        print(f"User {current_user.username} added a new task to list {list_id}")
        return (
            jsonify({"message": success_message, "task": new_task.to_dict()}),
            success_status,
        )

    except Exception as e:
        print(f"User {current_user.username}: Error adding task: ", e)
        return jsonify({"message": f"{failure_message}. error is {e}"}), 400


@bp_task.route("/<int:task_id>", methods=["PATCH"])
@login_required
def update_task(task_id):
    """
    Updates a task in the database.
    Args:
        task_id (int): The id of the task to be updated.
    Returns:
        A JSON response containing a success message and status code if successful,
        or an error message and status code if failed.
    """
    success_message = f"Successfully updated task {task_id}."
    failure_message = f"Failed to update task {task_id}."
    success_status = 200

    try:
        task_data = request.get_json()
        task = Task.query.get(task_id)

        if not task:
            return jsonify({"message": f"Task {task_id} not found"}), 404

        # Update basic fields
        if "name" in task_data:
            task.name = task_data.get("name")

        # Handle completion status
        if "is_completed" in task_data:
            task.is_completed = task_data.get("is_completed")

        db.session.commit()

        print(f"User {current_user.username} updated task {task_id}")
        return (
            jsonify({"message": success_message, "task": task.to_dict()}),
            success_status,
        )

    except Exception as e:
        print(f"User {current_user.username}: Error updating task {task_id}: ", e)
        return jsonify({"message": f"{failure_message}. error is {e}"}), 400


@bp_task.route("/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    """
    Args:
        task_id (int): The id of the task to be deleted.
    Returns:
        A JSON response containing a success message and status code if successful,
        or an error message and status code if failed.
    """
    success_message = f"Successfully deleted task {task_id}."
    failure_message = f"Failed to delete task {task_id}."
    success_status = 200

    try:
        task = Task.query.get(task_id)

        if not task:
            return jsonify({"message": f"Task {task_id} not found"}), 404

        db.session.delete(task)
        db.session.commit()

        print(f"User {current_user.username} deleted task {task_id}")
        return (
            jsonify({"message": success_message, "task": task.to_dict()}),
            success_status,
        )

    except Exception as e:
        print(f"User {current_user.username}: Error deleting task {task_id}: ", e)
        return jsonify({"message": f"{failure_message}. error is {e}"}), 400
