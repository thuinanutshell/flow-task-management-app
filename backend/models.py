from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()


class User(db.Model, UserMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(320), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # One-to-many relationship with the List table (one user can have multiple lists)
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
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "lists": [list_item.to_dict() for list_item in self.lists],
        }


class List(db.Model):
    __tablename__ = "lists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)

    # Many-to-one relationship with the User model (many lists belong to a user)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # One-to-many relationship with the Task model (one list can have many tasks)
    tasks = db.relationship(
        "Task", backref="list", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        active_tasks = [task for task in self.tasks if not task.deleted_at]

        return {
            "id": self.id,
            "name": self.name,
            "order_index": self.order_index,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "tasks": [
                task.to_dict()
                for task in sorted(active_tasks, key=lambda x: x.order_index)
            ],
        }

    def __repr__(self):
        active_tasks = [task for task in self.tasks if not task.deleted_at]
        return f"List('{self.name}', order_idx: {self.order_index}, tasks: {len(active_tasks)})"


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)

    # Many-to-one relationship with the List model
    list_id = db.Column(db.Integer, db.ForeignKey("lists.id"), nullable=False)
    is_completed = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    order_index = db.Column(db.Integer, nullable=False, default=0)
    deleted_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"Task('{self.name}', list_id: {self.list_id})"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "list_id": self.list_id,
            "is_completed": self.is_completed,
            "order_index": self.order_index,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
            "completed_at": (
                self.completed_at.isoformat() if self.completed_at else None
            ),
        }

    def soft_delete(self):
        self.deleted_at = datetime.utcnow()

    def mark_completed(self):
        self.is_completed = True
        self.completed_at = datetime.utcnow()
