from flask import jsonify
from datetime import datetime, timezone


def get_utc_now():
    """Get current UTC datetime with timezone information"""
    return datetime.now(timezone.utc)


def ensure_timezone_aware(dt):
    """Ensure a datetime is timezone-aware (UTC)"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def create_response(success=True, message=None, data=None, status=200):
    """Create a standardized response format"""
    response = {"success": success, "message": message}

    if data is not None:
        response["data"] = data

    return jsonify(response), status
