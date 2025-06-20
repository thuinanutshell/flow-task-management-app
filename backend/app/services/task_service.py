from app.models import (
    db,
    Tasks,
    TaskStatus,
    TaskPriority,
    MentalState,
    Lists,
    Categories,
)
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from app.utils import get_utc_now, ensure_timezone_aware


class TaskService:
    def __init__(self, db):
        self.db = db

    def add_new_task(self, taskData: Dict[str, Any], listId: int) -> Tasks:
        # Validate required fields
        required_fields = ["name", "priority", "planned_duration"]
        for field in required_fields:
            if field not in taskData:
                raise ValueError(f"Missing required field: {field}")

        name = taskData["name"]
        description = taskData.get("description", "")
        priority = taskData["priority"]
        planned_duration = taskData["planned_duration"]
        category_id = taskData.get("category_id")

        # Check if list exists
        list_item = Lists.query.filter_by(id=listId).first()
        if not list_item:
            raise ValueError(f"List with ID {listId} does not exist")

        # Validate category if provided
        if category_id:
            category = Categories.query.filter_by(id=category_id).first()
            if not category:
                raise ValueError(f"Category with ID {category_id} does not exist")

        # Check if task name already exists in this list
        existing_task = Tasks.query.filter_by(name=name, list_id=listId).first()
        if existing_task:
            raise ValueError("Task with this name already exists in the list")

        # Validate planned duration
        if planned_duration <= 0:
            raise ValueError("Planned duration must be greater than 0")

        # Create new task
        new_task = Tasks(
            name=name,
            description=description,
            priority=priority,
            planned_duration=planned_duration,
            list_id=listId,
            category_id=category_id,
        )

        self.db.session.add(new_task)
        self.db.session.commit()
        return new_task

    def read_one_task(self, taskId: int) -> Optional[Tasks]:
        """Retrieve a task by ID"""
        task = Tasks.query.filter_by(id=taskId).first()
        return task

    def update_one_task(
        self, taskId: int, updateData: Dict[str, Any]
    ) -> Optional[Tasks]:
        task = Tasks.query.filter_by(id=taskId).first()
        if not task:
            return None

        # Validate that task is not currently active before allowing updates
        if task.is_timer_active and any(
            key in updateData
            for key in ["name", "description", "priority", "planned_duration"]
        ):
            raise ValueError("Cannot update task details while timer is active")

        # Update basic fields
        if "name" in updateData:
            # Check for duplicate names in the same list
            existing_task = Tasks.query.filter(
                Tasks.name == updateData["name"],
                Tasks.list_id == task.list_id,
                Tasks.id != taskId,
            ).first()
            if existing_task:
                raise ValueError("Task with this name already exists in the list")
            task.name = updateData["name"]

        if "description" in updateData:
            task.description = updateData["description"]

        if "priority" in updateData:
            task.priority = updateData["priority"]

        if "planned_duration" in updateData:
            if updateData["planned_duration"] <= 0:
                raise ValueError("Planned duration must be greater than 0")
            task.planned_duration = updateData["planned_duration"]

        if "category_id" in updateData:
            if updateData["category_id"]:
                category = Categories.query.filter_by(
                    id=updateData["category_id"]
                ).first()
                if not category:
                    raise ValueError(
                        f"Category with ID {updateData['category_id']} does not exist"
                    )
            task.category_id = updateData["category_id"]

        task.updated_at = get_utc_now()
        self.db.session.commit()
        return task

    def delete_one_task(self, taskId: int) -> bool:
        """Delete a task"""
        task = Tasks.query.filter_by(id=taskId).first()
        if not task:
            return False

        # Don't allow deletion of active tasks
        if task.is_timer_active:
            raise ValueError("Cannot delete task while timer is active")

        # Update list progress after deletion
        list_id = task.list_id
        self.db.session.delete(task)
        self.db.session.commit()

        # Update the list progress
        self.update_list_progress(list_id)

        return True

    def start_or_resume_timer(
        self, task_id: int, duration_minutes: int
    ) -> Dict[str, Any]:
        """Start timer for new task OR resume timer for paused task with additional time"""
        task = Tasks.query.filter_by(id=task_id).first()
        if not task:
            raise ValueError("Task not found")

        # Validate current state
        if task.status not in [TaskStatus.NOT_STARTED, TaskStatus.PAUSED]:
            raise ValueError(f"Cannot start timer from {task.status.value} status")

        if duration_minutes <= 0:
            raise ValueError("Duration must be greater than 0")

        # Start/Resume timer with timezone-aware datetime
        now = get_utc_now()
        task.current_work_start = now
        task.current_planned_end = now + timedelta(minutes=duration_minutes)
        task.status = TaskStatus.ACTIVE

        # Set first_started_at if this is the first time
        if not task.first_started_at:
            task.first_started_at = now

        task.updated_at = now
        self.db.session.commit()

        return {
            "task_id": task_id,
            "status": task.status.value,
            "current_work_start": task.current_work_start.isoformat(),
            "current_planned_end": task.current_planned_end.isoformat(),
            "duration_minutes": duration_minutes,
            "total_time_worked": task.total_time_worked,
            "elapsed_minutes": 0,
            "remaining_minutes": duration_minutes,
        }

    def extend_timer(self, task_id: int, extension_minutes: int) -> Dict[str, Any]:
        """Extend current active timer"""
        task = Tasks.query.filter_by(id=task_id).first()
        if not task:
            raise ValueError("Task not found")

        if not task.is_timer_active:
            raise ValueError("No active timer to extend")

        if extension_minutes <= 0:
            raise ValueError("Extension minutes must be greater than 0")

        # Extend the planned end time
        task.current_planned_end += timedelta(minutes=extension_minutes)
        task.updated_at = datetime.utcnow()
        self.db.session.commit()

        return {
            "task_id": task_id,
            "new_planned_end": task.current_planned_end.isoformat(),
            "extension_minutes": extension_minutes,
            "remaining_minutes": task.current_session_remaining_minutes,
            "elapsed_minutes": task.current_session_elapsed_minutes,
        }

    def pause_timer(self, task_id: int) -> Dict[str, Any]:
        """Pause active timer and add elapsed time to total"""
        task = Tasks.query.filter_by(id=task_id).first()
        if not task:
            raise ValueError("Task not found")

        if not task.is_timer_active:
            raise ValueError("No active timer to pause")

        # Calculate elapsed time and add to total
        elapsed_minutes = task.current_session_elapsed_minutes
        task.total_time_worked += elapsed_minutes

        # Clear current session and update status
        task.current_work_start = None
        task.current_planned_end = None
        task.status = TaskStatus.PAUSED
        task.updated_at = get_utc_now()

        self.db.session.commit()

        return {
            "task_id": task_id,
            "status": task.status.value,
            "session_duration": elapsed_minutes,
            "total_time_worked": task.total_time_worked,
        }

    def complete_timer(
        self, task_id: int, mental_state: str, reflection: str
    ) -> Dict[str, Any]:
        """Complete timer and mark task as done (mental_state and reflection are mandatory)"""
        task = Tasks.query.filter_by(id=task_id).first()
        if not task:
            raise ValueError("Task not found")

        if not task.is_timer_active:
            raise ValueError("No active timer to complete")

        # Validate mandatory fields
        if not mental_state or not mental_state.strip():
            raise ValueError("Mental state is required when completing a task")
        if not reflection or not reflection.strip():
            raise ValueError("Reflection is required when completing a task")

        try:
            mental_state_enum = MentalState(mental_state)
        except ValueError:
            valid_values = [e.value for e in MentalState]
            raise ValueError(
                f"Invalid mental state value. Valid options: {valid_values}"
            )

        # FIXED: Calculate elapsed time properly
        # Get current time and start time
        now = get_utc_now()
        start_time = ensure_timezone_aware(task.current_work_start)

        # Calculate elapsed minutes in current session
        elapsed_seconds = (now - start_time).total_seconds()
        elapsed_minutes = int(elapsed_seconds / 60)

        # Add elapsed time to total time worked
        task.total_time_worked += elapsed_minutes

        # IMPORTANT: Log for debugging
        print(f"DEBUG: Session started at: {start_time}")
        print(f"DEBUG: Completed at: {now}")
        print(f"DEBUG: Elapsed seconds: {elapsed_seconds}")
        print(f"DEBUG: Elapsed minutes: {elapsed_minutes}")
        print(f"DEBUG: New total time worked: {task.total_time_worked}")

        # Complete the task
        task.current_work_start = None
        task.current_planned_end = None
        task.status = TaskStatus.DONE
        task.completed_at = now
        task.mental_state = mental_state_enum
        task.reflection = reflection.strip()
        task.updated_at = now

        self.db.session.commit()

        # Update list progress after task completion
        self.update_list_progress(task.list_id)

        return {
            "task_id": task_id,
            "status": task.status.value,
            "session_duration": elapsed_minutes,
            "total_time_worked": task.total_time_worked,
            "completed_at": task.completed_at.isoformat(),
            "mental_state": task.mental_state.value,
            "reflection": task.reflection,
        }

    def get_timer_status(self, task_id: int) -> Dict[str, Any]:
        """Get comprehensive timer status for a task"""
        task = Tasks.query.filter_by(id=task_id).first()
        if not task:
            raise ValueError("Task not found")

        # Base status info
        status_info = {
            "task_id": task_id,
            "status": task.status.value,
            "total_time_worked": task.total_time_worked,
            "planned_duration": task.planned_duration,
            "first_started_at": task.first_started_at,
            "completed_at": task.completed_at,
            "is_timer_active": task.is_timer_active,
        }

        # Add current session info if timer is active
        if task.is_timer_active:
            status_info.update(
                {
                    "current_work_start": task.current_work_start,
                    "current_planned_end": task.current_planned_end,
                    "elapsed_minutes": task.current_session_elapsed_minutes,
                    "remaining_minutes": task.current_session_remaining_minutes,
                    "is_expired": task.is_timer_expired,
                }
            )

        # Add completion info if task is done
        if task.status == TaskStatus.DONE:
            status_info.update(
                {
                    "mental_state": (
                        task.mental_state.value if task.mental_state else None
                    ),
                    "reflection": task.reflection,
                }
            )

        return status_info

    def check_timer_expiration(self, task_id: int) -> Dict[str, Any]:
        """Check if timer has expired and needs user action"""
        task = Tasks.query.filter_by(id=task_id).first()
        if not task:
            raise ValueError("Task not found")

        return {
            "task_id": task_id,
            "is_expired": task.is_timer_expired,
            "is_active": task.is_timer_active,
            "remaining_minutes": task.current_session_remaining_minutes,
            "elapsed_minutes": task.current_session_elapsed_minutes,
            "status": task.status.value,
        }

    def get_timer_poll_data(self, task_id: int) -> Dict[str, Any]:
        """Lightweight endpoint for frontend polling"""
        task = Tasks.query.filter_by(id=task_id).first()
        if not task:
            raise ValueError("Task not found")

        poll_data = {
            "task_id": task_id,
            "status": task.status.value,
            "is_timer_active": task.is_timer_active,
            "total_time_worked": task.total_time_worked,
        }

        if task.is_timer_active:
            poll_data.update(
                {
                    "elapsed_minutes": task.current_session_elapsed_minutes,
                    "remaining_minutes": task.current_session_remaining_minutes,
                    "is_expired": task.is_timer_expired,
                }
            )

        return poll_data

    def update_list_progress(self, list_id: int) -> None:
        """Update the progress of a list based on completed tasks

        This method retrieves the list, calculates its progress using the
        existing calculate_progress method, and updates the progress field.

        Args:
            list_id: The ID of the list to update
        """
        list_item = Lists.query.filter_by(id=list_id).first()
        if not list_item:
            return

        list_item.progress = list_item.calculate_progress()
        list_item.updated_at = get_utc_now()
        self.db.session.commit()
