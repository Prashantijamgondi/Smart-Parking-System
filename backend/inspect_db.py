import sqlite3

db_path = "parking_system.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 50)
print("DATABASE SCHEMA")
print("=" * 50)
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table';")
for row in cursor.fetchall():
    print(row[0])
    print()

print("\n" + "=" * 50)
print("SLOTS TABLE")
print("=" * 50)
cursor.execute("SELECT * FROM slots;")
for row in cursor.fetchall():
    print(row)

print("\n" + "=" * 50)
print("PARKING HISTORY (Last 5)")
print("=" * 50)
cursor.execute("SELECT * FROM parking_history ORDER BY created_at DESC LIMIT 5;")
for row in cursor.fetchall():
    print(row)

conn.close()
