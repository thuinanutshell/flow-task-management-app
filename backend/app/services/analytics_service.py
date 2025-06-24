from app.models import db, Tasks, Projects, Categories, Lists, TaskStatus
from datetime import datetime, timedelta, timezone, time
from typing import Dict, Any, Optional
from app.utils import get_utc_now, ensure_timezone_aware
from sqlalchemy import or_, and_
from flask import current_app


class AnalyticsService:
    def __init__(self, db):
        self.db = db


def calculate_daily_completion_rate(user_id, date):
    """
    Calculate the completion rate for a specific day
    Args:
        user_id: User ID
        date: Date to calculate completion rate for
    Returns: float between 0.0 and 1.0
    """
    start_of_day = datetime.combine(date, time.min).replace(tzinfo=timezone.utc)
    end_of_day = datetime.combine(date, time.max).replace(tzinfo=timezone.utc)

    completed_tasks = (
        Tasks.query.join(Lists)
        .join(Projects)
        .filter(Projects.user_id == user_id)
        .filter(Tasks.status == TaskStatus.DONE)
        .filter(Tasks.completed_at >= start_of_day)
        .filter(Tasks.completed_at <= end_of_day)
        .count()
    )

    # Get all tasks that were "active" on this date (created or worked on)
    total_daily_tasks = (
        Tasks.query.join(Lists)
        .join(Projects)
        .filter(Projects.user_id == user_id)
        .filter(
            or_(
                # Tasks created on this day
                and_(
                    Tasks.created_at >= start_of_day, Tasks.created_at <= end_of_day
                ),
                # Tasks completed on this day
                and_(
                    Tasks.completed_at >= start_of_day,
                    Tasks.completed_at <= end_of_day,
                ),
                # Tasks started on this day
                and_(
                    Tasks.first_started_at >= start_of_day,
                    Tasks.first_started_at <= end_of_day,
                )
            )
        )
        .count()
    )

    if total_daily_tasks == 0:
        return 0.0

    return round(completed_tasks / total_daily_tasks, 2)


def get_category_completion_rate(user_id, category_id, date_range=None):
    """
    Calculate completion rate for a specific category
    Args:
        user_id: User ID
        category_id: Category ID
        date_range: Optional dict with 'start_date' and 'end_date'
    Returns: float between 0.0 and 1.0
    """
    try:
        # Base query for category tasks
        query = (
            Tasks.query.join(Lists)
            .join(Projects)
            .filter(Projects.user_id == user_id)
            .filter(Tasks.category_id == category_id)
        )

        # Apply date filter if provided
        if date_range:
            start_date = datetime.combine(
                date_range["start_date"], time.min
            ).replace(tzinfo=timezone.utc)
            end_date = datetime.combine(date_range["end_date"], time.max).replace(
                tzinfo=timezone.utc
            )
            query = query.filter(
                Tasks.created_at >= start_date, Tasks.created_at <= end_date
            )

        # Get total and completed tasks
        total_tasks = query.count()
        completed_tasks = query.filter(Tasks.status == TaskStatus.DONE).count()

        if total_tasks == 0:
            return 0.0

        return round(completed_tasks / total_tasks, 3)

    except Exception as e:
        current_app.logger.error(
            f"Error calculating category completion rate: {str(e)}"
        )
        return 0.0


