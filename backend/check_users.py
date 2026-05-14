import sqlite3

def check_users():
    conn = sqlite3.connect('leatherflow_erp.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, full_name, email, hashed_password FROM users")
    users = cursor.fetchall()
    print(f"Found {len(users)} users:")
    for user in users:
        print(f"ID: {user[0]}, Name: {user[1]}, Email: {user[2]}, Hash: {user[3]}")
    conn.close()

if __name__ == "__main__":
    check_users()
