"""
Seed script to populate LeatherFlow AI ERP with demo data.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database.database import SessionLocal, init_db
from app.models.user import User, UserRole
from app.models.raw_material import RawMaterial, Warehouse
from app.models.product import Product, ProductCosting
from app.models.customer import Customer, Supplier
from app.models.order import Order, OrderItem, OrderType, OrderStatus, PaymentStatus
from app.models.production import ProductionOrder, ProductionStatus
from app.models.notification import Notification, ActivityLog
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import random

def seed():
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("⚠️  Database already seeded. Skipping...")
            return

        print("🌱 Starting database seed...")

        # ── Users ──────────────────────────────────────────────────────────
        users = [
            User(employee_id="LP0001", full_name="Admin User", email="admin@leatherpro.com",
                 hashed_password=get_password_hash("admin123"), role=UserRole.super_admin,
                 department="Administration", is_active=True, is_verified=True),
            User(employee_id="LP0002", full_name="James Wilson", email="manager@leatherpro.com",
                 hashed_password=get_password_hash("manager123"), role=UserRole.factory_manager,
                 department="Production", is_active=True, is_verified=True),
            User(employee_id="LP0003", full_name="Sarah Chen", email="accountant@leatherpro.com",
                 hashed_password=get_password_hash("accountant123"), role=UserRole.accountant,
                 department="Finance", is_active=True, is_verified=True),
            User(employee_id="LP0004", full_name="Mike Torres", email="production@leatherpro.com",
                 hashed_password=get_password_hash("production123"), role=UserRole.production_manager,
                 department="Production", is_active=True, is_verified=True),
            User(employee_id="LP0005", full_name="Lisa Park", email="inventory@leatherpro.com",
                 hashed_password=get_password_hash("inventory123"), role=UserRole.inventory_manager,
                 department="Warehouse", is_active=True, is_verified=True),
        ]
        db.add_all(users)
        db.flush()
        print(f"  ✅ Created {len(users)} users")

        # ── Warehouses ─────────────────────────────────────────────────────
        warehouses = [
            Warehouse(code="WH001", name="Main Leather Warehouse", location="Building A, Zone 1", capacity=10000, manager_name="Lisa Park"),
            Warehouse(code="WH002", name="Accessories Store", location="Building B, Zone 2", capacity=5000, manager_name="Mike Torres"),
            Warehouse(code="WH003", name="Finished Goods", location="Building C, Zone 3", capacity=8000, manager_name="James Wilson"),
        ]
        db.add_all(warehouses)
        db.flush()
        print(f"  ✅ Created {len(warehouses)} warehouses")

        # ── Suppliers ──────────────────────────────────────────────────────
        suppliers = [
            Supplier(code="SUP0001", name="Rajesh Leather Co.", company="Rajesh Industries Ltd", email="rajesh@rlco.in", phone="+91-22-12345678", country="India", city="Mumbai", quality_rating=4.8, delivery_rating=4.5, price_rating=4.2, overall_rating=4.5, payment_terms="Net 30", lead_time_days=7, total_orders=120),
            Supplier(code="SUP0002", name="Guangzhou Leather", company="GZ Leather Supply", email="info@gzleather.cn", phone="+86-20-87654321", country="China", city="Guangzhou", quality_rating=4.1, delivery_rating=3.8, price_rating=4.9, overall_rating=4.3, payment_terms="Net 45", lead_time_days=21, total_orders=85),
            Supplier(code="SUP0003", name="Italian Fine Hides", company="Conciaria Italiana", email="orders@italfinehides.it", phone="+39-055-123456", country="Italy", city="Florence", quality_rating=5.0, delivery_rating=4.7, price_rating=2.5, overall_rating=4.1, payment_terms="Net 60", lead_time_days=30, total_orders=45),
            Supplier(code="SUP0004", name="Bangladesh Tannery", company="BD Premium Leather", email="sales@bdleather.bd", phone="+880-2-9876543", country="Bangladesh", city="Dhaka", quality_rating=3.8, delivery_rating=3.5, price_rating=4.7, overall_rating=4.0, payment_terms="Net 15", lead_time_days=14, total_orders=200),
        ]
        db.add_all(suppliers)
        db.flush()
        print(f"  ✅ Created {len(suppliers)} suppliers")

        # ── Raw Materials ──────────────────────────────────────────────────
        materials = [
            RawMaterial(code="RM001", name="Full Grain Cowhide - Brown", leather_type="Full Grain", color="Brown", thickness=1.5, grade="A", unit="sqft", unit_price=3.50, supplier_id=suppliers[0].id, warehouse_id=warehouses[0].id, current_stock=850, minimum_stock=100, maximum_stock=2000, reorder_point=200, batch_number="BATCH-2024-001"),
            RawMaterial(code="RM002", name="Top Grain Lambskin - Black", leather_type="Top Grain", color="Black", thickness=0.8, grade="premium", unit="sqft", unit_price=8.20, supplier_id=suppliers[2].id, warehouse_id=warehouses[0].id, current_stock=320, minimum_stock=50, maximum_stock=800, reorder_point=100, batch_number="BATCH-2024-002"),
            RawMaterial(code="RM003", name="Split Leather - Tan", leather_type="Split", color="Tan", thickness=2.0, grade="B", unit="sqft", unit_price=1.80, supplier_id=suppliers[1].id, warehouse_id=warehouses[0].id, current_stock=1200, minimum_stock=200, maximum_stock=3000, reorder_point=400, batch_number="BATCH-2024-003"),
            RawMaterial(code="RM004", name="Nubuck Suede - Navy", leather_type="Nubuck", color="Navy Blue", thickness=1.0, grade="A", unit="sqft", unit_price=5.60, supplier_id=suppliers[0].id, warehouse_id=warehouses[0].id, current_stock=45, minimum_stock=80, maximum_stock=600, reorder_point=100, batch_number="BATCH-2024-004"),
            RawMaterial(code="RM005", name="Patent Leather - Red", leather_type="Patent", color="Red", thickness=0.7, grade="premium", unit="sqft", unit_price=12.50, supplier_id=suppliers[2].id, warehouse_id=warehouses[0].id, current_stock=180, minimum_stock=30, maximum_stock=400, reorder_point=60, batch_number="BATCH-2024-005"),
            RawMaterial(code="RM006", name="YKK Zippers - Gold", leather_type=None, color="Gold", thickness=None, grade="premium", unit="piece", unit_price=0.85, supplier_id=suppliers[1].id, warehouse_id=warehouses[1].id, current_stock=2500, minimum_stock=500, maximum_stock=10000, reorder_point=1000, batch_number="BATCH-2024-006"),
            RawMaterial(code="RM007", name="Metal Buckles - Antique", leather_type=None, color="Antique Brass", thickness=None, grade="A", unit="piece", unit_price=0.45, supplier_id=suppliers[1].id, warehouse_id=warehouses[1].id, current_stock=3200, minimum_stock=500, maximum_stock=10000, reorder_point=1000, batch_number="BATCH-2024-007"),
            RawMaterial(code="RM008", name="Satin Thread - Beige", leather_type=None, color="Beige", thickness=None, grade="A", unit="meter", unit_price=0.12, supplier_id=suppliers[3].id, warehouse_id=warehouses[1].id, current_stock=15000, minimum_stock=2000, maximum_stock=50000, reorder_point=5000, batch_number="BATCH-2024-008"),
        ]
        db.add_all(materials)
        db.flush()
        print(f"  ✅ Created {len(materials)} raw materials")

        # ── Products ───────────────────────────────────────────────────────
        products = [
            Product(sku="LF-PROD-0001", name="Executive Leather Briefcase", category="bag", description="Premium full-grain leather briefcase for executives", unit="piece", selling_price=299.99, weight=1200),
            Product(sku="LF-PROD-0002", name="Slim Cardholder Wallet", category="wallet", description="Minimalist top-grain leather card holder", unit="piece", selling_price=49.99, weight=80),
            Product(sku="LF-PROD-0003", name="Classic Leather Belt - 35mm", category="belt", description="Handcrafted full-grain leather dress belt", unit="piece", selling_price=79.99, weight=200),
            Product(sku="LF-PROD-0004", name="Leather Tote Bag - Large", category="bag", description="Spacious everyday tote in premium leather", unit="piece", selling_price=189.99, weight=900),
            Product(sku="LF-PROD-0005", name="Oxford Leather Shoes", category="shoe", description="Classic Oxford-style premium leather shoes", unit="pair", selling_price=249.99, weight=800),
            Product(sku="LF-PROD-0006", name="Bifold Wallet - Brown", category="wallet", description="Traditional bifold wallet with multiple card slots", unit="piece", selling_price=59.99, weight=100),
        ]
        db.add_all(products)
        db.flush()
        print(f"  ✅ Created {len(products)} products")

        # ── Product Costings ───────────────────────────────────────────────
        costing_data = [
            (products[0], 85.0, 25.0, 40.0, 15.0, 8.0, 20.0, 12.0, 18.0, 18.0),
            (products[1], 8.0, 3.0, 5.0, 2.0, 1.0, 3.0, 1.5, 2.0, 20.0),
            (products[2], 12.0, 5.0, 8.0, 3.0, 1.5, 4.0, 2.0, 3.0, 22.0),
            (products[3], 55.0, 18.0, 30.0, 10.0, 5.0, 15.0, 8.0, 12.0, 20.0),
        ]
        for p, lc, ac, lab, mc, ec, oc, pkc, tc, margin in costing_data:
            base = lc + ac + lab + mc + ec + oc + pkc + tc
            tax_pct = 5.0
            tax = base * tax_pct / 100
            total = base + tax
            profit = total * margin / 100
            selling = total + profit
            db.add(ProductCosting(
                product_id=p.id, leather_cost=lc, accessories_cost=ac, labor_cost=lab,
                machine_cost=mc, electricity_cost=ec, overhead_cost=oc,
                packaging_cost=pkc, transportation_cost=tc,
                tax_percentage=tax_pct, tax_amount=round(tax, 2),
                profit_margin_percentage=margin, profit_amount=round(profit, 2),
                total_production_cost=round(total, 2), selling_price=round(selling, 2),
                profitability=round((profit / selling * 100) if selling else 0, 2),
                is_approved=True
            ))
        db.flush()
        print("  ✅ Created product costings")

        # ── Customers ──────────────────────────────────────────────────────
        customers = [
            Customer(code="CUST0001", name="John Smith", company="Smith Retail Group", email="john@smithretail.com", phone="+1-212-555-0101", country="USA", city="New York", credit_limit=50000, total_orders=45, total_revenue=125000, is_export_customer=True),
            Customer(code="CUST0002", name="Emma Johnson", company="London Leather House", email="emma@llh.co.uk", phone="+44-20-7946-0101", country="UK", city="London", credit_limit=35000, total_orders=28, total_revenue=87500, is_export_customer=True),
            Customer(code="CUST0003", name="Raj Patel", company="Fashion Forward India", email="raj@ffindia.com", phone="+91-98765-43210", country="India", city="Mumbai", credit_limit=20000, total_orders=67, total_revenue=52000, is_export_customer=False),
            Customer(code="CUST0004", name="Sophie Dubois", company="Paris Mode", email="sophie@parismode.fr", phone="+33-1-4444-5555", country="France", city="Paris", credit_limit=80000, total_orders=18, total_revenue=198000, is_export_customer=True),
        ]
        db.add_all(customers)
        db.flush()
        print(f"  ✅ Created {len(customers)} customers")

        # ── Orders ─────────────────────────────────────────────────────────
        orders_data = []
        for i in range(12):
            cust = random.choice(customers)
            total = round(random.uniform(5000, 50000), 2)
            order = Order(
                order_number=f"SO-{datetime.utcnow().strftime('%Y%m%d')}-{str(i+1).zfill(4)}",
                order_type=OrderType.sales,
                status=random.choice([OrderStatus.confirmed, OrderStatus.processing, OrderStatus.shipped, OrderStatus.delivered]),
                customer_id=cust.id,
                order_date=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
                expected_delivery=datetime.utcnow() + timedelta(days=random.randint(7, 45)),
                subtotal=total * 0.9,
                tax=total * 0.1,
                total_amount=total,
                payment_status=random.choice([PaymentStatus.paid, PaymentStatus.partial, PaymentStatus.pending]),
                paid_amount=total if random.random() > 0.4 else total * random.uniform(0.3, 0.8),
                currency="USD",
                created_by=users[0].id
            )
            orders_data.append(order)
        db.add_all(orders_data)
        db.flush()
        print(f"  ✅ Created {len(orders_data)} sales orders")

        # ── Production Orders ──────────────────────────────────────────────
        statuses = [ProductionStatus.pending, ProductionStatus.in_progress, ProductionStatus.cutting, ProductionStatus.completed, ProductionStatus.delayed]
        prod_orders = []
        for i, product in enumerate(products[:5]):
            po = ProductionOrder(
                order_number=f"PO-{datetime.utcnow().strftime('%Y%m%d')}-{str(i+1).zfill(4)}",
                product_id=product.id,
                quantity=random.randint(50, 500),
                status=statuses[i % len(statuses)],
                priority=random.choice(["low", "normal", "high", "urgent"]),
                start_date=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                expected_end_date=datetime.utcnow() + timedelta(days=random.randint(5, 30)),
                delay_probability=random.uniform(0, 0.8),
                assigned_manager=users[1].id
            )
            prod_orders.append(po)
        db.add_all(prod_orders)
        db.flush()
        print(f"  ✅ Created {len(prod_orders)} production orders")

        # ── Notifications ──────────────────────────────────────────────────
        notifs = [
            Notification(user_id=users[0].id, title="Low Stock Alert", message="Full Grain Cowhide - Nubuck Suede has fallen below reorder point", type="warning"),
            Notification(user_id=users[0].id, title="New Order Received", message="Order SO-001 from Smith Retail Group for $12,500", type="success"),
            Notification(user_id=users[0].id, title="Production Delay Risk", message="PO-003 has 75% delay probability - immediate attention needed", type="danger"),
            Notification(user_id=users[0].id, title="AI Model Updated", message="Cost prediction model retrained with 94% accuracy", type="info"),
        ]
        db.add_all(notifs)

        # ── Activity Logs ──────────────────────────────────────────────────
        activities = [
            ActivityLog(user_id=users[0].id, action="System initialized and database seeded", module="System"),
            ActivityLog(user_id=users[1].id, action="Created production order PO-001 for Executive Briefcase", module="Production"),
            ActivityLog(user_id=users[4].id, action="Stock adjustment: Added 500 sqft Full Grain Cowhide", module="Inventory"),
            ActivityLog(user_id=users[2].id, action="Generated monthly P&L report for April 2024", module="Reports"),
            ActivityLog(user_id=users[0].id, action="AI cost model trained with 100 historical records", module="AI"),
        ]
        db.add_all(activities)

        db.commit()
        print("\n🎉 Database seeded successfully!")
        print("\n📊 Login Credentials:")
        print("  Super Admin:  admin@leatherpro.com      / admin123")
        print("  Manager:      manager@leatherpro.com    / manager123")
        print("  Accountant:   accountant@leatherpro.com / accountant123")
        print("  Production:   production@leatherpro.com / production123")
        print("  Inventory:    inventory@leatherpro.com  / inventory123")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
