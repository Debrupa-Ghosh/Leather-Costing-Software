from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum


class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    factory_manager = "factory_manager"
    accountant = "accountant"
    production_manager = "production_manager"
    inventory_manager = "inventory_manager"
    worker = "worker"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(500), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.worker)
    department = Column(String(100))
    phone = Column(String(20))
    avatar = Column(String(500))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime)
    reset_token = Column(String(500))
    reset_token_expiry = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)

    activity_logs = relationship("ActivityLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
