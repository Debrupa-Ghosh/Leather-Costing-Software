from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(300), nullable=False)
    company = Column(String(300))
    email = Column(String(200))
    phone = Column(String(20))
    country = Column(String(100))
    city = Column(String(100))
    address = Column(Text)
    tax_number = Column(String(100))
    credit_limit = Column(Float, default=0.0)
    outstanding_balance = Column(Float, default=0.0)
    total_orders = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    is_export_customer = Column(Boolean, default=False)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)

    orders = relationship("Order", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(300), nullable=False)
    company = Column(String(300))
    email = Column(String(200))
    phone = Column(String(20))
    country = Column(String(100))
    city = Column(String(100))
    address = Column(Text)
    tax_number = Column(String(100))
    quality_rating = Column(Float, default=0.0)  # 0-5
    delivery_rating = Column(Float, default=0.0)  # 0-5
    price_rating = Column(Float, default=0.0)  # 0-5
    overall_rating = Column(Float, default=0.0)  # AI computed
    payment_terms = Column(String(200))  # Net 30, Net 60, etc.
    lead_time_days = Column(Integer, default=7)
    total_orders = Column(Integer, default=0)
    total_purchases = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)

    raw_materials = relationship("RawMaterial", back_populates="supplier")
    orders = relationship("Order", back_populates="supplier")
