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
from datetime import datetime
from typing import List
import enum


class Base:
    """Define shared column definitions across tables"""

    # Shared datetime column definitions
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # Dynamic attribute unique to each table
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()


# Task enums that are shared across models
class TaskStatus(enum.Enum):
    DONE = "done"
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"


class TaskPriority(enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MentalState(enum.Enum):
    ENERGIZED = "energized"
    FOCUSED = "focused"
    TIRED = "tired"
    FRUSTRATED = "frustrated"
    SATISFIED = "satisfied"
    ANXIOUS = "anxious"
    MOTIVATED = "motivated"


class ExperimentStatus(enum.Enum):
    PENDING = "pending"  # Created but not started yet
    ACTIVE = "active"  # Currently running (between start_date and end_date)
    COMPLETED = "completed"  # Finished (past end_date)
    CANCELLED = "cancelled"


db = SQLAlchemy(model_class=Base)
