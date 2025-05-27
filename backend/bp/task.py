from flask import Blueprint, jsonify, request
from flask_login import LoginManager, current_user, login_required
from backend.models import db, Task

task_bp = Blueprint("task", __name__, url_prefix="/task")


@task_bp.route("/create", methods=["POST"])
@login_required
def create_task():
    data = request.get_json()
    name = data.get("name")
    status = data.get("status")
    if Task.query.filter_by(name=name).first():
        return jsonify({"error": "Task name already exists"}), 409
    else:
        if name and status:
            task = Task(name=name, status=status)
        else:
            task = Task(name=name)
        db.session.add(task)
        db.session.commit()
        return (
            jsonify(
                {"message": "New task created"},
                {
                    "id": task.id,
                    "name": task.name,
                    "description": getattr(task, "description", None),
                    "status": getattr(task, "status", None),
                },
            ),
            201,
        )


@task_bp.route("/read/<int:task_id>", methods=["GET"])
@login_required
def read_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(
        {
            "id": task.id,
            "name": task.name,
            "description": getattr(task, "description", None),
            "status": getattr(task, "status", None),
        }
    )


@task_bp.route("/update/<int:task_id>", methods=["PUT", "PATCH"])
@login_required
def update_task(task_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    name = data.get("name")
    description = data.get("description")
    status = data.get("status")

    if name is not None:
        task.name = name
    if description is not None:
        task.description = description
    if status is not None:
        task.status = status

    db.session.commit()
    return (
        jsonify(
            {"message": "Task updated successfully"},
            {
                "id": task.id,
                "name": task.name,
                "description": getattr(task, "description", None),
                "status": getattr(task, "status", None),
            },
        ),
        200,
    )


@task_bp.route("/delete/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return (
        jsonify(
            {"message": "Task deleted successfully"}, {"id": task.id, "name": task.name}
        ),
        200,
    )
