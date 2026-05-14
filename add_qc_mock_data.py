import sqlite3
import random
from datetime import datetime, timedelta
import json

def add_qc_mock_data():
    conn = sqlite3.connect('backend/leatherflow_erp.db')
    cursor = conn.cursor()

    try:
        # Get some production order IDs
        cursor.execute("SELECT id FROM production_orders")
        prod_orders = [row[0] for row in cursor.fetchall()]
        
        # Get some product IDs
        cursor.execute("SELECT id FROM products")
        products = [row[0] for row in cursor.fetchall()]

        if not prod_orders or not products:
            print("No production orders or products found to attach QC to. Add some base data first.")
            return

        now = datetime.utcnow()
        
        statuses = ["passed", "failed", "conditional", "pending"]
        defect_types = ["Scratch mark", "Poor stitching", "Color mismatch", "Leather wrinkle", "Hardware missing"]
        severities = ["minor", "major", "critical"]
        actions = ["Reworked", "Scrapped", "Accepted conditionally", "Sent for review"]

        for i in range(1, 16):
            qc_number = f"QC{str(i).zfill(5)}"
            prod_order_id = random.choice(prod_orders)
            product_id = random.choice(products)
            
            qty_inspected = random.randint(50, 500)
            status = random.choice(statuses)
            
            if status == "passed":
                qty_passed = qty_inspected
                qty_failed = 0
                defect_count = 0
            elif status == "pending":
                qty_passed = 0
                qty_failed = 0
                defect_count = 0
            else:
                qty_failed = random.randint(1, int(qty_inspected * 0.1) + 1)
                qty_passed = qty_inspected - qty_failed
                defect_count = random.randint(1, 3)

            remarks = f"Routine inspection {qc_number}"
            created_at = (now - timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d %H:%M:%S")

            cursor.execute("""
                INSERT INTO quality_checks (
                    check_number, production_order_id, product_id, inspector_id, 
                    quantity_inspected, quantity_passed, quantity_failed, status, 
                    remarks, inspection_date, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (qc_number, prod_order_id, product_id, 1, qty_inspected, qty_passed, qty_failed, status, remarks, created_at, created_at, created_at))
            
            qc_id = cursor.lastrowid
            
            for _ in range(defect_count):
                dtype = random.choice(defect_types)
                sev = random.choice(severities)
                dq = random.randint(1, max(1, qty_failed // defect_count))
                desc = f"Found {dtype.lower()} during inspection"
                action = random.choice(actions)
                
                cursor.execute("""
                    INSERT INTO defects (
                        quality_check_id, defect_type, severity, quantity, 
                        description, action_taken, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (qc_id, dtype, sev, dq, desc, action, created_at))

        conn.commit()
        print("Successfully added 15 mock quality checks and related defects!")
        
    except Exception as e:
        print(f"Error adding QC data: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_qc_mock_data()
