from flask import jsonify, request, Blueprint
from models import Task, db
from flask_login import login_required, current_user
from datetime import datetime

bp_task = Blueprint("task", __name__)


@bp_task.route("/add_task", methods=["POST"])
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
        list_id = task_data["list_id"]

        task_count = Task.query.filter_by(list_id=list_id, deleted_at=None).count()

        new_task = Task(
            name=task_data["name"],
            description=task_data.get("description", ""),
            list_id=list_id,
            is_completed=False,
            order_index=task_count,
            deleted_at=None,
            completed_at=None,
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


@bp_task.route("/tasks/<int:task_id>/update", methods=["PATCH"])
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
            task.name = task_data["name"]
        if "description" in task_data:
            task.description = task_data["description"]
        if "order_index" in task_data:
            task.order_index = task_data["order_index"]

        # Handle completion status
        if "is_completed" in task_data:
            task.is_completed = task_data["is_completed"]
            task.completed_at = datetime.utcnow() if task_data["is_completed"] else None

        db.session.commit()

        print(f"User {current_user.username} updated task {task_id}")
        return (
            jsonify({"message": success_message, "task": task.to_dict()}),
            success_status,
        )

    except Exception as e:
        print(f"User {current_user.username}: Error updating task {task_id}: ", e)
        return jsonify({"message": f"{failure_message}. error is {e}"}), 400


@bp_task.route("/tasks/<int:task_id>/delete", methods=["DELETE"])
@login_required
def delete_task(task_id):
    """
    Soft deletes a task by setting deleted_at timestamp.
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

        # Soft delete by setting deleted_at timestamp
        task.soft_delete()
        db.session.commit()

        print(f"User {current_user.username} soft-deleted task {task_id}")
        return (
            jsonify({"message": success_message, "task": task.to_dict()}),
            success_status,
        )

    except Exception as e:
        print(f"User {current_user.username}: Error deleting task {task_id}: ", e)
        return jsonify({"message": f"{failure_message}. error is {e}"}), 400


@bp_task.route("/tasks/<int:task_id>/complete", methods=["PATCH"])
@login_required
def complete_task(task_id):
    """
    Marks a task as completed.
    Args:
        task_id (int): The id of the task to be completed.
    Returns:
        A JSON response containing a success message and status code if successful,
        or an error message and status code if failed.
    """
    success_message = f"Successfully completed task {task_id}."
    failure_message = f"Failed to complete task {task_id}."
    success_status = 200

    try:
        task = Task.query.get(task_id)

        if not task:
            return jsonify({"message": f"Task {task_id} not found"}), 404

        task.mark_completed()
        db.session.commit()

        print(f"User {current_user.username} completed task {task_id}")
        return (
            jsonify({"message": success_message, "task": task.to_dict()}),
            success_status,
        )

    except Exception as e:
        print(f"User {current_user.username}: Error completing task {task_id}: ", e)
        return jsonify({"message": f"{failure_message}. error is {e}"}), 400


@bp_task.route("/tasks/reorder", methods=["POST"])
@login_required
def reorder_tasks():
    """
    Reorders tasks within a list based on provided order.
    Args:
        Expects JSON with list_id and an array of task ids in new order.
    Returns:
        A JSON response containing a success message and status code if successful,
        or an error message and status code if failed.
    """
    success_message = "Successfully reordered tasks."
    failure_message = "Failed to reorder tasks."
    success_status = 200

    try:
        data = request.get_json()
        list_id = data["list_id"]
        task_ids = data["task_ids"]

        # Update order_index for each task based on its position in the array
        for index, task_id in enumerate(task_ids):
            task = Task.query.get(task_id)
            if task and task.list_id == list_id:
                task.order_index = index

        db.session.commit()

        print(f"User {current_user.username} reordered tasks in list {list_id}")
        return jsonify({"message": success_message}), success_status

    except Exception as e:
        print(f"User {current_user.username}: Error reordering tasks: ", e)
        return jsonify({"message": f"{failure_message}. error is {e}"}), 400
