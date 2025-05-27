from flask import Blueprint, jsonify, request
from flask_login import LoginManager, current_user, login_required
from backend.models import db, Folder

folder_bp = Blueprint("folder", __name__, url_prefix="/folder")


@folder_bp.route("/create", methods=["POST"])
@login_required
def create_folder():
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")
    if Folder.query.filter_by(name=name).first():
        return jsonify({"error": "Folder name already exists"}), 409
    else:
        if name and description:
            folder = Folder(name=name, description=description, user_id=current_user.id)
        else:
            folder = Folder(name=name)
        db.session.add(folder)
        db.session.commit()
        return (
            jsonify(
                {"message": "New folder created"},
                {
                    "id": folder.id,
                    "folder": folder.name,
                    "description": getattr(folder, "description", None),
                },
            ),
            201,
        )


@folder_bp.route("/read/<int:folder_id>", methods=["GET"])
@login_required
def read_folder(folder_id):
    folder = Folder.query.get(folder_id)
    if not folder:
        return jsonify({"error": "Folder not found"}), 404
    return (
        jsonify(
            {
                "id": folder.id,
                "name": folder.name,
                "description": getattr(folder, "description", None),
                "tasks": folder.tasks,
            }
        ),
        200,
    )


@folder_bp.route("/update/<int:folder_id>", methods=["PUT", "PATCH"])
@login_required
def update_folder(folder_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    folder = Folder.query.get(folder_id)
    if not folder:
        return jsonify({"error": "Folder not found"}), 404

    name = data.get("name")
    description = data.get("description")

    if name is not None:
        folder.name = name
    if description is not None:
        folder.description = description

    db.session.commit()
    return (
        jsonify(
            {"message": "Folder updated successfully"},
            {
                "id": folder.id,
                "name": folder.name,
                "description": getattr(folder, "description", None),
                "tasks": folder.tasks,
            },
        ),
        200,
    )


@folder_bp.route("/delete/<int:folder_id>", methods=["DELETE"])
@login_required
def delete_folder(folder_id):
    folder = Folder.query.get(folder_id)
    if not folder:
        return jsonify({"error": "Folder not found"}), 404

    db.session.delete(folder)
    db.session.commit()
    return (
        jsonify(
            {"message": "Folder deleted successfully"},
            {"id": folder.id, "name": folder.name},
        ),
        200,
    )
