from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey, Table
from sqlalchemy.orm import declarative_base, relationship
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://hta:hta_secret_2026@localhost:5432/hta_cleaner")
engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10)

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    full_name = Column(String(200), nullable=False)
    manager_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tabs = relationship("UserTab", back_populates="user", cascade="all, delete-orphan")


class UserTab(Base):
    __tablename__ = "user_tabs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tab_id = Column(String(50), nullable=False)

    user = relationship("User", back_populates="tabs")


class Cabinet(Base):
    __tablename__ = "cabinets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cabinet_number = Column(String(20), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    cleaner_username = Column(String(100), nullable=False)
    cleaner_name = Column(String(200), nullable=True)
    cabinet_number = Column(String(20), nullable=False, index=True)
    checklist = Column(Text, nullable=True)
    photos = Column(Text, nullable=True)
