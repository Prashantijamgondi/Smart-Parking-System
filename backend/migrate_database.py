"""
Database Migration Script - Add arrival_time column
"""
import sqlite3

def migrate_database():
    conn = sqlite3.connect("parking_system.db")
    cursor = conn.cursor()
    
    print("Starting database migration...")
    
    # Check if arrival_time column exists in slots table
    cursor.execute("PRAGMA table_info(slots)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'arrival_time' not in columns:
        print("Adding arrival_time column to slots table...")
        cursor.execute('''
            ALTER TABLE slots 
            ADD COLUMN arrival_time INTEGER
        ''')
        conn.commit()
        print("✅ arrival_time column added successfully!")
    else:
        print("✅ arrival_time column already exists. No migration needed.")
    
    # Also check payment_status in parking_history
    cursor.execute("PRAGMA table_info(parking_history)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'payment_status' not in columns:
        print("Adding payment_status column to parking_history table...")
        cursor.execute('''
            ALTER TABLE parking_history 
            ADD COLUMN payment_status TEXT DEFAULT 'PENDING'
        ''')
        cursor.execute('''
            UPDATE parking_history 
            SET payment_status = 'PAID'
            WHERE payment_status IS NULL
        ''')
        conn.commit()
        print("✅ payment_status column added successfully!")
    else:
        print("✅ payment_status column already exists.")
    
    conn.close()
    print("\n✅ All migrations completed!")

if __name__ == "__main__":
    migrate_database()
