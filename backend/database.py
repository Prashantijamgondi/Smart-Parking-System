import sqlite3
from datetime import datetime
import json
import time

class Database:
    def __init__(self, db_name="parking_system.db"):
        self.db_name = db_name
        self.init_db()
    
    def get_connection(self):
        return sqlite3.connect(self.db_name)
    
    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Slots table with arrival_time
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS slots (
                slot_id INTEGER PRIMARY KEY,
                is_occupied INTEGER DEFAULT 0,
                is_reserved INTEGER DEFAULT 0,
                vehicle_number TEXT,
                entry_time INTEGER,
                user_email TEXT,
                user_phone TEXT,
                arrival_time INTEGER,
                reserved_duration REAL DEFAULT 0
            )
        ''')
        
        # Migration: Add reserved_duration column if not exists
        try:
            cursor.execute('ALTER TABLE slots ADD COLUMN reserved_duration REAL DEFAULT 0')
        except sqlite3.OperationalError:
            pass # Column likely exists
        
        # Parking history table with payment_status
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS parking_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slot_id INTEGER,
                vehicle_number TEXT,
                entry_time INTEGER,
                exit_time INTEGER,
                duration_minutes INTEGER,
                total_amount REAL,
                user_email TEXT,
                user_phone TEXT,
                payment_status TEXT DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Initialize 3 slots if not exists
        for slot_id in [1, 2, 3]:
            cursor.execute('''
                INSERT OR IGNORE INTO slots (slot_id, is_occupied, is_reserved)
                VALUES (?, 0, 0)
            ''', (slot_id,))
        
        conn.commit()
        conn.close()
    
    def get_slot(self, slot_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM slots WHERE slot_id = ?', (slot_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'slot_id': row[0],
                'is_occupied': row[1],
                'is_reserved': row[2],
                'vehicle_number': row[3],
                'entry_time': row[4],
                'user_email': row[5],
                'user_phone': row[6],
                'arrival_time': row[7] if len(row) > 7 else None,
                'reserved_duration': row[8] if len(row) > 8 else 0
            }
        return None
    
    def get_all_slots(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM slots')
        rows = cursor.fetchall()
        conn.close()
        
        slots = []
        for row in rows:
            slots.append({
                'slot_id': row[0],
                'is_occupied': row[1],
                'is_reserved': row[2],
                'vehicle_number': row[3],
                'entry_time': row[4],
                'user_email': row[5],
                'user_phone': row[6],
                'arrival_time': row[7] if len(row) > 7 else None,
                'reserved_duration': row[8] if len(row) > 8 else 0
            })
        return slots
    
    def reserve_slot(self, slot_id, user_email, user_phone, vehicle_number, arrival_time=None, duration_hours=0):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE slots 
            SET is_reserved = 1, user_email = ?, user_phone = ?, vehicle_number = ?, arrival_time = ?, reserved_duration = ?
            WHERE slot_id = ? AND is_occupied = 0 AND is_reserved = 0
        ''', (user_email, user_phone, vehicle_number, arrival_time, duration_hours, slot_id))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def cancel_reservation(self, slot_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get reservation details first to calculate bill
        cursor.execute('SELECT user_email, user_phone, vehicle_number, reserved_duration FROM slots WHERE slot_id = ?', (slot_id,))
        row = cursor.fetchone()
        billing = None
        
        if row and row[3] > 0: # If duration reserved > 0
            reserved_hours = row[3]
            vehicle_number = row[2]
            user_email = row[0]
            user_phone = row[1]
            
            # Calculate cancellation fee (same as if they parked for that duration)
            # Rate: 50 per 30s is crazy high for reservation? 
            # Assuming hourly rate for reservation is more standard or using same rate?
            # User said: "if the user reserved for one hour then payment should be show"
            # Current rate: 50 per 30 SECONDS = 100/min = 6000/hour. This is very high.
            # Assuming specific rate for reservation/cancellation bill.
            # Let's assume hourly rate = 100 Rs fixed, OR stick to dynamic.
            # If dynamic: 1 hour = 60 mins = 3600 secs = 120 intervals * 50 = 6000 Rs.
            # I will assume standard high rate unless specified. 
            # Actually, let's use a "Reservation Fee" logic. 
            # maybe base_charge (30) + (duration_hours * 60 mins * something reasonable?)
            # Let's use 100 Rs / hour for reservation fee to be sane.
            reservation_rate_per_hour = 100.0
            total_amount = 30.0 + (reserved_hours * reservation_rate_per_hour)
            
            billing = {
                'slot_id': slot_id,
                'vehicle_number': vehicle_number,
                'entry_time': int(time.time()), # Virtual entry
                'exit_time': int(time.time()),   # Virtual exit
                'duration_minutes': int(reserved_hours * 60),
                'base_charge': 30.0,
                'minute_charge': reserved_hours * reservation_rate_per_hour,
                'total_amount': total_amount,
                'user_email': user_email,
                'user_phone': user_phone
            }
            
            # Save as PENDING payment
            cursor.execute('''
                INSERT INTO parking_history 
                (slot_id, vehicle_number, entry_time, exit_time, duration_minutes, total_amount, user_email, user_phone, payment_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (slot_id, vehicle_number, int(time.time()), int(time.time()), int(reserved_hours * 60), total_amount, user_email, user_phone, 'PENDING'))

        cursor.execute('''
            UPDATE slots 
            SET is_reserved = 0, user_email = NULL, user_phone = NULL, vehicle_number = NULL, arrival_time = NULL, reserved_duration = 0
            WHERE slot_id = ?
        ''', (slot_id,))
        conn.commit()
        conn.close()
        return billing
    
    def cancel_expired_reservations(self):
        """Cancel reservations where arrival_time has passed"""
        conn = self.get_connection()
        cursor = conn.cursor()
        current_time = int(time.time())
        
        cursor.execute('''
            UPDATE slots 
            SET is_reserved = 0, user_email = NULL, user_phone = NULL, vehicle_number = NULL, arrival_time = NULL
            WHERE is_reserved = 1 AND arrival_time IS NOT NULL AND arrival_time < ?
        ''', (current_time,))
        
        cancelled_count = cursor.rowcount
        conn.commit()
        conn.close()
        return cancelled_count
    
    def occupy_slot(self, slot_id, entry_time):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE slots 
            SET is_occupied = 1, entry_time = ?
            WHERE slot_id = ?
        ''', (entry_time, slot_id))
        conn.commit()
        conn.close()
        
    def vacate_slot(self, slot_id: int, exit_time: int):
        """Vacate slot with real-time pricing: ₹30 base + ₹50 per 30 seconds"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        # Get slot info
        cursor.execute('''
            SELECT entry_time, vehicle_number, user_email, user_phone 
            FROM slots WHERE slot_id = ? AND is_occupied = 1
        ''', (slot_id,))
        
        slot = cursor.fetchone()
        if not slot:
            conn.close()
            return None
        
        entry_time, vehicle_number, user_email, user_phone = slot
        
        # Calculate duration in minutes
        duration_seconds = exit_time - entry_time
        duration_minutes = duration_seconds / 60
        
        # Real-time pricing: ₹30 base + ₹50 per 30 seconds
        base_charge = 30.0
        rate_per_30_seconds = 50.0
        
        # Calculate number of 30-second intervals
        intervals_30_sec = duration_seconds / 30
        minute_charge = intervals_30_sec * rate_per_30_seconds
        
        total_amount = base_charge + minute_charge
        
        # Update slot
        cursor.execute('''
            UPDATE slots 
            SET is_occupied = 0, is_reserved = 0, entry_time = NULL,
                user_email = NULL, user_phone = NULL, vehicle_number = NULL, arrival_time = NULL
            WHERE slot_id = ?
        ''', (slot_id,))
        
        # Save to history with PENDING payment status
        cursor.execute('''
            INSERT INTO parking_history 
            (slot_id, vehicle_number, entry_time, exit_time, duration_minutes, total_amount, user_email, user_phone, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (slot_id, vehicle_number, entry_time, exit_time, duration_minutes, total_amount, user_email, user_phone, 'PENDING'))
        
        conn.commit()
        conn.close()
        
        return {
            'slot_id': slot_id,
            'vehicle_number': vehicle_number,
            'entry_time': entry_time,
            'exit_time': exit_time,
            'duration_minutes': int(duration_minutes),
            'base_charge': base_charge,
            'minute_charge': minute_charge,
            'total_amount': total_amount,
            'user_email': user_email,
            'user_phone': user_phone
        }
    
    def update_occupied_slot_details(self, slot_id, user_email, user_phone, vehicle_number):
        """Update occupied slot with user details for payment"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE slots
            SET user_email = ?, user_phone = ?, vehicle_number = ?
            WHERE slot_id = ? AND is_occupied = 1
        ''', (user_email, user_phone, vehicle_number, slot_id))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def get_parking_history(self, limit=50):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM parking_history 
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                'id': row[0],
                'slot_id': row[1],
                'vehicle_number': row[2],
                'entry_time': row[3],
                'exit_time': row[4],
                'duration_minutes': row[5],
                'total_amount': row[6],
                'user_email': row[7],
                'user_phone': row[8],
                'payment_status': row[9] if len(row) > 9 else 'PENDING',
                'created_at': row[10] if len(row) > 10 else None
            })
        return history
    
    def reset_all_slots(self):
        """Reset all slots to empty state - for database cleanup"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE slots 
            SET is_occupied = 0, is_reserved = 0, vehicle_number = NULL,
                entry_time = NULL, user_email = NULL, user_phone = NULL, arrival_time = NULL
        ''')
        conn.commit()
        conn.close()
    
    def mark_payment_paid(self, history_id):
        """Mark a payment as PAID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE parking_history 
            SET payment_status = 'PAID'
            WHERE id = ?
        ''', (history_id,))
        conn.commit()
        conn.close()
    
    def get_pending_payments(self):
        """Get all pending payments"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM parking_history 
            WHERE payment_status = 'PENDING'
            ORDER BY created_at DESC
        ''')
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                'id': row[0],
                'slot_id': row[1],
                'vehicle_number': row[2],
                'entry_time': row[3],
                'exit_time': row[4],
                'duration_minutes': row[5],
                'total_amount': row[6],
                'user_email': row[7],
                'user_phone': row[8],
                'payment_status': row[9],
                'created_at': row[10]
            })
        return history
    
    def get_revenue_stats(self):
        """Get total revenue statistics"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Calculate total revenue from PAID sessions
        cursor.execute('''
            SELECT SUM(total_amount), COUNT(*) 
            FROM parking_history 
            WHERE payment_status = 'PAID'
        ''')
        row = cursor.fetchone()
        conn.close()
        
        total_revenue = row[0] if row[0] else 0.0
        total_sessions = row[1] if row[1] else 0
        
        return {
            "total_revenue": total_revenue,
            "total_sessions": total_sessions
        }
    
    def clear_history(self):
        """Clear all parking history"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM parking_history')
        # Also reset sequence if desired, but not strictly necessary for history ID
        # cursor.execute("DELETE FROM sqlite_sequence WHERE name='parking_history'")
        conn.commit()
        conn.close()