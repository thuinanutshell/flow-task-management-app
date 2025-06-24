import google.generativeai as genai
import os
import json
from datetime import datetime, timedelta


class AIService:
    def __init__(self, db):
        self.db = db
        self.client = None
        self._initialize_gemini()

    def _initialize_gemini(self):
        """Initialize Google Gemini client"""
        try:
            api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
            if not api_key:
                raise ValueError(
                    "GOOGLE_GEMINI_API_KEY not found in environment variables"
                )

            genai.configure(api_key=api_key)
            self.client = genai.GenerativeModel("gemini-pro")

        except Exception as e:
            current_app.logger.error(f"Failed to initialize Gemini: {str(e)}")
            self.client = None


def prepare_user_data_context(self, user_id, days_back=30):
    """Prepare user analytics data for AI context"""
    try:
        # Get user info
        user = Users.query.get(user_id)
        if not user:
            return None

        # Calculate date range (last 30 days by default)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days_back)

        # Get daily completion rates
        daily_rates = []
        current_date = start_date
        while current_date <= end_date:
            rate = calculate_daily_completion_rate(user_id, current_date)
            if rate > 0:  # Only include days with activity
                daily_rates.append(
                    {"date": current_date.strftime("%Y-%m-%d"), "completion_rate": rate}
                )
            current_date += timedelta(days=1)

        # Get category analytics
        categories = Categories.query.filter_by(user_id=user_id).all()
        category_analytics = []
        for category in categories:
            completion_rate = get_category_completion_rate(user_id, category.id)
            estimation_accuracy = calculate_category_estimation_accuracy(
                user_id, category.id
            )
            mental_state_dist = get_category_mental_state_distribution(
                user_id, category.id
            )

            category_analytics.append(
                {
                    "name": category.name,
                    "completion_rate": completion_rate,
                    "estimation_accuracy": estimation_accuracy,
                    "mental_state_distribution": mental_state_dist,
                }
            )

        # Get recent task completion patterns
        recent_tasks = (
            Tasks.query.join(Lists)
            .join(Projects)
            .filter(Projects.user_id == user_id)
            .filter(Tasks.status == TaskStatus.DONE)
            .filter(Tasks.completed_at >= datetime.combine(start_date, time.min))
            .order_by(Tasks.completed_at.desc())
            .limit(50)
            .all()
        )

        task_patterns = []
        for task in recent_tasks:
            task_patterns.append(
                {
                    "category": task.category.name if task.category else "No Category",
                    "planned_duration": task.planned_duration,
                    "actual_duration": task.total_time_worked,
                    "mental_state": (
                        task.mental_state.value if task.mental_state else None
                    ),
                    "completed_date": task.completed_at.strftime("%Y-%m-%d"),
                }
            )

        return {
            "user_info": {
                "first_name": user.first_name,
                "total_categories": len(categories),
                "analysis_period": f"{start_date} to {end_date}",
            },
            "daily_completion_rates": daily_rates,
            "category_analytics": category_analytics,
            "recent_task_patterns": task_patterns[:20],  # Limit for context size
        }

    except Exception as e:
        current_app.logger.error(f"Error preparing user data context: {str(e)}")
        return None


def process_natural_language_query(self, user_id, query):
    """Process user's natural language query about their productivity data"""
    try:
        if not self.client:
            return {"error": "AI service not available"}

        # Get user data context
        user_context = self.prepare_user_data_context(user_id)
        if not user_context:
            return {"error": "Could not retrieve user data"}

        # Create prompt for Gemini
        prompt = self._create_analytics_prompt(query, user_context)

        # Generate response
        response = self.client.generate_content(prompt)

        # Parse and format response
        ai_response = self._format_ai_response(response.text, query)

        # Log the query for monitoring
        self._log_ai_query(user_id, query, ai_response)

        return ai_response

    except Exception as e:
        current_app.logger.error(f"Error processing AI query: {str(e)}")
        return {"error": "Failed to process query"}


def _create_analytics_prompt(self, user_query, user_context):
    """Create a structured prompt for Gemini with user data"""

    context_summary = f"""
You are a productivity analytics assistant. Analyze the following user data and answer their question.

USER DATA SUMMARY:
- User: {user_context['user_info']['first_name']}
- Analysis Period: {user_context['user_info']['analysis_period']}
- Total Categories: {user_context['user_info']['total_categories']}

DAILY COMPLETION RATES (last 30 days):
{json.dumps(user_context['daily_completion_rates'], indent=2)}

CATEGORY PERFORMANCE:
{json.dumps(user_context['category_analytics'], indent=2)}

RECENT TASK PATTERNS:
{json.dumps(user_context['recent_task_patterns'], indent=2)}

USER QUESTION: {user_query}

Please provide a helpful, specific answer based on the data above. Include:
1. Direct answer to their question
2. Relevant insights from the data
3. Actionable recommendations if appropriate
4. Keep response concise but informative

Format your response in JSON with the following structure:
{{
    "answer": "Direct answer to the user's question",
    "insights": ["Key insight 1", "Key insight 2", "Key insight 3"],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "data_points": ["Specific metrics that support your answer"]
}}
"""
    return context_summary


def _format_ai_response(self, raw_response, original_query):
    """Format and structure AI response"""
    try:
        # Try to parse as JSON first
        try:
            parsed_response = json.loads(raw_response)
            return {
                "success": True,
                "query": original_query,
                "answer": parsed_response.get("answer", ""),
                "insights": parsed_response.get("insights", []),
                "recommendations": parsed_response.get("recommendations", []),
                "data_points": parsed_response.get("data_points", []),
                "generated_at": datetime.utcnow().isoformat(),
            }
        except json.JSONDecodeError:
            # If not JSON, return as plain text
            return {
                "success": True,
                "query": original_query,
                "answer": raw_response,
                "insights": [],
                "recommendations": [],
                "data_points": [],
                "generated_at": datetime.utcnow().isoformat(),
            }

    except Exception as e:
        current_app.logger.error(f"Error formatting AI response: {str(e)}")
        return {"success": False, "error": "Failed to format response"}


def generate_insights(self, user_id):
    """Generate automatic insights about user's productivity patterns"""
    try:
        if not self.client:
            return {"error": "AI service not available"}

        user_context = self.prepare_user_data_context(user_id)
        if not user_context:
            return {"error": "Could not retrieve user data"}

        insights_prompt = f"""
Based on this productivity data, generate 3-5 key insights about patterns, trends, and areas for improvement:

{json.dumps(user_context, indent=2)}

Provide insights in JSON format:
{{
    "insights": [
        {{
            "title": "Insight title",
            "description": "Detailed explanation",
            "category": "performance|patterns|recommendations",
            "importance": "high|medium|low"
        }}
    ]
}}
"""

        response = self.client.generate_content(insights_prompt)

        try:
            parsed_insights = json.loads(response.text)
            return {
                "success": True,
                "insights": parsed_insights.get("insights", []),
                "generated_at": datetime.utcnow().isoformat(),
            }
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to parse insights"}

    except Exception as e:
        current_app.logger.error(f"Error generating insights: {str(e)}")
        return {"error": "Failed to generate insights"}
