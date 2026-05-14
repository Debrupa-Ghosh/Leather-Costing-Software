"""
Notification Service: Generates real-time notifications for critical business events.
- Low stock alerts
- New order arrivals
- Production delay risks
- Quality inspection failures
"""
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User, UserRole


def _get_admin_user_ids(db: Session) -> list:
    """Get all super_admin and factory_manager user IDs for broadcasting notifications."""
    admins = db.query(User.id).filter(
        User.role.in_([UserRole.super_admin, UserRole.factory_manager]),
        User.is_active == True,
        User.deleted_at == None
    ).all()
    return [a.id for a in admins]


def _create_notification(db: Session, user_id: int, title: str, message: str, notif_type: str, link: str = None):
    """Create a single notification for a user, avoiding duplicates within the last hour."""
    from datetime import datetime, timedelta

    # Avoid duplicate notifications (same title & message within last 1 hour)
    recent = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.title == title,
        Notification.message == message,
        Notification.created_at >= datetime.utcnow() - timedelta(hours=1)
    ).first()

    if recent:
        return  # Skip duplicate

    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        link=link
    )
    db.add(notif)


def broadcast_notification(db: Session, title: str, message: str, notif_type: str, link: str = None):
    """Send a notification to all admin/manager users."""
    admin_ids = _get_admin_user_ids(db)
    for uid in admin_ids:
        _create_notification(db, uid, title, message, notif_type, link)
    db.commit()


def notify_low_stock(db: Session, material_name: str, current_stock: float, unit: str, reorder_point: float):
    """Generate low stock notification."""
    if current_stock <= 0:
        title = "🚨 Out of Stock"
        message = f"{material_name} is completely OUT OF STOCK. Immediate reorder needed."
        notif_type = "danger"
    else:
        title = "⚠️ Low Stock Alert"
        message = f"{material_name} has fallen below reorder point ({current_stock} {unit} remaining, reorder at {reorder_point})"
        notif_type = "warning"

    broadcast_notification(db, title, message, notif_type, link="/inventory")


def notify_new_order(db: Session, order_number: str, order_type: str, total_amount: float, customer_name: str = None):
    """Generate new order notification."""
    title = "🛒 New Order Received"
    who = f" from {customer_name}" if customer_name else ""
    message = f"Order {order_number} ({order_type}){who} for ${total_amount:,.2f}"
    notif_type = "success"

    broadcast_notification(db, title, message, notif_type, link="/orders")


def notify_production_delay(db: Session, order_number: str, product_name: str, delay_probability: float):
    """Generate production delay risk notification."""
    title = "⏰ Production Delay Risk"
    pct = int(delay_probability * 100)
    message = f"{order_number} ({product_name}) has {pct}% delay probability — immediate attention needed"
    notif_type = "danger"

    broadcast_notification(db, title, message, notif_type, link="/production")


def notify_quality_failure(db: Session, check_number: str, defect_type: str, product_name: str = None):
    """Generate quality check failure notification."""
    title = "❌ Quality Inspection Failed"
    prod = f" on {product_name}" if product_name else ""
    message = f"{check_number} reported critical defect: {defect_type}{prod}"
    notif_type = "danger"

    broadcast_notification(db, title, message, notif_type, link="/quality")


def notify_production_status_change(db: Session, order_number: str, old_status: str, new_status: str):
    """Generate notification when production order status changes to a notable state."""
    notable_statuses = {"completed", "delayed", "cancelled"}
    if new_status not in notable_statuses:
        return

    status_info = {
        "completed": ("✅ Production Completed", "success"),
        "delayed": ("⏰ Production Delayed", "danger"),
        "cancelled": ("🚫 Production Cancelled", "warning"),
    }
    title, notif_type = status_info[new_status]
    message = f"Production order {order_number} status changed to {new_status.replace('_', ' ').title()}"

    broadcast_notification(db, title, message, notif_type, link="/production")
