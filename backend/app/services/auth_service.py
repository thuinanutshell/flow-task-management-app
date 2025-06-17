from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_
from app.models import Users, Authentications, db


class AuthService:
    def __init__(self, db):
        self.db = db

    def register_user(self, email, username, password, first_name="", last_name=""):
        """Register a new traditional user"""
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
            raise ValueError("Invalid credentials")

        # Find traditional auth record
        auth = Authentications.query.filter_by(
            user_id=user.id, auth_type="traditional"
        ).first()

        if not auth or not check_password_hash(auth.password_hash, password):
            raise ValueError("Invalid credentials")

        return user

    def oauth_login(self, email, external_id, name=""):
        """Login or register OAuth user"""
        # Try to find existing OAuth user
        auth = Authentications.query.filter_by(
            external_id=external_id, auth_type="oauth"
        ).first()

        if auth:
            return auth.user

        # Create new OAuth user
        username = email.split("@")[0] + "_oauth"
        names = name.split(" ", 1) if name else ["User", ""]

        user = Users(
            email=email,
            username=username,
            first_name=names[0],
            last_name=names[1] if len(names) > 1 else "User",
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
