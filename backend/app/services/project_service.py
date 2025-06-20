from sqlalchemy import or_
from app.models import db, Users, Projects, Lists, TaskStatus
from datetime import datetime
from typing import Dict, Any, Optional, List
from app.utils import get_utc_now


class ProjectService:
    def __init__(self, db):
        self.db = db

    def add_new_project(self, projectData: Dict[str, Any], user_id: int) -> Projects:
        """Logic to add a new folder to the Projects table

        1. Retrieve what is updated in the data sent from user's request
        2. Check if name is not a duplicate for the user's projects
        3. If not, create a project object with name, description and status and add it to the database
        """
        # Validate required fields
        if "name" not in projectData:
            raise ValueError("Missing required field: name")
        if "status" not in projectData:
            raise ValueError("Missing required field: status")

        name = projectData["name"].strip()
        description = projectData.get("description", "").strip()
        status = projectData["status"]

        if not name:
            raise ValueError("Project name cannot be empty")

        # Check for duplicate project names for this user
        existing_project = Projects.query.filter_by(name=name, user_id=user_id).first()
        if existing_project:
            raise ValueError("Project name already exists. Please choose a new one.")

        project = Projects(
            name=name, description=description, status=status, user_id=user_id
        )
        self.db.session.add(project)
        self.db.session.commit()
        return project

    def read_one_project(self, projectId: int) -> Optional[Dict[str, Any]]:
        """Logic to retrieve all lists for a project"""
        project = Projects.query.filter_by(id=projectId).first()

        if not project:
            return None

        # Get the lists associated with this project with their progress
        lists_data = []
        if project.lists:
            for list_item in project.lists:
                list_data = {
                    "id": list_item.id,
                    "name": list_item.name,
                    "progress": list_item.progress,
                    "task_count": len(list_item.tasks),
                    "completed_tasks": len(
                        [t for t in list_item.tasks if t.status == TaskStatus.DONE]
                    ),
                }
                lists_data.append(list_data)

        # Return project with its lists
        project_data = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "lists": lists_data,
            "created_at": (
                project.created_at.isoformat() if project.created_at else None
            ),
            "updated_at": (
                project.updated_at.isoformat() if project.updated_at else None
            ),
        }

        return project_data

    def update_one_project(
        self, projectId: int, updateData: Dict[str, Any]
    ) -> Projects:
        """Logic to update a project"""
        project = Projects.query.filter_by(id=projectId).first()

        if not project:
            raise ValueError("Project does not exist")

        if "name" in updateData:
            new_name = updateData["name"].strip()
            if not new_name:
                raise ValueError("Project name cannot be empty")

            # Check for duplicate names (excluding current project)
            existing_project = Projects.query.filter(
                Projects.name == new_name,
                Projects.id != projectId,
                Projects.user_id == project.user_id,
            ).first()
            if existing_project:
                raise ValueError(
                    "Project name already exists. Please choose a different one"
                )
            project.name = new_name

        if "description" in updateData:
            project.description = updateData["description"].strip()

        if "status" in updateData:
            project.status = updateData["status"]

        project.updated_at = get_utc_now()
        self.db.session.commit()

        return project

    def delete_one_project(self, projectId: int) -> None:
        """Delete a project and all its associated lists and tasks"""
        project = Projects.query.filter_by(id=projectId).first()
        if not project:
            raise ValueError("Project does not exist")

        self.db.session.delete(project)
        self.db.session.commit()

    def get_user_projects(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all projects for a specific user

        Args:
            user_id: The ID of the user

        Returns:
            List[Dict]: A list of serialized project data with summary info
        """
        projects = Projects.query.filter_by(user_id=user_id).all()

        # Serialize projects with summary information
        projects_data = []
        for project in projects:
            total_lists = project.list_count
            total_tasks = project.total_tasks
            completed_tasks = project.completed_tasks
            project_progress = project.progress

            project_data = {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "status": project.status,
                "total_lists": total_lists,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "created_at": (
                    project.created_at.isoformat() if project.created_at else None
                ),
                "updated_at": (
                    project.updated_at.isoformat() if project.updated_at else None
                ),
            }
            projects_data.append(project_data)

        return projects_data

    # List-related logic
    def serialize_list(self, list_item):
        """Helper function to consistently serialize list objects"""
        from app.models import TaskStatus

        return {
            "id": list_item.id,
            "name": list_item.name,
            "progress": list_item.progress,
            "project_id": list_item.project_id,
            "total_tasks": list_item.task_count,
            "completed_tasks": list_item.completed_task_count,
            "created_at": (list_item.created_at.isoformat() if list_item.created_at else None),
            "updated_at": (list_item.updated_at.isoformat() if list_item.updated_at else None),
        }
    
    def add_new_list(self, listData: Dict[str, Any], projectId: int) -> Lists:
        """Add a new list to a project

        Args:
            listData: Dictionary containing list data (name, progress)
            projectId: ID of the project to add the list to

        Returns:
            Lists: The newly created list object

        Raises:
            ValueError: If a list with the same name already exists in the project
        """
        # Validate required fields
        if "name" not in listData:
            raise ValueError("Missing required field: name")

        name = listData["name"].strip()
        progress = listData.get("progress", 0.0)

        if not name:
            raise ValueError("List name cannot be empty")

        # Check if project exists
        project = Projects.query.filter_by(id=projectId).first()
        if not project:
            raise ValueError(f"Project with ID {projectId} does not exist")

        # Check if list name already exists in this project
        existing_list = Lists.query.filter_by(name=name, project_id=projectId).first()
        if existing_list:
            raise ValueError("List name already exists in this project")

        # Validate progress value
        if not isinstance(progress, (int, float)) or progress < 0.0 or progress > 1.0:
            raise ValueError("Progress must be a number between 0.0 and 1.0")

        # Create and save the new list
        new_list = Lists(name=name, progress=progress, project_id=projectId)
        self.db.session.add(new_list)
        self.db.session.commit()

        return new_list

    def read_one_list(self, listId: int) -> Optional[Dict[str, Any]]:
        """Get a list with all its tasks"""
        list_item = Lists.query.filter_by(id=listId).first()

        if not list_item:
            return None

        # Serialize tasks with proper field names
        tasks_data = []
        for task in list_item.tasks:
            task_data = {
                "id": task.id,
                "name": task.name,
                "description": task.description,
                "status": task.status.value,
                "priority": task.priority.value,
                "planned_duration": task.planned_duration,
                "total_time_worked": task.total_time_worked,
                "mental_state": task.mental_state.value if task.mental_state else None,
                "reflection": task.reflection,
                "category_id": task.category_id,
                "first_started_at": (
                    task.first_started_at.isoformat() if task.first_started_at else None
                ),
                "completed_at": (
                    task.completed_at.isoformat() if task.completed_at else None
                ),
            }
            tasks_data.append(task_data)

        list_data = {
            "id": list_item.id,
            "name": list_item.name,
            "progress": list_item.progress,
            "project_id": list_item.project_id,
            "total_tasks": list_item.task_count,
            "completed_tasks": list_item.completed_task_count,
            "tasks": tasks_data,
            "created_at": (
                list_item.created_at.isoformat() if list_item.created_at else None
            ),
            "updated_at": (
                list_item.updated_at.isoformat() if list_item.updated_at else None
            ),
        }

        return list_data

    def update_one_list(self, listId: int, updateData: Dict[str, Any]) -> Lists:
        list_item = Lists.query.filter_by(id=listId).first()

        if not list_item:
            raise ValueError("List does not exist")

        if "name" in updateData:
            new_name = updateData["name"].strip()
            if not new_name:
                raise ValueError("List name cannot be empty")

            # Check for duplicate names in the same project (excluding current list)
            existing_list = Lists.query.filter(
                Lists.name == new_name,
                Lists.id != listId,
                Lists.project_id == list_item.project_id,
            ).first()
            if existing_list:
                raise ValueError(
                    "List name already exists in this project. Please choose a different one"
                )
            list_item.name = new_name

        # Progress should be calculated automatically, but allow manual override if needed
        if "progress" in updateData:
            progress = updateData["progress"]
            if (
                not isinstance(progress, (int, float))
                or progress < 0.0
                or progress > 1.0
            ):
                raise ValueError("Progress must be a number between 0.0 and 1.0")
            list_item.progress = progress

        list_item.updated_at = get_utc_now()
        self.db.session.commit()

        return list_item

    def delete_one_list(self, listId: int) -> None:
        """Delete a list and all its associated tasks"""
        list_item = Lists.query.filter_by(id=listId).first()
        if not list_item:
            raise ValueError("List does not exist")

        self.db.session.delete(list_item)
        self.db.session.commit()

    def get_project_lists(self, projectId: int) -> List[Dict[str, Any]]:
        """Get all lists for a specific project"""
        project = Projects.query.filter_by(id=projectId).first()
        if not project:
            raise ValueError(f"Project with ID {projectId} does not exist")

        lists_data = []
        for list_item in project.lists:
            list_data = {
                "id": list_item.id,
                "name": list_item.name,
                "progress": list_item.progress,
                "total_tasks": list_item.task_count,
                "completed_tasks": list_item.completed_task_count,
                "created_at": (
                    list_item.created_at.isoformat() if list_item.created_at else None
                ),
                "updated_at": (
                    list_item.updated_at.isoformat() if list_item.updated_at else None
                ),
            }
            lists_data.append(list_data)

        return lists_data
