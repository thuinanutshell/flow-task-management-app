from flask import Flask
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


class TaskStatus(enum.Enum):
    DONE = "done"
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"


class TaskPriority(enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


db = SQLAlchemy(model_base=Base)


# ======================
# USER-RELATED TABLES
# ======================
class Users(db.Model):
    """Table to store user's basic personal information

    Args:
        db: an instance of the SQLAlchemy object

    Attributes:
        id (integer): user's unique primary key identifier
        first_name (string): user's first name
        last_name (string): user's last name
        username (string): user's unique username
        email (string): user's unique email
        is_active (boolean): user's status of whether they are allowed to access the data
                             unless user blocks or inactivate their account, the field default value is True
    """

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    username: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # One-to-many relationship with children tables
    authentications: Mapped[List["Authentications"]] = relationship(
        back_populates="user"
    )
    projects: Mapped[List["Projects"]] = relationship(back_populates="user")
    categories: Mapped[List["Categories"]] = relationship(back_populates="user")
    categoryanalytics: Mapped[List["CategoryAnalytics"]] = relationship(
        back_populates="user"
    )
    projectanalytics: Mapped[List["ProjectAnalytics"]] = relationship(
        back_populates="user"
    )
    userexperiments: Mapped[List["UserExperiments"]] = relationship(
        back_populates="user"
    )
    dailyanalytics: Mapped[List["DailyAnalytics"]] = relationship(back_populates="user")


class Authentications(db.Model):
    """Table to store different types of authentication for each user

    Args:
        db: an instance of the SQLAlchemy object

    Attributes:
        id (integer): the authentication's unique ID
        auth_type (string): traditional (using username/email and password) or OAuth (using Google Account)
        external_id (string): the ID provided by OAuth
        password_hash (string): password can be null if user uses OAuth as authentication method
    """

    id: Mapped[int] = mapped_column(primary_key=True)
    auth_type: Mapped[str] = mapped_column(String, nullable=False)
    external_id: Mapped[str] = mapped_column(String, nullable=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=True)

    # Many-to-one relationship with the User table (many authentications belong to a user)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped["Users"] = relationship(back_populates="authentications")


# ======================
# PROJECT-RELATED TABLES
# ======================
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


# ======================
# LIST-RELATED TABLES
# ======================
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


# ======================
# TASKS-RELATED TABLES
# ======================
class Categories(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False)

    # Many-to-one relationship with the Users table
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped["Users"] = relationship(back_populates="categories")

    # One-to-many relationship with the task tables
    tasks: Mapped[List["Tasks"]] = relationship(back_populates="category")
    categoryanalytics: Mapped[List["CategoryAnalytics"]] = relationship(
        back_populates="category"
    )


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

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)

    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), nullable=False)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority), nullable=False)
    planned_duration: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_duration: Mapped[int] = mapped_column(Integer, nullable=True)

    mental_state: Mapped[str] = mapped_column(String, nullable=True)
    reflection: Mapped[str] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Many-to-one relationship with the Lists and Categories tables
    list_id: Mapped[int] = mapped_column(ForeignKey("lists.id", ondelete="CASCADE"))
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE")
    )
    list: Mapped["Lists"] = relationship(back_populates="tasks")
    category: Mapped["Categories"] = relationship(back_populates="tasks")


# ========================
# ANALYTICS-RELATED TABLES
# ========================
class BaseAnalytics:
    """Base class for analytics tables with common fields.
    The insights field include the summary and insights generated by an LLM, which include:
        - The overall sentiment across the reflections written by the user
        - The overall mental state for a specific type of task
        - Type of tasks that consistently got overestimated or underestimated in terms of duration
        - Some other suggestions from the LLM about the experiments the user can conduct to be more
        productive and in a better mental state
    """

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    total_tasks: Mapped[int] = mapped_column(Integer, nullable=False)
    completed_tasks: Mapped[int] = mapped_column(Integer, nullable=False)
    total_planned_time: Mapped[int] = mapped_column(Integer, nullable=True)
    total_actual_time: Mapped[int] = mapped_column(Integer, nullable=True)
    overestimation_rate: Mapped[float] = mapped_column(Float, nullable=True)
    average_estimate_accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Insights generated from AI
    insights: Mapped[str] = mapped_column(Text, nullable=True)

    # User relationship common to all analytics
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user: Mapped["Users"] = relationship()

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()


class CategoryAnalytics(BaseAnalytics, db.Model):
    """Analytics specific to categories"""

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE")
    )
    category: Mapped["Categories"] = relationship(back_populates="categoryanalytics")

    # Override the user relationship to specify back_populates
    user: Mapped["Users"] = relationship(back_populates="categoryanalytics")


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


# =========================
# EXPERIMENT-RELATED TABLES
# =========================
class ExperimentTypes(db.Model):
    """
    Attributes:
        intervention_category: the system defines the category as time_estimation, productivity_technique, scheduling, and mental_state
        parameters: the schema of the parameter depends on the intervention category. It defines the form structure
            time_estimation (JSON): properties: {**multiplier**, min, max},
                                                {**target_categories**: {type, items}},
                                                apply_schedule: when should the intervention be active
            productivity_technique (JSON): work_duration: {},
                                           break_duration: {},
                                           target_categories: {}
            scheduling (JSON): when_to_work (morning, afternoon, evening)
                               which_type_of_tasks to work first (in order of priority)
            mental_state (JSON): meditate or write down worries before getting to work

        Each experiment type is tied with a goal:
            1) time_estimation aims to improve users ability to better estimate the time needed to complete a task
            2) productivity_technique aims to improve focus and reduce exhaustion
            3) scheduling aims to identify when in the day is best for which type of task
            4) mental_state is techniques aim to improve the mental state of doing a task
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
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    parameters: Mapped[dict] = mapped_column(JSON, nullable=True)
    success_criteria: Mapped[str] = mapped_column(String)
    start_date: Mapped[datetime] = mapped_column(DateTime)
    end_date: Mapped[datetime] = mapped_column(DateTime)

    results: Mapped[List["ExperimentResults"]] = relationship(
        back_populates="experiment"
    )

    # Many-to-one-relationship with the Users & ExperimentTypes tables
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
    intervention_applied: Mapped[bool] = mapped_column(Boolean)
    notes: Mapped[str] = mapped_column(String)

    # Link the task to the Task model
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"))

    # Many-to-one relationship with the UserExperiments table (many tasks can belong to one experiment)
    experiment_id: Mapped[int] = mapped_column(
        ForeignKey("userexperiments.id", ondelete="CASCADE")
    )


class ExperimentResults(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    metric_name: Mapped[str] = mapped_column(String)
    metric_value: Mapped[str] = mapped_column(String)
    improvement_percentage: Mapped[float] = mapped_column(Float)
    measurement_date: Mapped[datetime] = mapped_column(DateTime)
    sample_size: Mapped[int] = mapped_column(Integer)
    p_value: Mapped[float] = mapped_column(Float)

    # Many-to-one relationship with the UserExperiments table (many results can belong to one experiment?)
    experiment_id: Mapped[int] = mapped_column(
        ForeignKey("userexperiments.id", ondelete="CASCADE")
    )
    experiment: Mapped["UserExperiments"] = relationship(back_populates="results")
