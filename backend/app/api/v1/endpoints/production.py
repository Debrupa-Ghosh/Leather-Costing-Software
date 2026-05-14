from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database.database import get_db
from app.models.production import ProductionOrder, ProductionLog, ProductionStatus
from app.models.product import Product
from app.core.dependencies import get_current_user
from app.models.user import User
from app.utils.response import success_response, paginated_response
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/production", tags=["Production Management"])


class ProductionOrderCreate(BaseModel):
    product_id: int
    quantity: int
    priority: str = "normal"
    start_date: Optional[datetime] = None
    expected_end_date: Optional[datetime] = None
    customer_order_id: Optional[int] = None
    notes: Optional[str] = None


class ProductionOrderUpdate(BaseModel):
    status: Optional[ProductionStatus] = None
    priority: Optional[str] = None
    expected_end_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    delay_reason: Optional[str] = None
    notes: Optional[str] = None


class ProductionLogCreate(BaseModel):
    department: str
    action: str
    quantity_processed: float = 0
    wastage: float = 0
    time_taken: Optional[float] = None
    notes: Optional[str] = None


@router.get("/orders", response_model=dict)
async def get_production_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ProductionOrder).filter(ProductionOrder.deleted_at == None)
    if status:
        query = query.filter(ProductionOrder.status == status)
    if priority:
        query = query.filter(ProductionOrder.priority == priority)

    total = query.count()
    orders = query.order_by(ProductionOrder.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    data = []
    for order in orders:
        product = db.query(Product).filter(Product.id == order.product_id).first()
        data.append({
            "id": order.id,
            "order_number": order.order_number,
            "product_name": product.name if product else "Unknown",
            "product_id": order.product_id,
            "quantity": order.quantity,
            "status": order.status,
            "priority": order.priority,
            "start_date": order.start_date,
            "expected_end_date": order.expected_end_date,
            "delay_probability": order.delay_probability,
            "created_at": order.created_at
        })

    return paginated_response(data=data, total=total, page=page, limit=limit)


@router.post("/orders", response_model=dict)
async def create_production_order(
    data: ProductionOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    count = db.query(ProductionOrder).count()
    order_number = f"PO-{datetime.utcnow().strftime('%Y%m%d')}-{str(count + 1).zfill(4)}"

    order = ProductionOrder(
        order_number=order_number,
        product_id=data.product_id,
        quantity=data.quantity,
        priority=data.priority,
        start_date=data.start_date or datetime.utcnow(),
        expected_end_date=data.expected_end_date,
        customer_order_id=data.customer_order_id,
        notes=data.notes,
        assigned_manager=current_user.id
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return success_response(data={"id": order.id, "order_number": order.order_number}, message="Production order created")


@router.get("/orders/{order_id}", response_model=dict)
async def get_production_order(
    order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    order = db.query(ProductionOrder).filter(ProductionOrder.id == order_id, ProductionOrder.deleted_at == None).first()
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    logs = [{
        "id": log.id, "department": log.department, "action": log.action,
        "quantity_processed": log.quantity_processed, "wastage": log.wastage,
        "time_taken": log.time_taken, "created_at": log.created_at
    } for log in order.logs]

    return success_response(data={
        "id": order.id, "order_number": order.order_number,
        "product_id": order.product_id, "quantity": order.quantity,
        "status": order.status, "priority": order.priority,
        "start_date": order.start_date, "expected_end_date": order.expected_end_date,
        "actual_end_date": order.actual_end_date, "delay_probability": order.delay_probability,
        "delay_reason": order.delay_reason, "notes": order.notes,
        "logs": logs, "created_at": order.created_at
    })


@router.put("/orders/{order_id}", response_model=dict)
async def update_production_order(
    order_id: int, data: ProductionOrderUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    order = db.query(ProductionOrder).filter(ProductionOrder.id == order_id, ProductionOrder.deleted_at == None).first()
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    return success_response(data={"id": order.id, "status": order.status}, message="Production order updated")


@router.post("/orders/{order_id}/logs", response_model=dict)
async def add_production_log(
    order_id: int, data: ProductionLogCreate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    order = db.query(ProductionOrder).filter(ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    log = ProductionLog(
        production_order_id=order_id,
        department=data.department,
        worker_id=current_user.id,
        action=data.action,
        quantity_processed=data.quantity_processed,
        wastage=data.wastage,
        time_taken=data.time_taken,
        notes=data.notes
    )
    db.add(log)
    db.commit()
    return success_response(message="Production log added")


@router.get("/stats", response_model=dict)
async def get_production_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = db.query(func.count(ProductionOrder.id)).scalar()
    pending = db.query(func.count(ProductionOrder.id)).filter(ProductionOrder.status == "pending").scalar()
    in_progress = db.query(func.count(ProductionOrder.id)).filter(
        ProductionOrder.status.in_(["in_progress", "cutting", "stitching", "finishing", "packing"])
    ).scalar()
    completed = db.query(func.count(ProductionOrder.id)).filter(ProductionOrder.status == "completed").scalar()
    delayed = db.query(func.count(ProductionOrder.id)).filter(ProductionOrder.status == "delayed").scalar()

    return success_response(data={
        "total": total, "pending": pending, "in_progress": in_progress,
        "completed": completed, "delayed": delayed
    })
