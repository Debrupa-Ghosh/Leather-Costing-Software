import sqlite3
import random
from datetime import datetime, timedelta

def add_mock_data():
    conn = sqlite3.connect('backend/leatherflow_erp.db')
    cursor = conn.cursor()

    try:
        # Get some valid customer and product IDs
        cursor.execute("SELECT id FROM customers")
        customer_ids = [row[0] for row in cursor.fetchall()]
        
        # If no customers, just use a dummy id 1
        if not customer_ids:
            customer_ids = [1]

        # Insert 50 new random orders
        now = datetime.utcnow()
        for i in range(50):
            customer_id = random.choice(customer_ids)
            total_amount = round(random.uniform(500, 15000), 2)
            status = random.choice(["confirmed", "processing", "completed"])
            payment_status = random.choice(["pending", "paid", "partial"])
            
            # Scatter created dates over the last 30 days
            created_at = (now - timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute("""
                INSERT INTO orders (customer_id, order_type, total_amount, status, payment_status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (customer_id, "sales", total_amount, status, payment_status, created_at, created_at))
            
            # Let's also add some production orders to bump those stats
            if status in ["processing", "completed"]:
                order_id = cursor.lastrowid
                prod_status = "completed" if status == "completed" else random.choice(["pending", "in_progress", "cutting"])
                cursor.execute("""
                    INSERT INTO production_orders (order_id, status, priority, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (order_id, prod_status, random.choice(["normal", "urgent"]), created_at, created_at))

        conn.commit()
        print("✅ Successfully added 50 new orders and related production data!")
        
    except Exception as e:
        print(f"❌ Error adding data: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_mock_data()
