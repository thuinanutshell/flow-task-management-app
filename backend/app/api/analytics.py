from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date, time, timedelta, datetime
from sqlalchemy import or_, and_
from app.services.analytics_service import AnalyticsService
from app.models import Categories, Tasks, TaskStatus
from app.utils.helpers import create_response

analytics_bp = Blueprint("analytics", __name__)

# Import additional functions from analytics_service
from app.services.analytics_service import (
    calculate_daily_completion_rate,
    get_category_completion_rate,
    calculate_category_estimation_accuracy,
    get_category_mental_state_distribution
)


@analytics_bp.route("/daily/month/<year>/<month>", methods=["GET"])
@jwt_required()
def get_monthly_completion_rates(year, month):
    """Get completion rates for all days in a month"""
    try:
        user_id = get_jwt_identity()

        # Get first and last day of month
        first_day = date(int(year), int(month), 1)
        if int(month) == 12:
            last_day = date(int(year) + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(int(year), int(month) + 1, 1) - timedelta(days=1)

        # Calculate for each day
        daily_rates = {}
        current_date = first_day
        while current_date <= last_day:
            completion_rate = calculate_daily_completion_rate(user_id, current_date)
            if completion_rate > 0:  # Only include days with activity
                daily_rates[current_date.strftime("%Y-%m-%d")] = completion_rate
            current_date += timedelta(days=1)

        return create_response(data=daily_rates)
    except Exception as e:
        return create_response(False, "Failed to get monthly data", status=500)


# Get comprehensive analytics for a single category
@analytics_bp.route("/categories/<int:category_id>", methods=["GET"])
@jwt_required()
def get_category_analytics(category_id):
    """Get completion rate, estimation accuracy, and mental state distribution for a category"""
    try:
        user_id = get_jwt_identity()

        # Verify category exists and belongs to user
        category = Categories.query.filter_by(id=category_id, user_id=user_id).first()
        if not category:
            return create_response(False, "Category not found", status=404)

        # Parse optional date range
        date_range = None
        if request.args.get("start_date") and request.args.get("end_date"):
            date_range = {
                "start_date": datetime.strptime(
                    request.args.get("start_date"), "%Y-%m-%d"
                ).date(),
                "end_date": datetime.strptime(
                    request.args.get("end_date"), "%Y-%m-%d"
                ).date(),
            }

        # Get all three analytics
        completion_rate = get_category_completion_rate(user_id, category_id, date_range)
        estimation_accuracy = calculate_category_estimation_accuracy(
            user_id, category_id, date_range
        )
        mental_state_distribution = get_category_mental_state_distribution(
            user_id, category_id, date_range
        )

        return create_response(
            message="Category analytics retrieved successfully",
            data={
                "category": {
                    "id": category.id,
                    "name": category.name,
                    "color": category.color,
                },
                "date_range": date_range,
                "completion_rate": completion_rate,
                "completion_percentage": round(completion_rate * 100, 1),
                "estimation_accuracy": estimation_accuracy,
                "mental_state_distribution": mental_state_distribution,
                "generated_at": datetime.utcnow().isoformat(),
            },
        )

    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Error getting category analytics: {str(e)}")
        return create_response(False, "Failed to get category analytics", status=500)


# Natural language query endpoint
@analytics_bp.route("/ai/query", methods=["POST"])
@jwt_required()
def ai_query():
    """Process natural language queries about user's productivity data"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or "query" not in data:
            return create_response(False, "Query is required", status=400)

        query = data["query"].strip()
        if not query:
            return create_response(False, "Query cannot be empty", status=400)

        # Basic validation/safety check
        if len(query) > 500:
            return create_response(
                False, "Query too long (max 500 characters)", status=400
            )

        ai_service = AIService(db)
        response = ai_service.process_natural_language_query(user_id, query)

        if "error" in response:
            return create_response(False, response["error"], status=500)

        return create_response(message="Query processed successfully", data=response)

    except Exception as e:
        current_app.logger.error(f"Error in AI query endpoint: {str(e)}")
        return create_response(False, "Failed to process query", status=500)


# Auto-generated insights endpoint
@analytics_bp.route("/ai/insights", methods=["GET"])
@jwt_required()
def ai_insights():
    """Get auto-generated insights about user's productivity patterns"""
    try:
        user_id = get_jwt_identity()

        ai_service = AIService(db)
        insights = ai_service.generate_insights(user_id)

        if "error" in insights:
            return create_response(False, insights["error"], status=500)

        return create_response(message="Insights generated successfully", data=insights)

    except Exception as e:
        current_app.logger.error(f"Error generating insights: {str(e)}")
        return create_response(False, "Failed to generate insights", status=500)


# Get analytics for all categories
@analytics_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_all_categories_analytics():
    """Get basic analytics for all categories"""
    try:
        user_id = get_jwt_identity()
        
        # Parse optional date range
        date_range = None
        if request.args.get("start_date") and request.args.get("end_date"):
            date_range = {
                "start_date": datetime.strptime(
                    request.args.get("start_date"), "%Y-%m-%d"
                ).date(),
                "end_date": datetime.strptime(
                    request.args.get("end_date"), "%Y-%m-%d"
                ).date(),
            }
        
        # Get all categories for the user
        categories = Categories.query.filter_by(user_id=user_id).all()
        
        # Calculate analytics for each category
        categories_data = []
        for category in categories:
            # Get completion rate for this category
            completion_rate = get_category_completion_rate(user_id, category.id, date_range)
            
            # Count total tasks in this category
            total_tasks = Tasks.query.filter_by(category_id=category.id).count()
            
            categories_data.append({
                "id": category.id,
                "name": category.name,
                "color": category.color,
                "completion_rate": completion_rate,
                "total_tasks": total_tasks
            })
        
        return create_response(
            message="All categories analytics retrieved successfully",
            data={"categories": categories_data}
        )
        
    except ValueError as e:
        return create_response(False, str(e), status=400)
    except Exception as e:
        current_app.logger.error(f"Error getting all categories analytics: {str(e)}")
        return create_response(False, "Failed to get categories analytics", status=500)
