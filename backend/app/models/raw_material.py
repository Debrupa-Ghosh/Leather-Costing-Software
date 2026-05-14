from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum


class LeatherGrade(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    premium = "premium"
    standard = "standard"


class RawMaterial(Base):
    __tablename__ = "raw_materials"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    leather_type = Column(String(100))  # Full grain, Top grain, Split, Nubuck, Suede
    color = Column(String(100))
    thickness = Column(Float)  # in mm
    grade = Column(Enum(LeatherGrade), default=LeatherGrade.standard)
    unit = Column(String(50), default="sqft")  # sqft, sqm, kg, piece
    unit_price = Column(Float, default=0.0)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    current_stock = Column(Float, default=0.0)
    minimum_stock = Column(Float, default=10.0)
    maximum_stock = Column(Float, default=1000.0)
    reorder_point = Column(Float, default=50.0)
    batch_number = Column(String(100))
    lot_number = Column(String(100))
    barcode = Column(String(200))
    qr_code = Column(String(500))
    description = Column(Text)
    image = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)

    supplier = relationship("Supplier", back_populates="raw_materials")
    warehouse = relationship("Warehouse", back_populates="raw_materials")
    inventory_transactions = relationship("InventoryTransaction", back_populates="raw_material")
    bom_items = relationship("BOMItem", back_populates="raw_material")


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(200), nullable=False)
    location = Column(String(500))
    capacity = Column(Float)
    manager_name = Column(String(200))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    raw_materials = relationship("RawMaterial", back_populates="warehouse")
    inventory_transactions = relationship("InventoryTransaction", back_populates="warehouse")
