from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum


class BOM(Base):
    """Bill of Materials - Top level"""
    __tablename__ = "bom"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False)
    version = Column(Integer, default=1)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="bom")
    items = relationship("BOMItem", back_populates="bom", cascade="all, delete-orphan")


class BOMItem(Base):
    """Individual items in a Bill of Materials"""
    __tablename__ = "bom_items"

    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("bom.id"), nullable=False)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50))
    wastage_percentage = Column(Float, default=5.0)
    effective_quantity = Column(Float)  # quantity * (1 + wastage/100)
    unit_cost = Column(Float)
    total_cost = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    bom = relationship("BOM", back_populates="items")
    raw_material = relationship("RawMaterial", back_populates="bom_items")
