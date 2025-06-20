from app.models import db, Categories, Tasks
from datetime import datetime
from typing import Dict, Any, Optional, List
from app.utils import validate_hex_color


class CategoryService:
    def __init__(self, db):
        self.db = db

    def add_new_category(
        self, categoryData: Dict[str, Any], user_id: int
    ) -> Categories:
        """Create a new category for a user

        Args:
            categoryData: Dictionary containing category data (name, color)
            user_id: ID of the user creating the category

        Returns:
            Categories: The newly created category object

        Raises:
            ValueError: If validation fails or duplicate name exists
        """
        if "name" not in categoryData:
            raise ValueError("Missing required field: name")
        if "color" not in categoryData:
            raise ValueError("Missing required field: color")

        name = categoryData["name"].strip()
        color = categoryData["color"].strip()

        if not name:
            raise ValueError("Category name cannot be empty")

        if not self.validate_hex_color(color):
            raise ValueError("Color must be a valid hex color code (e.g., #FF5733)")

        # Check for duplicate category names for this user
        existing_category = Categories.query.filter_by(name=name, user_id=user_id).first()
        if existing_category:
            raise ValueError("Category name already exists. Please choose a different name.")

        # Create new category
        category = Categories(name=name, color=color, user_id=user_id)
        self.db.session.add(category)
        self.db.session.commit()

        return category

    def read_one_category(self, categoryId: int, user_id: int) -> Optional[Categories]:
        """Retrieve a category by ID for a specific user"""
        category = Categories.query.filter_by(id=categoryId, user_id=user_id).first()
        return category

    def update_one_category(self, categoryId: int, updateData: Dict[str, Any], user_id: int) -> Categories:
        """Update a category

        Args:
            categoryId: ID of the category to update
            updateData: Dictionary containing fields to update
            user_id: ID of the user (for authorization)

        Returns:
            Categories: The updated category object

        Raises:
            ValueError: If validation fails or category not found
        """
        category = Categories.query.filter_by(id=categoryId, user_id=user_id).first()

        if not category:
            raise ValueError("Category does not exist")

        # Update name if provided
        if "name" in updateData:
            new_name = updateData["name"].strip()
            if not new_name:
                raise ValueError("Category name cannot be empty")

            # Check for duplicate names (excluding current category)
            existing_category = Categories.query.filter(
                Categories.name == new_name,
                Categories.id != categoryId,
                Categories.user_id == user_id).first()
            if existing_category:
                raise ValueError("Category name already exists. Please choose a different name.")

            category.name = new_name

        # Update color if provided
        if "color" in updateData:
            new_color = updateData["color"].strip()
            if not self.validate_hex_color(new_color):
                raise ValueError("Color must be a valid hex color code (e.g., #FF5733)")

            category.color = new_color

        category.updated_at = datetime.utcnow()
        self.db.session.commit()

        return category

    def delete_one_category(self, categoryId: int, user_id: int) -> None:
        """Delete a category

        Args:
            categoryId: ID of the category to delete
            user_id: ID of the user (for authorization)

        Raises:
            ValueError: If category doesn't exist or is still in use
        """
        category = Categories.query.filter_by(id=categoryId, user_id=user_id).first()

        if not category:
            raise ValueError("Category does not exist")

        # Check if category is being used by any tasks
        tasks_using_category = Tasks.query.filter_by(category_id=categoryId).count()
        if tasks_using_category > 0:
            raise ValueError(f"Cannot delete category. It is currently used by {tasks_using_category} task(s). "
                             "Please remove the category from all tasks first or choose a different category for them.")

        self.db.session.delete(category)
        self.db.session.commit()

    def get_user_categories(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all categories for a specific user

        Args:
            user_id: The ID of the user

        Returns:
            List[Dict]: A list of serialized category data with usage statistics
        """
        categories = Categories.query.filter_by(user_id=user_id).all()

        categories_data = []
        for category in categories:
            category_data = {
                "id": category.id,
                "name": category.name,
                "color": category.color,
                "task_count": len(category.tasks),
                "completed_task_count": len([t for t in category.tasks if t.status.value == "done"]),
                "created_at": (category.created_at.isoformat() if category.created_at else None),
                "updated_at": (category.updated_at.isoformat() if category.updated_at else None),
            }
            categories_data.append(category_data)

        return categories_data

    def get_category_tasks(self, categoryId: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Get a category with all its associated tasks

        Args:
            categoryId: ID of the category
            user_id: ID of the user (for authorization)

        Returns:
            Dict containing category info and its tasks, or None if not found
        """
        category = Categories.query.filter_by(id=categoryId, user_id=user_id).first()

        if not category:
            return None

        # Serialize tasks ()
        tasks_data = []
        for task in category.tasks:
            task_data = {
                "id": task.id,
                "name": task.name,
                "description": task.description,
                "status": task.status.value,
                "priority": task.priority.value,
                "planned_duration": task.planned_duration,
                "total_time_worked": task.total_time_worked,
                "list_id": task.list_id,
                "list_name": task.list.name,
                "project_name": task.list.project.name if task.list.project else None,
                "completed_at": (task.completed_at.isoformat() if task.completed_at else None),
            }
            tasks_data.append(task_data)

        category_data = {
            "id": category.id,
            "name": category.name,
            "color": category.color,
            "task_count": len(tasks_data),
            "tasks": tasks_data,
            "created_at": (category.created_at.isoformat() if category.created_at else None),
            "updated_at": (category.updated_at.isoformat() if category.updated_at else None),
        }

        return category_data

    def get_category_options(self, user_id: int) -> List[Dict[str, Any]]:
        """Get simplified category list for dropdowns/selectors

        Args:
            user_id: The ID of the user

        Returns:
            List[Dict]: Simple list with id, name, and color for UI components
        """
        categories = Categories.query.filter_by(user_id=user_id).all()

        return [
            {"id": category.id, 
             "name": category.name, 
             "color": category.color}
            for category in categories
        ]

    def update_category_for_task(self, task_id: int, category_id: Optional[int], user_id: int) -> bool:
        """Update category assignment for a task

        Args:
            task_id: ID of the task to update
            category_id: ID of the new category (None to remove category)
            user_id: ID of the user (for authorization)

        Returns:
            bool: True if successful

        Raises:
            ValueError: If task or category doesn't exist or doesn't belong to user
        """
        # Verify task exists and belongs to user (through list -> project -> user relationship)
        task = (Tasks.query.join(Tasks.list).join( "project")
                .filter(Tasks.id == task_id).first())

        if not task:
            raise ValueError("Task not found or access denied")

        # Verify category exists and belongs to user (if provided)
        if category_id:
            category = Categories.query.filter_by(id=category_id, user_id=user_id).first()
            if not category:
                raise ValueError("Category not found or access denied")

        # Update task category
        task.category_id = category_id
        task.updated_at = datetime.utcnow()
        self.db.session.commit()

        return True
