from sqlalchemy import (
    Integer,
    String,
    ForeignKey,
    Boolean,
    DateTime,
    Text,
    Float,
    JSON,
    Enum,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from datetime import datetime
from typing import List, TYPE_CHECKING

from .base import db, ExperimentStatus

# Use TYPE_CHECKING to avoid circular imports
if TYPE_CHECKING:
    from .user import Users
    from .task import Tasks


class ExperimentTypes(db.Model):
    """
    Attributes:
        intervention_category: the system defines the category as time_estimation, productivity_technique, scheduling, and mental_state
        parameters: the schema of the parameter depends on the intervention category. It defines the form structure
            time_estimation (JSON)
            productivity_technique (JSON)
            scheduling (JSON)
            mental_state (JSON)

        Each experiment type is tied with a goal:
            1) time_estimation aims to improve users ability to better estimate the time needed to complete a task
            2) productivity_technique aims to improve focus and reduce exhaustion
            3) scheduling aims to identify when in the day is best for which type of task
            4) mental_state are techniques aim to improve the mental state of doing a task
    """

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)

    intervention_category: Mapped[str] = mapped_column(String)
    parameters_schema: Mapped[dict] = mapped_column(JSON, nullable=True)
    userexperiments: Mapped[List["UserExperiments"]] = relationship(
        back_populates="experiment_type"
    )


class UserExperiments(db.Model):
    """Table to store user's experiments

    Attributes:
        - id: experiment's unique ID
        - name: experiment's name (e.g., extend coding tasks during by 1.5x)
        - parameters: input by users the parameter needed for the experiment
        - success_criteria: the criteria that counts as success (improvement rate)
    """

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    status: Mapped[ExperimentStatus] = mapped_column(
        Enum(ExperimentStatus), nullable=False
    )

    parameters: Mapped[dict] = mapped_column(JSON, nullable=True)
    success_criteria: Mapped[str] = mapped_column(String)

    # Experiment period
    start_date: Mapped[datetime] = mapped_column(DateTime)
    end_date: Mapped[datetime] = mapped_column(DateTime)

    # A/B testing configuration
    intervention_probability: Mapped[float] = mapped_column(
        Float, default=0.5
    )  # 50% get intervention

    # Target category for the experiment
    target_category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), nullable=False
    )
    target_category: Mapped["Categories"] = relationship()

    # Relationships
    results: Mapped[List["ExperimentResults"]] = relationship(
        back_populates="experiment"
    )
    experiment_tasks: Mapped[List["ExperimentTasks"]] = relationship(
        back_populates="experiment"
    )

    # Foreign keys
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    experiment_type_id: Mapped[int] = mapped_column(
        ForeignKey("experimenttypes.id", ondelete="CASCADE")
    )

    user: Mapped["Users"] = relationship(back_populates="userexperiments")
    experiment_type: Mapped["ExperimentTypes"] = relationship(
        back_populates="userexperiments"
    )


class ExperimentTasks(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    # Common fields
    assigned_to_intervention: Mapped[bool] = mapped_column(Boolean)
    intervention_applied: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(String, nullable=True)

    # Time Estimation fields
    original_estimate: Mapped[int] = mapped_column(Integer, nullable=True)
    suggested_estimate: Mapped[int] = mapped_column(Integer, nullable=True)
    final_estimate: Mapped[int] = mapped_column(Integer, nullable=True)

    # Scheduling fields
    scheduled_for_preferred_time: Mapped[bool] = mapped_column(Boolean, nullable=True)
    actual_start_hour: Mapped[int] = mapped_column(Integer, nullable=True)

    # Mental State fields
    completed_pre_task_ritual: Mapped[bool] = mapped_column(Boolean, nullable=True)
    mood_before: Mapped[str] = mapped_column(String, nullable=True)
    mood_after: Mapped[str] = mapped_column(String, nullable=True)

    # Relationships
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"))
    experiment_id: Mapped[int] = mapped_column(
        ForeignKey("userexperiments.id", ondelete="CASCADE")
    )

    # Fix the relationship by adding back_populates and overlaps
    task: Mapped["Tasks"] = relationship(back_populates="experiment_tasks", overlaps="experiment_tasks")
    experiment: Mapped["UserExperiments"] = relationship(back_populates="experiment_tasks")


class ExperimentResults(db.Model):
    """Table to store experiment's results

    Attributes:
        - id: experiment result's unique id
        - metric_name: the name of the metric
        - metric_value: numeric value of the metric
        - measurement_date: the date at which the user analyzes all the data from the experiments
    """

    id: Mapped[int] = mapped_column(primary_key=True)
    metric_name: Mapped[str] = mapped_column(String)
    metric_value: Mapped[str] = mapped_column(String)
    improvement_percentage: Mapped[float] = mapped_column(Float)
    measurement_date: Mapped[datetime] = mapped_column(DateTime)
    sample_size: Mapped[int] = mapped_column(Integer)
    p_value: Mapped[float] = mapped_column(Float)

    # Add task_id foreign key
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), nullable=True)

    # Many-to-one relationship with the UserExperiments table
    experiment_id: Mapped[int] = mapped_column(
        ForeignKey("userexperiments.id", ondelete="CASCADE")
    )
    experiment: Mapped["UserExperiments"] = relationship(back_populates="results")
    task: Mapped["Tasks"] = relationship()
