from sqlalchemy import (
    Integer,
    Float,
    String,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    Index,
    Enum,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from typing import List, TYPE_CHECKING

from .base import db, ProjectStatus, TaskStatus

# Use TYPE_CHECKING to avoid circular imports
if TYPE_CHECKING:
    from .task import Lists
    from .user import Users
    from .analytics import ProjectAnalytics


class Projects(db.Model):
    """Table to store user's projects

    Args:
        db: an instance of SQLAlchemy object

    Attributes:
        id (int): unique identifier for each project
        name (str): name of the project. The uniqueness is defined among the projects of a user. It is not defined globally
        description (str): description of the project
        status (str): done, in_progress, pending, not_started
    """

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="_user_project_uc"),
        CheckConstraint("length(trim(name)) > 0", name="project_name_not_empty"),
        Index("idx_projects_user_id", "user_id"),
        Index("idx_projects_status", "status"),
        Index("idx_projects_user_status", "user_id", "status"),
    )

    description: Mapped[str] = mapped_column(String(1000), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="Project status: not_started, in_progress, pending, done",
    )

    # Many-to-one relationship with the Users table
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped["Users"] = relationship(back_populates="projects")

    # One-to-many relationship with the Lists table
    lists: Mapped[List["Lists"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    projectanalytics: Mapped[List["ProjectAnalytics"]] = relationship(
        back_populates="project"
    )

    @property
    def list_count(self) -> int:
        """Get total number of lists in this project"""
        return len(self.lists)

    @property
    def total_tasks(self) -> int:
        """Get total number of tasks across all lists in this project"""
        return sum(len(list_item.tasks) for list_item in self.lists)

    @property
    def completed_tasks(self) -> int:
        """Get total number of completed tasks across all lists in this project"""
        return sum(
            len([task for task in list_item.tasks if task.status == TaskStatus.DONE])
            for list_item in self.lists
        )

    @property
    def progress(self) -> float:
        """Calculate overall project progress based on task completion"""
        total = self.total_tasks
        if total == 0:
            return 0.0
        completed = self.completed_tasks
        return completed / total


    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', status='{self.status}', user_id={self.user_id})>"
