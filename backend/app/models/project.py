from sqlalchemy import (
    Integer,
    Float,
    String,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from typing import List, TYPE_CHECKING

from .base import db

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
        id: unique identifier for each project
        name: name of the project. The uniqueness is defined among the projects of a user. It is not defined globally
        description: description of the project
    """

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "name", name="_user_project_uc"),)
    description: Mapped[str] = mapped_column(String, nullable=True)
    progress: Mapped[float] = mapped_column(Float, nullable=False)

    # Many-to-one relationship with the Users table
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped["Users"] = relationship(back_populates="projects")

    # One-to-many relationship  with the Lists table
    lists: Mapped[List["Lists"]] = relationship(back_populates="project")
    projectanalytics: Mapped[List["ProjectAnalytics"]] = relationship(
        back_populates="project"
    )
