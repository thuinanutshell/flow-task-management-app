from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_
from app.models import Users, Authentications, db
from datetime import datetime


class AuthService:
    def __init__(self, db):
        self.db = db

    def register_user(self, email, username, password, first_name="", last_name=""):
        """Logic to register a new traditional user
        1. Check if the user exists, raise an error if they do not exist
        2. Create a new user to the Users model with their basic information
        3. Add the user to the database and use flush to get their ID
        4. Create a traditional authentication record associated with that user
        5. Add and commit

        Args:
            email (str) - required
            username (str) - required
            password (str) - required
            first_name (str) - required
            last_name (str) - required

        Return:
            user: A Users object
        """
        # Check if user exists
        if Users.query.filter(
            or_(Users.email == email, Users.username == username)
        ).first():
            raise ValueError("User already exists")

        # Create user
        user = Users(
            email=email,
            username=username,
            first_name=first_name or email.split("@")[0].title(),
            last_name=last_name or "User",
        )
        self.db.session.add(user)
        self.db.session.flush()  # Get user ID

        # Create authentication record
        auth = Authentications(
            user_id=user.id,
            auth_type="traditional",
            password_hash=generate_password_hash(password),
        )
        self.db.session.add(auth)
        self.db.session.commit()
        return user

    def login_user(self, login, password):
        """Login a traditional user"""
        # Find user by email or username
        user = Users.query.filter(
            or_(Users.email == login, Users.username == login)
        ).first()

        if not user:
            raise ValueError("User does not exist")

        # Find traditional auth record
        auth = Authentications.query.filter_by(
            user_id=user.id, auth_type="traditional"
        ).first()

        if not auth or not check_password_hash(auth.password_hash, password):
            raise ValueError("Invalid credentials")

        return user

    def oauth_login(self, email, external_id, username=None):
        """Login or register OAuth user

        Args:
            email (str): User's email from OAuth provider
            external_id (str): External ID from OAuth provider
            username (str, optional): Username from OAuth provider. Defaults to None.

        Returns:
            Users: User object
        """
        # Try to find existing OAuth user
        auth = Authentications.query.filter_by(
            external_id=external_id, auth_type="oauth"
        ).first()

        if auth:
            return auth.user

        # Create new OAuth user
        if not username:
            username = email.split("@")[0] + "_oauth"

        # Make sure username is unique
        base_username = username
        counter = 1
        while Users.query.filter_by(username=username).first():
            username = f"{base_username}{counter}"
            counter += 1

        user = Users(
            email=email,
            username=username,
            first_name=email.split("@")[0].title(),  # Default first name from email
            last_name="User",  # Default last name
        )
        self.db.session.add(user)
        self.db.session.flush()

        # Create OAuth auth record
        auth = Authentications(
            user_id=user.id, auth_type="oauth", external_id=external_id
        )
        self.db.session.add(auth)
        self.db.session.commit()
        return user

    def store_token(self, user, token):
        user.last_login = datetime.now()
        user.current_token = token
        self.db.session.commit()
        return user

    def revoke_token(self, user):
        user.current_token = None
        self.db.session.commit()

        return user

    def update_profile(self, user_id, update_data):
        """Update user profile

        Args:
            user_id (str): User ID
            update_data (dict): Data to update

        Returns:
            Users: Updated user object
        """
        user = Users.query.filter_by(id=user_id).first()

        if not user:
            raise ValueError("User not found")

        if "first_name" in update_data:
            user.first_name = update_data["first_name"]
        if "last_name" in update_data:
            user.last_name = update_data["last_name"]

        # Check for uniqueness for username and email fields
        if "username" in update_data and update_data["username"] != user.username:
            if Users.query.filter_by(username=update_data["username"]).first():
                raise ValueError("Username already taken")
            user.username = update_data["username"]

        if "email" in update_data and update_data["email"] != user.email:
            if Users.query.filter_by(email=update_data["email"]).first():
                raise ValueError("Email already registered")
            user.email = update_data["email"]

        # Update password if provided
        if "password" in update_data:
            auth = Authentications.query.filter_by(
                user_id=user.id, auth_type="traditional"
            ).first()
            if auth:
                auth.password_hash = generate_password_hash(update_data["password"])

        # Update timestamp
        user.updated_at = datetime.utcnow()

        # Commit changes
        self.db.session.commit()

        return user

    def delete_account(self, user_id):
        user = Users.query.filter_by(id=user_id).first()

        if not user:
            raise ValueError("User not found")

        self.db.session.delete(user)
        self.db.session.commit()
