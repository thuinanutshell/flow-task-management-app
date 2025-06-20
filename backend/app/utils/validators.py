def auth_form_validation(auth_type, data):
    if auth_type == "registration":
        required = ["first_name", "last_name", "email", "username", "password"]
        if not all(field in data for field in required):
            return "Missing required fields"

    elif auth_type == "login":
        has_username_login = all(field in data for field in ["username", "password"])
        has_email_login = all(field in data for field in ["email", "password"])

        if not (has_username_login or has_email_login):
            return "Please provide either email+password or username+password"

    return None


def validate_hex_color(color: str) -> bool:
    """Validate hex color format (#RRGGBB)"""
    import re

    pattern = r"^#[0-9A-Fa-f]{6}$"
    return bool(re.match(pattern, color))
