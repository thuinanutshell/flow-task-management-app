from flask import Blueprint, jsonify, request
from flask_login import LoginManager, current_user, login_required
from backend.models import db, Task

task_bp = Blueprint("task", __name__, url_prefix="/task")


@task_bp.route("/create", methods=["POST"])
@login_required
def create_task():
    name = request.get_json("name")
    if Task.query.filter_by(name=name).first():
        return jsonify({"error": "Task name already exists"})
    else:
        task = Task(name=name)
        db.session.add(task)
        db.session.commit()
        return jsonify({"message": "New task created"}), 201


@task_bp.route("/read/<int:task_id>", methods=["GET"])
@login_required
def read_task(task_id):
    data = request.get_data()
    name = data["name"]
    task = Task.query.filter_by(id=task_id, name=name).first()

    return jsonify({"message": f"{task}"})


@task_bp.route("/update/<int:task_id>", methods=["PUT", "PATCH"])
@login_required
def update_task(task_id):
    data = request.get_data()
    task = Task.query.filter_by(id=task_id)
    if data["name"]:
        task.name = data["name"]
    if data["description"]:
        task.description = data["description"]
    if data["status"]:
        task.status = data["status"]

    db.session.commit()
    return jsonify({"message": "Updated task"}), 200


@task_bp.route("/delete/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    id = request.get_json("id")
    task = Task.query.filter_by(id=id).all()
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted successfully"}), 200
