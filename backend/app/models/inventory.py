from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum


class TransactionType(str, enum.Enum):
    purchase = "purchase"
    transfer = "transfer"
    adjustment = "adjustment"
    consumption = "consumption"
    return_stock = "return_stock"
    wastage = "wastage"


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_number = Column(String(100), unique=True, index=True)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    transaction_type = Column(Enum(TransactionType))
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float)
    total_value = Column(Float)
    reference_number = Column(String(200))
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

    raw_material = relationship("RawMaterial", back_populates="inventory_transactions")
    warehouse = relationship("Warehouse", back_populates="inventory_transactions")
    user = relationship("User")


class StockAlert(Base):
    __tablename__ = "stock_alerts"

    id = Column(Integer, primary_key=True, index=True)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"))
    alert_type = Column(String(50))  # low_stock, out_of_stock, excess_stock
    current_stock = Column(Float)
    threshold = Column(Float)
    message = Column(Text)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    raw_material = relationship("RawMaterial")
