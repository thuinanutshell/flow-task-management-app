# Import the database instance first
from .base import db, TaskStatus, TaskPriority

# Import all models
from .user import Users, Authentications
from .project import Projects
from .task import Categories, Lists, Tasks
from .analytics import (
    BaseAnalytics,
    CategoryAnalytics,
    ProjectAnalytics,
    DailyAnalytics,
)
from .experiment import (
    ExperimentTypes,
    UserExperiments,
    ExperimentTasks,
    ExperimentResults,
)

# Export all models for easy importing
__all__ = [
    # Database and enums
    "db",
    "TaskStatus",
    "TaskPriority",
    # User models
    "Users",
    "Authentications",
    # Project models
    "Projects",
    # Task models
    "Categories",
    "Lists",
    "Tasks",
    # Analytics models
    "BaseAnalytics",
    "CategoryAnalytics",
    "ProjectAnalytics",
    "DailyAnalytics",
    # Experiment models
    "ExperimentTypes",
    "UserExperiments",
    "ExperimentTasks",
    "ExperimentResults",
]
