from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(500), nullable=False)
    message = Column(Text)
    type = Column(String(50))  # info, warning, success, danger
    is_read = Column(Boolean, default=False)
    link = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="notifications")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(500), nullable=False)
    module = Column(String(100))
    record_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="activity_logs")


class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(Integer, primary_key=True, index=True)
    prediction_type = Column(String(100))  # cost, demand, waste, delay, inventory
    entity_type = Column(String(100))  # product, raw_material, order, production_order
    entity_id = Column(Integer)
    predicted_value = Column(Float)
    actual_value = Column(Float)
    confidence_score = Column(Float)
    features_used = Column(JSON)
    model_version = Column(String(50))
    prediction_date = Column(DateTime, server_default=func.now())
    notes = Column(Text)
