from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum


class QCStatus(str, enum.Enum):
    pending = "pending"
    passed = "passed"
    failed = "failed"
    conditional = "conditional"


class QualityCheck(Base):
    __tablename__ = "quality_checks"

    id = Column(Integer, primary_key=True, index=True)
    check_number = Column(String(100), unique=True)
    production_order_id = Column(Integer, ForeignKey("production_orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    inspector_id = Column(Integer, ForeignKey("users.id"))
    quantity_inspected = Column(Integer, default=0)
    quantity_passed = Column(Integer, default=0)
    quantity_failed = Column(Integer, default=0)
    defect_details = Column(JSON)
    status = Column(Enum(QCStatus), default=QCStatus.pending)
    remarks = Column(Text)
    inspection_date = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    production_order = relationship("ProductionOrder", back_populates="quality_checks")
    defects = relationship("Defect", back_populates="quality_check")


class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True)
    quality_check_id = Column(Integer, ForeignKey("quality_checks.id"))
    defect_type = Column(String(200))
    severity = Column(String(50))  # minor, major, critical
    quantity = Column(Integer, default=1)
    description = Column(Text)
    action_taken = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())

    quality_check = relationship("QualityCheck", back_populates="defects")
