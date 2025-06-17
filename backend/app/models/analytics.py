from sqlalchemy import (
    Integer,
    Float,
    String,
    ForeignKey,
    DateTime,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
    declared_attr,
)
from datetime import datetime
from typing import List, TYPE_CHECKING

from .base import db

# Use TYPE_CHECKING to avoid circular imports
if TYPE_CHECKING:
    from .user import Users
    from .project import Projects
    from .task import Categories


class BaseAnalytics:
    """Base class for all analytics models"""

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Analytics metrics
    tasks_completed: Mapped[int] = mapped_column(Integer, default=0)
    tasks_created: Mapped[int] = mapped_column(Integer, default=0)
    total_duration: Mapped[int] = mapped_column(Integer, default=0)  # in minutes
    productivity_score: Mapped[float] = mapped_column(Float, default=0.0)

    # Insights generated from AI
    insights: Mapped[str] = mapped_column(Text, nullable=True)

    # User relationship common to all analytics
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    @declared_attr
    def user(cls) -> Mapped["Users"]:
        return relationship("Users")

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()


class CategoryAnalytics(BaseAnalytics, db.Model):
    """Analytics specific to categories"""

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE")
    )

    @declared_attr
    def category(cls) -> Mapped["Categories"]:
        return relationship("Categories", back_populates="categoryanalytics")

    @declared_attr
    def user(cls) -> Mapped["Users"]:
        return relationship("Users", back_populates="categoryanalytics")


class ProjectAnalytics(BaseAnalytics, db.Model):
    """Analytics specific to projects"""

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE")
    )
    project: Mapped["Projects"] = relationship(back_populates="projectanalytics")

    # Override the user relationship to specify back_populates
    user: Mapped["Users"] = relationship(back_populates="projectanalytics")


class DailyAnalytics(db.Model):
    """Table to store the computed daily completion rate

    Attributes:
        completion_rate: the completion rate is calculated as the percentage of tasks
                         done in the day over the total of tasks added. Each task has
                         a weight associated with its priority. Each task has a value of 1.
                         The formula to compute the complete rate is:
                         sum(task_value * weight) / total tasks
    """

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[datetime] = mapped_column(DateTime)
    completion_rate: Mapped[float] = mapped_column(Float)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped["Users"] = relationship(back_populates="dailyanalytics")
