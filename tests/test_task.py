import pytest


def test_create_task_success(client, auth):
    """Test successful task creation"""
    auth.register()
    auth.login()
    folder = client.post(
        "/folder/create",
        json={"name": "CS156", "description": "Machine Learning"},
        content_type="application/json",
    )

    folder_data = folder.get_json()
    folder_id = folder_data["id"]

    response = client.post(
        "/task/create",
        json={"name": "Code MLP from scratch", "folder_id": folder_id},
        content_type="application/json",
    )

    data = response.get_json()
    assert data["message"] == "New task created"
    assert "id" in data
    assert data["name"] == "Code MLP from scratch"


def test_read_task_success(client, auth):
    """Test successful task creation"""
    auth.register()
    auth.login()
    folder = client.post(
        "/folder/create",
        json={"name": "CS156", "description": "Machine Learning"},
        content_type="application/json",
    )

    folder_data = folder.get_json()
    folder_id = folder_data["id"]

    task = client.post(
        "/task/create",
        json={"name": "Code MLP from scratch", "folder_id": folder_id},
        content_type="application/json",
    )

    task_data = task.get_json()
    task_id = task_data["id"]

    response = client.get(f"/task/read/{task_id}")
    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == task_id
    assert data["name"] == "Code MLP from scratch"


def test_update_task_success(client, auth):
    """Test successful task creation"""
    auth.register()
    auth.login()
    folder = client.post(
        "/folder/create",
        json={"name": "CS156", "description": "Machine Learning"},
        content_type="application/json",
    )

    folder_data = folder.get_json()
    folder_id = folder_data["id"]

    task = client.post(
        "/task/create",
        json={"name": "Code MLP from scratch", "folder_id": folder_id},
        content_type="application/json",
    )

    task_data = task.get_json()
    task_id = task_data["id"]

    # Update the task
    updated_data = {
        "name": "Code MLP in Python",
    }
    response = client.put(
        f"/task/update/{task_id}",
        json=updated_data,
        content_type="application/json",
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Task updated successfully"
    assert data["id"] == task_id
    assert data["name"] == "Code MLP in Python"


def test_delete_task_success(client, auth):
    """Test successful task creation"""
    auth.register()
    auth.login()
    folder = client.post(
        "/folder/create",
        json={"name": "CS156", "description": "Machine Learning"},
        content_type="application/json",
    )

    folder_data = folder.get_json()
    folder_id = folder_data["id"]

    task = client.post(
        "/task/create",
        json={"name": "Code MLP from scratch", "folder_id": folder_id},
        content_type="application/json",
    )

    task_data = task.get_json()
    task_id = task_data["id"]

    response = client.delete(f"/task/delete/{task_id}")
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Task deleted successfully"
    assert data["id"] == task_id
    assert data["name"] == "Code MLP from scratch"
