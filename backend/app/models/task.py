from sqlalchemy import (
    Integer,
    String,
    ForeignKey,
    DateTime,
    Text,
    Enum,
    UniqueConstraint,
    Float,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from datetime import datetime, timedelta, timezone
from typing import List, TYPE_CHECKING, Optional

from .base import db, TaskStatus, TaskPriority, MentalState
from app.utils import ensure_timezone_aware

# Use TYPE_CHECKING to avoid circular imports
if TYPE_CHECKING:
    from .project import Projects
    from .user import Users
    from .analytics import CategoryAnalytics


class Categories(db.Model):
    """Table to store task categories

    Attributes:
        id: category's unique ID
        name: category name
        color: the color associated with the category's ID (Hex Code)
    """

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="_user_category_uc"),
        Index("idx_categories_user_id", "user_id"),
        CheckConstraint("length(trim(name)) > 0", name="category_name_not_empty"),
    )
    color: Mapped[str] = mapped_column(
        String(7), nullable=False, comment="Hex color code for category visualization"
    )

    # Many-to-one relationship with the Users table
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped["Users"] = relationship(back_populates="categories")

    # One-to-many relationship with the task tables
    tasks: Mapped[List["Tasks"]] = relationship(back_populates="category")
    categoryanalytics: Mapped[List["CategoryAnalytics"]] = relationship(
        back_populates="category"
    )

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', color='{self.color}')>"


class Lists(db.Model):
    """Table to store list's information

    Attributes:
        id (int): unique identifier for each list
        name (str): list's name (the list name has to be unique within a project)
        progress (float): the fraction of number of tasks completely done.
                          When the list first started, its progress is 0, the progress is updated
                          as the task is updated as done.
        project_id: the project id that refers to the list.
                    this field can be null because when user creates a list for a specific day,
                    they can specify whether the list belongs to a project
                    or they do not have to do that.
    """

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)

    progress: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, server_default="0.0"
    )
    __table_args__ = (
        UniqueConstraint("project_id", "name", name="_project_list_uc"),
        CheckConstraint("progress >= 0.0 AND progress <= 1.0", name="progress_range"),
        CheckConstraint("length(trim(name)) > 0", name="list_name_not_empty"),
        Index("idx_lists_project_id", "project_id"),
        Index("idx_lists_progress", "progress"),
    )

    # Many-to-one relationship with the Projects table
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=True
    )
    project: Mapped["Projects"] = relationship(back_populates="lists")

    # One-to-many relationship with the task tables
    tasks: Mapped[List["Tasks"]] = relationship(
        back_populates="list", cascade="all, delete-orphan"
    )

    @property
    def task_count(self) -> int:
        """Get total number of tasks in this list"""
        return len(self.tasks)

    @property
    def completed_task_count(self) -> int:
        """Get number of completed tasks in this list"""
        return len([task for task in self.tasks if task.status == TaskStatus.DONE])

    def calculate_progress(self) -> float:
        """Calculate and return the current progress (doesn't update the field)"""
        if not self.tasks:
            return 0.0
        completed = self.completed_task_count
        total = self.task_count
        return completed / total if total > 0 else 0.0

    def __repr__(self):
        return f"<List(id={self.id}, name='{self.name}', progress={self.progress})>"


class Tasks(db.Model):
    """Table to store the main task's information

    Simplified timer tracking approach:
    - total_time_worked: cumulative minutes worked across all work periods
    - current_work_start: when current work session began (None if not active)
    - current_planned_end: when current timer should expire (None if not active)
    - status: NOT_STARTED, ACTIVE, PAUSED, DONE
    """

    # Basic task info
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), nullable=False, default=TaskStatus.NOT_STARTED
    )
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority), nullable=False)
    planned_duration: Mapped[int] = mapped_column(
        Integer, nullable=False, comment="Planned duration in minutes"
    )

    # Time tracking
    total_time_worked: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="Cumulative minutes worked"
    )
    current_work_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="Current session start time"
    )
    current_planned_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Current session planned end time",
    )

    # Task lifecycle timestamps
    first_started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="When task was first started"
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="When task was completed"
    )

    # Completion fields (mandatory when status = DONE)
    mental_state: Mapped[Optional[MentalState]] = mapped_column(
        Enum(MentalState), nullable=True
    )
    reflection: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="User reflection on task completion"
    )

    __table_args__ = (
        CheckConstraint("planned_duration > 0", name="positive_planned_duration"),
        CheckConstraint("total_time_worked >= 0", name="non_negative_total_time"),
        CheckConstraint("length(trim(name)) > 0", name="task_name_not_empty"),
        CheckConstraint(
            "(status = 'done' AND mental_state IS NOT NULL AND reflection IS NOT NULL) OR status != 'done'",
            name="completion_fields_required_when_done",
        ),
        CheckConstraint(
            "(current_work_start IS NULL AND current_planned_end IS NULL) OR "
            "(current_work_start IS NOT NULL AND current_planned_end IS NOT NULL)",
            name="timer_fields_consistency",
        ),
        Index("idx_tasks_list_id", "list_id"),
        Index("idx_tasks_status", "status"),
        Index("idx_tasks_category_id", "category_id"),
        Index("idx_tasks_priority", "priority"),
        Index("idx_tasks_status_list", "status", "list_id"),
    )

    # Foreign key relationships
    list_id: Mapped[int] = mapped_column(ForeignKey("lists.id", ondelete="CASCADE"))
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    list: Mapped["Lists"] = relationship(back_populates="tasks")
    category: Mapped[Optional["Categories"]] = relationship(back_populates="tasks")
    experiment_tasks: Mapped[List["ExperimentTasks"]] = relationship(
        back_populates="task"
    )

    @property
    def is_timer_active(self) -> bool:
        """Check if timer is currently running"""
        return self.status == TaskStatus.ACTIVE and self.current_work_start is not None

    @property
    def current_session_elapsed_minutes(self) -> int:
        """Get elapsed minutes (time that has passed) in current session (0 if not active)"""
        if not self.is_timer_active:
            return 0

        now = datetime.now(timezone.utc)
        start_time = ensure_timezone_aware(self.current_work_start)
        elapsed_seconds = (now - start_time).total_seconds()
        return int(elapsed_seconds / 60)

    @property
    def current_session_remaining_minutes(self) -> int:
        """Get remaining minutes in current session (0 if not active or expired)"""
        if not self.is_timer_active or not self.current_planned_end:
            return 0

        now = datetime.now(timezone.utc)
        end_time = ensure_timezone_aware(self.current_planned_end)
        remaining_seconds = (end_time - now).total_seconds()
        return max(0, int(remaining_seconds / 60))

    @property
    def is_timer_expired(self) -> bool:
        """Check if current timer has expired"""
        if not self.is_timer_active or not self.current_planned_end:
            return False

        now = datetime.now(timezone.utc)
        end_time = ensure_timezone_aware(self.current_planned_end)
        return now >= end_time

    @property
    def efficiency_ratio(self) -> float:
        """Calculate efficiency ratio (planned vs actual time worked)"""
        if self.total_time_worked == 0:
            return 0.0
        return self.planned_duration / self.total_time_worked

    def __repr__(self):
        return f"<Task(id={self.id}, name='{self.name}', status='{self.status.value}', priority='{self.priority.value}')>"