def calculate_category_estimation_accuracy(user_id, category_id, date_range=None):
    """
    Calculate how accurate time estimations are for a category
    Returns: dict with accuracy metrics
    """
    try:
        # Get completed tasks with time data
        query = (
            Tasks.query.join(Lists)
            .join(Projects)
            .filter(Projects.user_id == user_id)
            .filter(Tasks.category_id == category_id)
            .filter(Tasks.status == TaskStatus.DONE)
            .filter(Tasks.total_time_worked > 0)
            .filter(Tasks.planned_duration > 0)
        )

        # Apply date filter if provided
        if date_range:
            start_date = datetime.combine(
                date_range["start_date"], time.min
            ).replace(tzinfo=timezone.utc)
            end_date = datetime.combine(date_range["end_date"], time.max).replace(
                tzinfo=timezone.utc
            )
            query = query.filter(
                Tasks.completed_at >= start_date, Tasks.completed_at <= end_date
            )

        tasks = query.all()

        if not tasks:
            return {
                "accuracy_percentage": 0.0,
                "average_estimation_ratio": 0.0,
                "total_tasks_analyzed": 0,
                "underestimated_count": 0,
                "overestimated_count": 0,
                "accurate_count": 0,
            }

        estimation_ratios = []
        underestimated = 0
        overestimated = 0
        accurate = 0

        for task in tasks:
            # Calculate ratio: planned / actual
            ratio = task.planned_duration / task.total_time_worked
            estimation_ratios.append(ratio)

            # Categorize estimation accuracy (within 20% is considered accurate)
            if ratio < 0.8:  # Significantly underestimated
                underestimated += 1
            elif ratio > 1.2:  # Significantly overestimated
                overestimated += 1
            else:  # Reasonably accurate
                accurate += 1

        # Simplified accuracy calculation: percentage of tasks that were accurately estimated
        accuracy_percentage = (accurate / len(tasks)) * 100
        
        # Still calculate average ratio for reference
        avg_ratio = sum(estimation_ratios) / len(estimation_ratios)

        return {
            "accuracy_percentage": round(accuracy_percentage, 1),
            "average_estimation_ratio": round(avg_ratio, 2),
            "total_tasks_analyzed": len(tasks),
            "underestimated_count": underestimated,
            "overestimated_count": overestimated,
            "accurate_count": accurate,
            "underestimated_percentage": round(
                (underestimated / len(tasks)) * 100, 1
            ),
            "overestimated_percentage": round(
                (overestimated / len(tasks)) * 100, 1
            ),
            "accurate_percentage": round((accurate / len(tasks)) * 100, 1),
        }

    except Exception as e:
        current_app.logger.error(f"Error calculating estimation accuracy: {str(e)}")
        return {"error": str(e)}


def get_category_mental_state_distribution(user_id, category_id, date_range=None):
    """
    Get distribution of mental states for completed tasks in a category
    Returns: dict with mental state counts and percentages
    """
    try:
        # Get completed tasks with mental state data
        query = (
            Tasks.query.join(Lists)
            .join(Projects)
            .filter(Projects.user_id == user_id)
            .filter(Tasks.category_id == category_id)
            .filter(Tasks.status == TaskStatus.DONE)
            .filter(Tasks.mental_state.isnot(None))
        )

        # Apply date filter if provided
        if date_range:
            start_date = datetime.combine(
                date_range["start_date"], time.min
            ).replace(tzinfo=timezone.utc)
            end_date = datetime.combine(date_range["end_date"], time.max).replace(
                tzinfo=timezone.utc
            )
            query = query.filter(
                Tasks.completed_at >= start_date, Tasks.completed_at <= end_date
            )

        tasks = query.all()

        if not tasks:
            return {
                "total_tasks": 0,
                "mental_states": {},
                "most_common_state": None,
                "positive_states_percentage": 0.0,
            }

        # Count mental states
        mental_state_counts = {}
        for task in tasks:
            state = task.mental_state.value
            mental_state_counts[state] = mental_state_counts.get(state, 0) + 1

        # Calculate percentages
        total_tasks = len(tasks)
        mental_state_percentages = {
            state: round((count / total_tasks) * 100, 1)
            for state, count in mental_state_counts.items()
        }

        # Identify most common state
        most_common_state = max(mental_state_counts.items(), key=lambda x: x[1])[0]

        # Calculate positive states percentage (energized, focused, satisfied, motivated)
        positive_states = ["energized", "focused", "satisfied", "motivated"]
        positive_count = sum(
            mental_state_counts.get(state, 0) for state in positive_states
        )
        positive_percentage = round((positive_count / total_tasks) * 100, 1)

        return {
            "total_tasks": total_tasks,
            "mental_states": {
                "counts": mental_state_counts,
                "percentages": mental_state_percentages,
            },
            "most_common_state": most_common_state,
            "positive_states_percentage": positive_percentage,
        }

    except Exception as e:
        current_app.logger.error(
            f"Error getting mental state distribution: {str(e)}"
        )
        return {"error": str(e)}


