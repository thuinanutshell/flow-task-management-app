from sqlalchemy import (
    Integer,
    String,
    ForeignKey,
    Boolean,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from typing import List, TYPE_CHECKING
import uuid

from .base import db

if TYPE_CHECKING:
    from .project import Projects
    from .task import Categories
    from .analytics import ProjectAnalytics, CategoryAnalytics, DailyAnalytics
    from .experiment import UserExperiments


class Users(db.Model):
    """Table to store user's basic personal information"""

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    username: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships - using the exact names that analytics expects
    authentications: Mapped[List["Authentications"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    projects: Mapped[List["Projects"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    categories: Mapped[List["Categories"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    # Analytics relationships - match the back_populates in analytics.py
    categoryanalytics: Mapped[List["CategoryAnalytics"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    projectanalytics: Mapped[List["ProjectAnalytics"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    dailyanalytics: Mapped[List["DailyAnalytics"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    userexperiments: Mapped[List["UserExperiments"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Authentications(db.Model):
    """Table to store different types of authentication for each user"""

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    auth_type: Mapped[str] = mapped_column(String(20), nullable=False)
    external_id: Mapped[str] = mapped_column(String(100), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=True)

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE")
    )
    user: Mapped["Users"] = relationship(back_populates="authentications")
