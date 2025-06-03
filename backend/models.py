from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()


class Base(db.Model):
    """A custome base that defines the shared attributes among tables.
    The line __abstract__ = True ensures that SQLAlchemy does not try to create a table for the Base class itself.
    It's meant to be inherited from, not instantiated directly in the database.
    The attributes include created_at, updated_at, and deleted_at.
    """

    __abstract__ = True
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    deleted_at = db.Column(db.DateTime, nullable=True)

    def soft_delete(self):
        """Mark the record as deleted by setting deleted_at timestamp."""
        self.deleted_at = datetime.utcnow()


class User(db.Model, UserMixin):
    """Table to store user's personal information.

    Attributes:
        id (integer): user's unique id
        username (string): lowercase username
        email (string): user's email (has to have a valid form)
        lists: one-to-many relationship with the List model (one user can have multiple lists)
    """

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True, index=True)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    lists = db.relationship(
        "List", backref="user", lazy=True, cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"User('{self.username}', lists: {len(self.lists)})"

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "lists": [list_item.to_dict() for list_item in self.lists],
        }


class List(db.Model):
    """Table to store user's lists

    Attributes:
        id (integer): the list's unique id
        name (string): list's name
        user_id (integer): A foreign key that connects the list with the user table
                           This demonstrates the many-to-one relationship with the User model (many lists belong to a user)
        tasks (list): One-to-many relationship with the Task model, one list can have multiple tasks
    """

    __tablename__ = "lists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)

    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    tasks = db.relationship(
        "Task", backref="list", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        active_tasks = [task for task in self.tasks]
        return {
            "id": self.id,
            "name": self.name,
            "tasks": [task.to_dict() for task in active_tasks],
        }

    def __repr__(self):
        active_tasks = [task for task in self.tasks]
        return f"List('{self.name}', tasks: {len(active_tasks)})"


class Task(db.Model):
    """Table to store the list's tasks information

    Attributes:
        id (integer): the task's unique id
        name (string): task's name
        description (string): description of the task
        is_completed (boolean): task completion status
        list_id (integer): Many-to-one relationship with the List model. Many tasks belong to a list
    """

    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_completed = db.Column(db.Boolean, nullable=False, default=False)

    list_id = db.Column(
        db.Integer, db.ForeignKey("lists.id"), nullable=False, index=True
    )

    def __repr__(self):
        return f"Task('{self.name}', list_id: {self.list_id})"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "list_id": self.list_id,
            "is_completed": self.is_completed,
        }

    def mark_completed(self):
        self.is_completed = True
