from flask import jsonify, request, Blueprint
from models import List, db
from flask_login import login_required, current_user

bp_list = Blueprint("list", __name__)


# Get all the user lists from the database
@bp_list.route("/", methods=["GET"])
@login_required
def get_all_lists():
    """
    Retrieves all lists from the database for the authenticated user.

    Returns:
        A JSON response containing a success message and a list of all the user's lists.
        If the user is not authenticated, returns a JSON response with an error message and a 401 status code.
        If there is an error retrieving the lists, returns a JSON response with an error message and a 400 status code.
    """
    if not current_user.is_authenticated:
        print("Non-authenticated user tried to fetch all lists")
        return jsonify({"message": "User is not authenticated"}), 401

    success_message = "Successfully retrieved all lists from the database."
    failure_message = "Failed to retrieve all lists from the database."
    success_status = 200
    try:
        # Query the lists for the current user using their id
        lists = List.query.filter_by(user_id=current_user.id).all()
        print(f"User {current_user.username} fetched all of their lists")
        return (
            jsonify(
                {
                    "message": success_message,
                    "lists": [list.to_dict() for list in lists],
                }
            ),
            success_status,
        )
    except Exception as e:
        print(f"User {current_user.username}. Error fetching all of their lists: ", e)
        return jsonify({"message": f"{failure_message}. error is {e}"}), 400


# Add a new list to the database
@bp_list.route("/", methods=["POST"])
@login_required
def add_list():
    """
    Adds a new list to the database for the authenticated user.

    Returns:
        A JSON response with a success message and status code 200 if the list is added successfully.
        A JSON response with an error message and status code 400 if there is an error adding the list.
        A JSON response with an error message and status code 401 if the user is not authenticated.
    """
    if not current_user.is_authenticated:
        print("Non-authenticated user tried to add a new list")
        return jsonify({"message": "User is not authenticated"}), 401

    success_message = "Successfully added list to the database."
    failure_message = "Failed to add list to the database."
    success_status = 200

    try:
        list_data = request.get_json()
        user_id = current_user.id

        # Add the new list with its name and current user's id
        new_list = List(name=list_data["name"], user_id=user_id, tasks=[])
        db.session.add(new_list)
        db.session.commit()
        print(f"User {current_user.username} added a new list to their list")
        return jsonify({"message": success_message}), success_status

    except Exception as e:
        print(
            f"User {current_user.username} error adding a new list to their list: ", e
        )
        return jsonify({"message": f"{failure_message}. error is {e}"}), 400


# Delete a list from the database
@bp_list.route("/<int:list_id>", methods=["DELETE"])
def delete_list(list_id):
    """
    Deletes a list with the given list_id from the database.

    Args:
        list_id (int): The id of the list to be deleted.

    Returns:
        A JSON response containing a success or failure message and a status code.
    """
    success_message = f"Successfully deleted list with id {list_id}."
    failure_message = f"Failed to delete list with id {list_id}."
    success_status = 200

    try:
        list_to_delete = List.query.get(list_id)

        # Check if list exists
        if not list_to_delete:
            return jsonify({"message": f"No list found with id {list_id}."}), 404

        # If list has tasks, delete them first (cascade)
        if list_to_delete.tasks:
            for task in list_to_delete.tasks:
                db.session.delete(task)

        db.session.delete(list_to_delete)
        db.session.commit()

        print(f"User {current_user.username} deleted list with id {list_id}")
        return jsonify({"message": success_message}), success_status

    except Exception as e:
        print(
            f"User {current_user.username}. Error deleting list with id {list_id} from the database: ",
            e,
        )
        return jsonify({"message": f"{failure_message}. Error is {e}"}), 400


# Update list name in the database
@bp_list.route("/", methods=["PATCH"])
@login_required
def update_list_name():
    """
    Updates the name of a list in the database.

    Returns:
        A JSON response with a success or failure message and status code.
    """
    if not current_user.is_authenticated:
        print("Non-authenticated user tried to update list name in the database")
        return jsonify({"message": "User is not authenticated"}), 401

    success_message = "Successfully updated list name in the database."
    failure_message = "Failed to update list name in the database."
    success_status = 200
    print("User is updating list name in the database")

    try:
        list_data = request.get_json()
        list_id = list_data.get("id")
        list_name = list_data.get("name")
        list_to_update = List.query.get(list_id)
        list_to_update.name = list_name
        db.session.commit()
        print(f"User {current_user.username} updated list name in the database")
        return jsonify({"message": success_message}), success_status
    except Exception as e:
        print(
            f"User {current_user.username}. Error updating list name in the database: ",
            e,
        )
        return jsonify({"message": f"{failure_message}. error is {e}"}), 400
