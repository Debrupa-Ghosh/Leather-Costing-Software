from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.database.database import get_db
from app.models.order import Order, OrderItem, Invoice, Payment, OrderType, OrderStatus, PaymentStatus
from app.models.customer import Customer, Supplier
from app.core.dependencies import get_current_user
from app.models.user import User
from app.utils.response import success_response, paginated_response
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/orders", tags=["Order Management"])


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    discount: float = 0.0


class OrderCreate(BaseModel):
    order_type: OrderType
    customer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    expected_delivery: Optional[datetime] = None
    shipping_address: Optional[str] = None
    shipping_method: Optional[str] = None
    currency: str = "USD"
    notes: Optional[str] = None
    items: List[OrderItemCreate]


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    tracking_number: Optional[str] = None
    actual_delivery: Optional[datetime] = None
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = None


class PaymentCreate(BaseModel):
    amount: float
    payment_method: str
    reference: Optional[str] = None
    notes: Optional[str] = None


@router.get("/", response_model=dict)
async def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    order_type: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Order).filter(Order.deleted_at == None)
    if order_type:
        query = query.filter(Order.order_type == order_type)
    if status:
        query = query.filter(Order.status == status)
    if payment_status:
        query = query.filter(Order.payment_status == payment_status)

    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return paginated_response(data=[{
        "id": o.id, "order_number": o.order_number, "order_type": o.order_type,
        "status": o.status, "total_amount": o.total_amount,
        "payment_status": o.payment_status, "currency": o.currency,
        "customer_id": o.customer_id, "supplier_id": o.supplier_id,
        "order_date": o.order_date, "expected_delivery": o.expected_delivery
    } for o in orders], total=total, page=page, limit=limit)


@router.post("/", response_model=dict)
async def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(Order).count()
    prefix = {"sales": "SO", "purchase": "PO", "export": "EX"}.get(data.order_type, "ORD")
    order_number = f"{prefix}-{datetime.utcnow().strftime('%Y%m%d')}-{str(count + 1).zfill(4)}"

    subtotal = sum(item.quantity * item.unit_price - item.discount for item in data.items)
    tax = subtotal * 0.0  # Can be configured
    total = subtotal + tax

    order = Order(
        order_number=order_number,
        order_type=data.order_type,
        customer_id=data.customer_id,
        supplier_id=data.supplier_id,
        expected_delivery=data.expected_delivery,
        shipping_address=data.shipping_address,
        shipping_method=data.shipping_method,
        currency=data.currency,
        notes=data.notes,
        subtotal=subtotal, tax=tax, total_amount=total,
        created_by=current_user.id
    )
    db.add(order)
    db.flush()

    for item_data in data.items:
        total_price = item_data.quantity * item_data.unit_price - item_data.discount
        item = OrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            discount=item_data.discount,
            total_price=total_price
        )
        db.add(item)

    db.commit()
    db.refresh(order)
    return success_response(data={"id": order.id, "order_number": order.order_number}, message="Order created")


@router.get("/{order_id}", response_model=dict)
async def get_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id, Order.deleted_at == None).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items = [{
        "id": i.id, "product_id": i.product_id, "quantity": i.quantity,
        "unit_price": i.unit_price, "discount": i.discount, "total_price": i.total_price
    } for i in order.items]

    return success_response(data={
        "id": order.id, "order_number": order.order_number, "order_type": order.order_type,
        "status": order.status, "customer_id": order.customer_id, "supplier_id": order.supplier_id,
        "order_date": order.order_date, "expected_delivery": order.expected_delivery,
        "tracking_number": order.tracking_number, "subtotal": order.subtotal,
        "tax": order.tax, "total_amount": order.total_amount,
        "payment_status": order.payment_status, "paid_amount": order.paid_amount,
        "currency": order.currency, "notes": order.notes, "items": items
    })


@router.put("/{order_id}", response_model=dict)
async def update_order(
    order_id: int, data: OrderUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id, Order.deleted_at == None).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(order, key, value)
    db.commit()
    return success_response(message="Order updated")


@router.post("/{order_id}/payments", response_model=dict)
async def add_payment(
    order_id: int, data: PaymentCreate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    count = db.query(Payment).count()
    payment = Payment(
        payment_number=f"PAY-{str(count + 1).zfill(6)}",
        order_id=order_id,
        amount=data.amount,
        payment_method=data.payment_method,
        reference=data.reference,
        notes=data.notes,
        created_by=current_user.id
    )
    db.add(payment)

    order.paid_amount = (order.paid_amount or 0) + data.amount
    if order.paid_amount >= order.total_amount:
        order.payment_status = PaymentStatus.paid
    elif order.paid_amount > 0:
        order.payment_status = PaymentStatus.partial

    db.commit()
    return success_response(message="Payment recorded")


@router.get("/stats/summary", response_model=dict)
async def get_order_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.order_type == "sales", Order.payment_status == "paid"
    ).scalar() or 0
    pending_orders = db.query(func.count(Order.id)).filter(Order.status == "confirmed").scalar()
    total_orders = db.query(func.count(Order.id)).filter(Order.deleted_at == None).scalar()

    return success_response(data={
        "total_revenue": total_revenue,
        "pending_orders": pending_orders,
        "total_orders": total_orders
    })
