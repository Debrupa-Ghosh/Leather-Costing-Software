from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum


class ProductionStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    cutting = "cutting"
    stitching = "stitching"
    finishing = "finishing"
    packing = "packing"
    completed = "completed"
    delayed = "delayed"
    cancelled = "cancelled"


class ProductionOrder(Base):
    __tablename__ = "production_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(100), unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(Enum(ProductionStatus), default=ProductionStatus.pending)
    priority = Column(String(20), default="normal")  # low, normal, high, urgent
    start_date = Column(DateTime)
    expected_end_date = Column(DateTime)
    actual_end_date = Column(DateTime)
    assigned_manager = Column(Integer, ForeignKey("users.id"))
    customer_order_id = Column(Integer, ForeignKey("orders.id"))
    notes = Column(Text)
    delay_reason = Column(Text)
    delay_probability = Column(Float, default=0.0)  # AI predicted
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)

    product = relationship("Product", back_populates="production_orders")
    logs = relationship("ProductionLog", back_populates="production_order")
    quality_checks = relationship("QualityCheck", back_populates="production_order")
    customer_order = relationship("Order", back_populates="production_orders")


class ProductionLog(Base):
    __tablename__ = "production_logs"

    id = Column(Integer, primary_key=True, index=True)
    production_order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False)
    department = Column(String(100))
    worker_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(500))
    quantity_processed = Column(Float, default=0)
    wastage = Column(Float, default=0)
    time_taken = Column(Float)  # in minutes
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    production_order = relationship("ProductionOrder", back_populates="logs")
    worker = relationship("User")
