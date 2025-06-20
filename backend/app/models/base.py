from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import (
    Integer,
    Float,
    String,
    ForeignKey,
    Boolean,
    DateTime,
    Text,
    Enum,
    UniqueConstraint,
    func,
    JSON,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    declared_attr,
)
from datetime import datetime, timezone
from typing import List
import enum
from app.utils import get_utc_now


class Base:
    """Define shared column definitions across tables with timezone awareness"""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.current_timestamp(),
        default=get_utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.current_timestamp(),
        server_onupdate=func.current_timestamp(),
        default=get_utc_now,
        onupdate=get_utc_now,
    )

    # Dynamic attribute (lowercase table name) unique to each table
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()


# Task enums that are shared across models
class TaskStatus(enum.Enum):
    NOT_STARTED = "not_started"
    ACTIVE = "active"
    PAUSED = "paused"
    DONE = "done"

    def __str__(self):
        return self.value


class TaskPriority(enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

    def __str__(self):
        return self.value


class MentalState(enum.Enum):
    ENERGIZED = "energized"
    FOCUSED = "focused"
    TIRED = "tired"
    FRUSTRATED = "frustrated"
    SATISFIED = "satisfied"
    ANXIOUS = "anxious"
    MOTIVATED = "motivated"

    def __str__(self):
        return self.value

    @classmethod
    def get_all_values(cls):
        """Helper method to get all valid mental state values"""
        return [state.value for state in cls]


class ExperimentStatus(enum.Enum):
    """Experiment status for A/B testing or feature experiments"""

    PENDING = "pending"  # Created but not started yet
    ACTIVE = "active"  # Currently running (between start_date and end_date)
    COMPLETED = "completed"  # Finished (past end_date)
    CANCELLED = "cancelled"

    def __str__(self):
        return self.value


class ProjectStatus(enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PENDING = "pending"
    DONE = "done"

    def __str__(self):
        return self.value

    @classmethod
    def get_all_values(cls):
        """Helper method to get all valid project status values"""
        return [status.value for status in cls]


db = SQLAlchemy(model_class=Base)
