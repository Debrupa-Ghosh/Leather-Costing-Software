from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum


class OrderType(str, enum.Enum):
    sales = "sales"
    purchase = "purchase"
    export = "export"


class OrderStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"
    returned = "returned"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    partial = "partial"
    paid = "paid"
    overdue = "overdue"
    refunded = "refunded"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(100), unique=True, index=True, nullable=False)
    order_type = Column(Enum(OrderType), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.draft)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    order_date = Column(DateTime, server_default=func.now())
    expected_delivery = Column(DateTime)
    actual_delivery = Column(DateTime)
    shipping_address = Column(Text)
    shipping_method = Column(String(100))
    tracking_number = Column(String(200))
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    shipping_cost = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    paid_amount = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)

    customer = relationship("Customer", back_populates="orders")
    supplier = relationship("Supplier", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="order")
    payments = relationship("Payment", back_populates="order")
    production_orders = relationship("ProductionOrder", back_populates="customer_order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    total_price = Column(Float, nullable=False)
    notes = Column(Text)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    invoice_date = Column(DateTime, server_default=func.now())
    due_date = Column(DateTime)
    subtotal = Column(Float)
    tax = Column(Float, default=0.0)
    total = Column(Float)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    notes = Column(Text)
    pdf_path = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_number = Column(String(100), unique=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    amount = Column(Float, nullable=False)
    payment_method = Column(String(100))  # cash, bank_transfer, cheque, card
    payment_date = Column(DateTime, server_default=func.now())
    reference = Column(String(200))
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")
