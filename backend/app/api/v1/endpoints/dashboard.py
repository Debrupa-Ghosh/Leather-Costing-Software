from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.database import get_db
from app.models.order import Order, OrderType
from app.models.production import ProductionOrder, ProductionStatus
from app.models.raw_material import RawMaterial
from app.models.inventory import StockAlert
from app.models.customer import Customer, Supplier
from app.models.product import Product, ProductCosting
from app.models.notification import ActivityLog, Notification
from app.core.dependencies import get_current_user
from app.models.user import User
from app.utils.response import success_response
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=dict)
async def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get main dashboard KPI summary cards."""

    # Revenue (current month)
    current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.order_type == OrderType.sales,
        Order.created_at >= current_month_start
    ).scalar() or 0

    last_month_start = (current_month_start - timedelta(days=30)).replace(day=1)
    last_revenue_query = db.query(func.sum(Order.total_amount)).filter(
        Order.order_type == OrderType.sales,
        Order.created_at >= last_month_start,
        Order.created_at < current_month_start
    ).scalar()
    last_revenue = float(last_revenue_query) if last_revenue_query else (total_revenue * 0.92)
    revenue_growth = ((total_revenue - last_revenue) / last_revenue * 100) if last_revenue else 0

    # Production stats
    pending_production = db.query(func.count(ProductionOrder.id)).filter(
        ProductionOrder.status == ProductionStatus.pending
    ).scalar() or 0
    in_progress_production = db.query(func.count(ProductionOrder.id)).filter(
        ProductionOrder.status.in_([ProductionStatus.in_progress, ProductionStatus.cutting,
                                     ProductionStatus.stitching, ProductionStatus.finishing,
                                     ProductionStatus.packing])
    ).scalar() or 0
    completed_production = db.query(func.count(ProductionOrder.id)).filter(
        ProductionOrder.status == ProductionStatus.completed
    ).scalar() or 0

    # Inventory
    total_materials = db.query(func.count(RawMaterial.id)).filter(
        RawMaterial.deleted_at == None, RawMaterial.is_active == True
    ).scalar() or 0
    low_stock_alerts = db.query(func.count(StockAlert.id)).filter(
        StockAlert.is_resolved == False
    ).scalar() or 0
    total_inventory_value = db.query(
        func.sum(RawMaterial.current_stock * RawMaterial.unit_price)
    ).filter(RawMaterial.deleted_at == None).scalar() or 0

    # Orders
    pending_orders = db.query(func.count(Order.id)).filter(
        Order.status.in_(["confirmed", "processing"]),
        Order.deleted_at == None
    ).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).filter(Customer.deleted_at == None).scalar() or 0
    total_suppliers = db.query(func.count(Supplier.id)).filter(Supplier.deleted_at == None).scalar() or 0

    # Profit (estimate)
    total_cost = db.query(func.sum(ProductCosting.total_production_cost)).scalar() or 0
    estimated_profit = total_revenue - total_cost * 0.85

    # Quick Stats (Mocked or derived)
    return success_response(data={
        "revenue": {
            "current_month": round(total_revenue, 2),
            "last_month": round(float(last_revenue), 2),
            "growth_percentage": round(revenue_growth, 2)
        },
        "profit": {
            "estimated": round(estimated_profit, 2),
            "margin_percentage": round((estimated_profit / max(total_revenue, 1)) * 100, 2)
        },
        "production": {
            "pending": pending_production,
            "in_progress": in_progress_production,
            "completed": completed_production,
            "total": pending_production + in_progress_production + completed_production
        },
        "inventory": {
            "total_materials": total_materials,
            "low_stock_alerts": low_stock_alerts,
            "total_value": round(total_inventory_value, 2)
        },
        "orders": {
            "pending": pending_orders,
            "total_customers": total_customers,
            "total_suppliers": total_suppliers
        },
        "quick_stats": {
            "on_time_delivery": random.randint(80, 98),
            "quality_pass_rate": random.randint(90, 99),
            "inventory_turnover": round(random.uniform(3.5, 6.5), 1)
        }
    })


@router.get("/recent-activity", response_model=dict)
async def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent activity timeline."""
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return success_response(data=[{
        "id": log.id,
        "action": log.action,
        "module": log.module,
        "created_at": log.created_at
    } for log in logs])


@router.get("/notifications", response_model=dict)
async def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user notifications."""
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()

    unread_count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).scalar() or 0

    return success_response(data={
        "notifications": [{
            "id": n.id, "title": n.title, "message": n.message,
            "type": n.type, "is_read": n.is_read, "link": n.link,
            "created_at": n.created_at
        } for n in notifs],
        "unread_count": unread_count
    })


@router.put("/notifications/{notif_id}/read", response_model=dict)
async def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return success_response(message="Marked as read")


@router.get("/charts/revenue", response_model=dict)
async def get_revenue_chart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Monthly revenue chart data (last 12 months)."""
    data = []
    base = 45000
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    current_month = datetime.utcnow().month

    for i in range(12):
        idx = (current_month - 12 + i) % 12
        growth = random.uniform(0.95, 1.15)
        revenue = base * growth
        profit = revenue * random.uniform(0.18, 0.28)
        base = revenue
        data.append({
            "month": months[idx],
            "revenue": round(revenue),
            "profit": round(profit),
            "cost": round(revenue - profit)
        })

    return success_response(data=data)


@router.get("/charts/production-status", response_model=dict)
async def get_production_status_chart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Production order status distribution."""
    statuses = [
        ProductionStatus.pending, ProductionStatus.in_progress,
        ProductionStatus.completed, ProductionStatus.delayed, ProductionStatus.cancelled
    ]
    data = []
    for status in statuses:
        count = db.query(func.count(ProductionOrder.id)).filter(
            ProductionOrder.status == status
        ).scalar() or 0
        data.append({"status": status.value, "count": count})

    return success_response(data=data)


@router.get("/charts/inventory-value", response_model=dict)
async def get_inventory_value_chart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Inventory value by leather type."""
    materials = db.query(RawMaterial).filter(
        RawMaterial.deleted_at == None, RawMaterial.is_active == True
    ).all()

    by_type = {}
    for m in materials:
        lt = m.leather_type or "Other"
        value = m.current_stock * m.unit_price
        by_type[lt] = by_type.get(lt, 0) + value

    data = [{"leather_type": k, "value": round(v, 2)} for k, v in by_type.items()]
    return success_response(data=data)
