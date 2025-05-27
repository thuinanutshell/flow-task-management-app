from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    PickleType,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.ext.mutable import MutableList
from typing import List


class Base(DeclarativeBase):
    # Shared column static attributes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Shared column dynamic attributes
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    @declared_attr
    def id(cls):
        id = Column(Integer, primary_key=True)
        return id


db = SQLAlchemy(model_class=Base)


class User(db.Model, UserMixin):
    username = Column(String(32), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(128), nullable=False)

    # One-to-many relationship with the folder table
    folders: Mapped[List["Folder"]] = relationship(back_populates="user")


class Folder(db.Model):
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    # Many-to-one relationship with the user table
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    user: Mapped["User"] = relationship(back_populates="folders")

    # One-to-many relationship with the task table
    tasks: Mapped[List["Task"]] = relationship(back_populates="folder")


class Task(db.Model):
    name = Column(String, nullable=False, unique=True)
    status = Column(Boolean, nullable=False, default=False)

    # Many-to-one relationship with the folder table
    # Note that tasks have to belong to a folder
    folder_id: Mapped[int] = mapped_column(ForeignKey("folder.id"), nullable=False)
    folder: Mapped["Folder"] = relationship(back_populates="tasks")
