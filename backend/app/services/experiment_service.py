from app.models import (
    db,
    UserExperiments,
    ExperimentTypes,
    Categories,
    Tasks,
    ExperimentTasks,
    ExperimentStatus,
)
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import random


class ExperimentService:
    def __init__(self, db):
        self.db = db

    def create_time_estimation_experiment(
        self,
        user_id: int,
        category_id: int,
        experiment_name: str,
        duration_days: int = 14,
    ) -> UserExperiments:
        """Create a simple time estimation experiment"""

        # Get the time estimation experiment type
        experiment_type = ExperimentTypes.query.filter_by(
            intervention_category="time_estimation"
        ).first()

        if not experiment_type:
            # Create default time estimation experiment type if it doesn't exist
            experiment_type = ExperimentTypes(
                title="Time Estimation Improvement",
                description="Helps users improve time estimation by suggesting adjustments",
                intervention_category="time_estimation",
                parameters_schema={
                    "multiplier": {
                        "type": "float",
                        "default": 1.5,
                        "min": 1.1,
                        "max": 2.0,
                    },
                    "suggestion_text": {
                        "type": "string",
                        "default": "Based on similar tasks, consider adding extra time",
                    },
                },
            )
            self.db.session.add(experiment_type)
            self.db.session.flush()

        # Create user experiment
        experiment = UserExperiments(
            name=experiment_name,
            status=ExperimentStatus.ACTIVE,  # Use the enum value instead of string
            parameters={
                "multiplier": 1.5,  # Suggest 50% more time
                "suggestion_text": "Consider adding extra time based on similar tasks",
            },
            success_criteria="Reduce time estimation error by 20%",
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=duration_days),
            intervention_probability=0.5,  # 50% of tasks get the intervention
            target_category_id=category_id,
            user_id=user_id,
            experiment_type_id=experiment_type.id,
        )

        self.db.session.add(experiment)
        self.db.session.commit()
        return experiment

    def get_active_experiments(self, user_id: int) -> List[UserExperiments]:
        """Get all active experiments for a user"""
        return (
            UserExperiments.query.filter_by(user_id=user_id, status=ExperimentStatus.ACTIVE)
            .filter(
                UserExperiments.start_date <= datetime.utcnow(),
                UserExperiments.end_date >= datetime.utcnow(),
            )
            .all()
        )

    def should_apply_intervention(
        self, task_category_id: int, user_id: int
    ) -> Optional[Dict[str, Any]]:
        """Check if task should get experimental intervention"""

        # Find active experiment for this category
        experiment = (
            UserExperiments.query.filter_by(
                user_id=user_id, target_category_id=task_category_id, status=ExperimentStatus.ACTIVE
            )
            .filter(
                UserExperiments.start_date <= datetime.utcnow(),
                UserExperiments.end_date >= datetime.utcnow(),
            )
            .first()
        )

        if not experiment:
            return None

        # Random assignment based on intervention probability
        if random.random() < experiment.intervention_probability:
            return {
                "experiment_id": experiment.id,
                "intervention_type": experiment.experiment_type.intervention_category,
                "parameters": experiment.parameters,
                "should_apply": True,
            }

        return {
            "experiment_id": experiment.id,
            "intervention_type": experiment.experiment_type.intervention_category,
            "parameters": experiment.parameters,
            "should_apply": False,
        }

    def apply_time_estimation_intervention(
        self, original_estimate: int, parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply time estimation intervention"""
        multiplier = parameters.get("multiplier", 1.5)
        suggested_estimate = int(original_estimate * multiplier)

        return {
            "original_estimate": original_estimate,
            "suggested_estimate": suggested_estimate,
            "suggestion_text": parameters.get(
                "suggestion_text", "Consider adding extra time"
            ),
            "multiplier_used": multiplier,
        }

    def record_task_experiment_data(
        self, task_id: int, experiment_data: Dict[str, Any]
    ) -> ExperimentTasks:
        """Record experiment data for a task"""

        experiment_task = ExperimentTasks(
            task_id=task_id,
            experiment_id=experiment_data["experiment_id"],
            assigned_to_intervention=experiment_data["should_apply"],
            intervention_applied=experiment_data.get("intervention_applied", False),
            original_estimate=experiment_data.get("original_estimate"),
            suggested_estimate=experiment_data.get("suggested_estimate"),
            final_estimate=experiment_data.get("final_estimate"),
            notes=experiment_data.get("notes", ""),
        )

        self.db.session.add(experiment_task)
        self.db.session.commit()
        return experiment_task

    def get_experiment_results(self, experiment_id: int) -> Dict[str, Any]:
        """Get simple results for an experiment"""

        experiment = UserExperiments.query.get(experiment_id)
        if not experiment:
            return {"error": "Experiment not found"}

        # Get all tasks in this experiment
        experiment_tasks = ExperimentTasks.query.filter_by(
            experiment_id=experiment_id
        ).all()

        if not experiment_tasks:
            return {"message": "No tasks recorded yet"}

        # Simple analysis for time estimation experiments
        if experiment.experiment_type.intervention_category == "time_estimation":
            control_group = [
                et for et in experiment_tasks if not et.assigned_to_intervention
            ]
            intervention_group = [
                et for et in experiment_tasks if et.assigned_to_intervention
            ]

            def calculate_accuracy(group):
                if not group:
                    return 0

                accuracies = []
                for et in group:
                    if et.final_estimate and et.task.total_time_worked:
                        # Calculate estimation accuracy (closer to 1.0 is better)
                        accuracy = min(
                            et.final_estimate, et.task.total_time_worked
                        ) / max(et.final_estimate, et.task.total_time_worked)
                        accuracies.append(accuracy)

                return sum(accuracies) / len(accuracies) if accuracies else 0

            control_accuracy = calculate_accuracy(control_group)
            intervention_accuracy = calculate_accuracy(intervention_group)

            return {
                "experiment_name": experiment.name,
                "status": experiment.status,
                "total_tasks": len(experiment_tasks),
                "control_group_size": len(control_group),
                "intervention_group_size": len(intervention_group),
                "control_accuracy": round(control_accuracy * 100, 1),
                "intervention_accuracy": round(intervention_accuracy * 100, 1),
                "improvement": round(
                    (intervention_accuracy - control_accuracy) * 100, 1
                ),
                "success": intervention_accuracy > control_accuracy,
            }

        return {"message": "Analysis not implemented for this experiment type"}

    def delete_experiment(self, experiment_id: int, user_id: int) -> None:
        """Delete an experiment

        Args:
            experiment_id: ID of the experiment to delete
            user_id: ID of the user (for authorization)

        Raises:
            ValueError: If experiment doesn't exist or doesn't belong to user
        """
        experiment = UserExperiments.query.filter_by(id=experiment_id, user_id=user_id).first()

        if not experiment:
            raise ValueError("Experiment not found or access denied")

        # Delete all related experiment tasks
        ExperimentTasks.query.filter_by(experiment_id=experiment_id).delete()
        
        # Delete the experiment
        self.db.session.delete(experiment)
        self.db.session.commit()
