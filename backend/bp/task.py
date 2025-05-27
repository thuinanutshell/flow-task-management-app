from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from backend.models import db, Task, Folder

task_bp = Blueprint("task", __name__, url_prefix="/task")


@task_bp.route("/create", methods=["POST"])
@login_required
def create_task():
    data = request.get_json()
    name = data.get("name")
    status = data.get("status")
    folder_id = data.get("folder_id")

    if not name:
        return jsonify({"error": "Task name is required"}), 400
    if not folder_id:
        return jsonify({"error": "Folder ID is required"}), 400

    if Task.query.filter_by(name=name).first():
        return jsonify({"error": "Task name already exists"}), 409

    folder = db.session.get(Folder, folder_id)
    if not folder:
        return jsonify({"error": "Folder not found"}), 404
    if folder.user_id != current_user.id:
        return jsonify({"error": "Unauthorized access to this folder"}), 403

    task = Task(name=name, status=status, folder_id=folder_id)
    db.session.add(task)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "New task created",
                "id": task.id,
                "name": task.name,
                "status": task.status,
                "folder_id": task.folder_id,
            }
        ),
        201,
    )


@task_bp.route("/read/<int:task_id>", methods=["GET"])
@login_required
def read_task(task_id):
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    # Restrict to only user's tasks via the folder relationship
    folder = db.session.get(Folder, task.folder_id)
    if folder.user_id != current_user.id:
        return jsonify({"error": "Unauthorized access"}), 403

    return jsonify(
        {
            "id": task.id,
            "name": task.name,
            "status": task.status,
            "folder_id": task.folder_id,
        }
    )


@task_bp.route("/update/<int:task_id>", methods=["PUT", "PATCH"])
@login_required
def update_task(task_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    folder = db.session.get(Folder, task.folder_id)
    if folder.user_id != current_user.id:
        return jsonify({"error": "Unauthorized access"}), 403

    name = data.get("name")
    description = data.get("description")
    status = data.get("status")

    if name:
        task.name = name
    if description:
        task.description = description
    if status:
        task.status = status

    db.session.commit()

    return (
        jsonify(
            {
                "message": "Task updated successfully",
                "id": task.id,
                "name": task.name,
                "status": task.status,
                "folder_id": task.folder_id,
            }
        ),
        200,
    )


@task_bp.route("/delete/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    folder = db.session.get(Folder, task.folder_id)
    if folder.user_id != current_user.id:
        return jsonify({"error": "Unauthorized access"}), 403

    db.session.delete(task)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Task deleted successfully",
                "id": task.id,
                "name": task.name,
            }
        ),
        200,
    )
