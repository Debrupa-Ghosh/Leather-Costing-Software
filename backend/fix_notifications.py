import sqlite3

conn = sqlite3.connect('leatherflow_erp.db')
c = conn.cursor()

# Update notification 1 - Low stock: Nubuck Suede - Navy (id=4, stock=45, min=80)
c.execute(
    "UPDATE notifications SET message = ? WHERE id = 1",
    ("Nubuck Suede - Navy (RM004) stock at 45 sqft, below minimum 80 sqft",)
)

# Update notification 2 - Use actual sales order number
c.execute(
    "UPDATE notifications SET message = ? WHERE id = 2",
    ("Order SO-20260508-0001 from Smith Retail Group for $9,418.44",)
)

# Update notification 3 - Use actual production order with delay
c.execute(
    "UPDATE notifications SET message = ? WHERE id = 3",
    ("PO-20260508-0003 has 44% delay probability - immediate attention needed",)
)

conn.commit()

c.execute("SELECT id, title, message FROM notifications")
for r in c.fetchall():
    print(r)

conn.close()
print("\nNotifications updated successfully!")
