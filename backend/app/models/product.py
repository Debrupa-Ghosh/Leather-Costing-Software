from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum


class ProductCategory(str, enum.Enum):
    bag = "bag"
    wallet = "wallet"
    belt = "belt"
    shoe = "shoe"
    jacket = "jacket"
    accessory = "accessory"
    other = "other"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(300), nullable=False)
    category = Column(Enum(ProductCategory))
    description = Column(Text)
    image = Column(String(500))
    barcode = Column(String(200))
    qr_code = Column(String(500))
    unit = Column(String(50), default="piece")
    selling_price = Column(Float, default=0.0)
    min_selling_price = Column(Float, default=0.0)
    weight = Column(Float)  # in grams
    dimensions = Column(JSON)  # {"length": 30, "width": 20, "height": 10}
    tags = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)

    bom = relationship("BOM", back_populates="product", uselist=False)
    costings = relationship("ProductCosting", back_populates="product")
    production_orders = relationship("ProductionOrder", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")


class ProductCosting(Base):
    __tablename__ = "product_costings"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    version = Column(Integer, default=1)
    leather_cost = Column(Float, default=0.0)
    accessories_cost = Column(Float, default=0.0)
    labor_cost = Column(Float, default=0.0)
    machine_cost = Column(Float, default=0.0)
    electricity_cost = Column(Float, default=0.0)
    overhead_cost = Column(Float, default=0.0)
    packaging_cost = Column(Float, default=0.0)
    transportation_cost = Column(Float, default=0.0)
    tax_percentage = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    profit_margin_percentage = Column(Float, default=20.0)
    profit_amount = Column(Float, default=0.0)
    total_production_cost = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    profitability = Column(Float, default=0.0)
    notes = Column(Text)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="costings")
