import pytest


def test_create_folder_success(client, auth):
    """Test successful folder creation"""
    auth.register()
    auth.login()
    response = client.post(
        "/folder/create",
        json={"name": "CS156", "description": "Machine Learning"},
        content_type="application/json",
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "New folder created"
    assert "id" in data
    assert data["folder"] == "CS156"
    assert data["description"] == "Machine Learning"


def test_read_folder_success(client, auth):
    """Test successful folder creation"""
    auth.register()
    auth.login()
    folder = client.post(
        "/folder/create",
        json={"name": "CS156", "description": "Machine Learning"},
        content_type="application/json",
    )
    folder_data = folder.get_json()
    folder_id = folder_data["id"]

    response = client.get(f"/folder/read/{folder_id}")
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == f"Folder {folder_id} is successfully retrieved"
    assert data["id"] == folder_id
    assert data["name"] == "CS156"
    assert data["description"] == "Machine Learning"


def test_update_folder_success(client, auth):
    """Test success folder update"""
    auth.register()
    auth.login()
    folder = client.post(
        "/folder/create",
        json={"name": "CS156", "description": "Machine Learning"},
        content_type="application/json",
    )
    folder_data = folder.get_json()
    folder_id = folder_data["id"]

    # Update the folder
    updated_data = {
        "name": "CS156",
        "description": "Machine Learning Finding Patterns in Data",
    }
    response = client.put(
        f"/folder/update/{folder_id}",
        json=updated_data,
        content_type="application/json",
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == f"Folder {folder_id} updated successfully"
    assert data["id"] == folder_id
    assert data["name"] == "CS156"
    assert data["description"] == "Machine Learning Finding Patterns in Data"


def test_delete_folder_success(client, auth):
    """Test successful folder creation"""
    auth.register()
    auth.login()
    folder = client.post(
        "/folder/create",
        json={"name": "CS156", "description": "Machine Learning"},
        content_type="application/json",
    )
    folder_data = folder.get_json()
    folder_id = folder_data["id"]

    response = client.delete(f"/folder/delete/{folder_id}")
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == f"Folder {folder_id} deleted successfully"
    assert data["id"] == folder_id
    assert data["name"] == "CS156"
