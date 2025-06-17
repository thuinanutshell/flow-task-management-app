from sqlalchemy import (
    Integer,
    String,
    ForeignKey,
    DateTime,
    Text,
    Enum,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from datetime import datetime
from typing import List, TYPE_CHECKING

from .base import db, TaskStatus, TaskPriority, MentalState

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
    name: Mapped[str] = mapped_column(String, nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "name", name="_user_category_uc"),)
    color: Mapped[str] = mapped_column(String(7), nullable=False)

    # Many-to-one relationship with the Users table
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped["Users"] = relationship(back_populates="categories")

    # One-to-many relationship with the task tables
    tasks: Mapped[List["Tasks"]] = relationship(back_populates="category")
    categoryanalytics: Mapped[List["CategoryAnalytics"]] = relationship(
        back_populates="category"
    )


class Lists(db.Model):
    """Table to store list's information

    Attributes:
        id: unique identifier for each list
        name: list's name (the list name has to be unique within a project)
        project_id: the project id that refers to the list.
                    this field can be null because when user creates a list for a specific day,
                    they can specify whether the list belongs to a project
                    or they do not have to do that.
    """

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    __table_args__ = (UniqueConstraint("project_id", "name", name="_project_list_uc"),)

    # Many-to-one relationship with the Projects table
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=True
    )
    project: Mapped["Projects"] = relationship(back_populates="lists")

    # One-to-many relationship with the task tables
    tasks: Mapped[List["Tasks"]] = relationship(back_populates="list")


class Tasks(db.Model):
    """Table to store the main task's information

    Attributes:
        status (string): each task can have one status of the following list [done, not_started, in_progress]
        priority (string): each task can have a priority of the following list [high, medium, low]
        planned_duration (integer): measured in minutes (the duration that the user estimates that the task will be done)
        actual_duration (integer): measured in minutes (the duration that the task is actually get done by the user)
                                   the actual duration can be greater or less or equal to the planned duration
        mental_state (string): the mental state of the user after finishing the task. Users will need to log this information
                               when the task is done. The state can be tired, fun, frustrated, anxious, etc.
        reflection (string): the user will log their reflection when the task is marked as done.
        started_at (datetime): the timestamp at which the user starts doing the task
        completed_at (datetime): the timestamp at which the user completes the task
    """

    # Input fields
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), nullable=False)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority), nullable=False)
    planned_duration: Mapped[int] = mapped_column(Integer, nullable=False)

    # Automatically update when the user starts the task
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Updated after the user marks task as done
    actual_duration: Mapped[int] = mapped_column(Integer, nullable=True)

    # Input fields after the task is done
    mental_state: Mapped[MentalState] = mapped_column(Enum(MentalState), nullable=True)
    reflection: Mapped[str] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Many-to-one relationship with the Lists and Categories tables
    list_id: Mapped[int] = mapped_column(ForeignKey("lists.id", ondelete="CASCADE"))
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE")
    )
    list: Mapped["Lists"] = relationship(back_populates="tasks")
    category: Mapped["Categories"] = relationship(back_populates="tasks")
    experiment_tasks: Mapped[List["ExperimentTasks"]] = relationship()
