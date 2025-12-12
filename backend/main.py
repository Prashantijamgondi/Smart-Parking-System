from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import SlotCancellation
from database import Database
from blynk_manager import BlynkManager
from whatsapp_service import WhatsAppService
from email_service import EmailService
import time
import os
import threading
from typing import List, Optional
from dotenv import load_dotenv
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Load environment variables
load_dotenv()

app = FastAPI(title="Smart Parking System API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
db = Database()

# Configure Blynk
BLYNK_AUTH_TOKEN = os.getenv("BLYNK_AUTH_TOKEN")
if not BLYNK_AUTH_TOKEN:
    print("⚠️  WARNING: BLYNK_AUTH_TOKEN not found!")
    BLYNK_AUTH_TOKEN = "YOUR_BLYNK_TOKEN"
else:
    print(f"✓ Blynk token loaded: {BLYNK_AUTH_TOKEN[:10]}...")

blynk = BlynkManager(BLYNK_AUTH_TOKEN)

# Configure WhatsApp
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
WHATSAPP_FROM = "whatsapp:+14155238886"  # Default Twilio Sandbox Number

whatsapp_service = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    whatsapp_service = WhatsAppService(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, WHATSAPP_FROM)
    print("✓ WhatsApp service initialized")
else:
    print("⚠️  WhatsApp credentials not found")

# Configure Email Service
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465 # using SSL

email_service = None
if EMAIL_SENDER and EMAIL_PASSWORD:
    email_service = EmailService(SMTP_SERVER, SMTP_PORT, EMAIL_SENDER, EMAIL_PASSWORD)
    print("✓ Email service initialized")
else:
    print("⚠️  Email credentials not found")


# ============= BACKGROUND SYNC THREAD =============
def sync_blynk_slots():
    """Background thread to sync slots from Blynk every 2 seconds"""
    print("🚀 Background Sync Thread Started")
    while True:
        try:
            # Fetch statuses from Blynk (Hardware/Cloud)
            blynk_slots = blynk.get_all_slots_status()
            
            # Fetch local DB state
            db_slots = db.get_all_slots()
            
            for b_slot in blynk_slots:
                slot_id = b_slot['slot_id']
                is_occupied_blynk = b_slot['is_occupied']
                
                # Find corresponding DB slot
                db_slot = next((s for s in db_slots if s['slot_id'] == slot_id), None)
                
                if db_slot:
                    # Case 1: Detect Arrival (Blynk: Occupied, DB: Empty)
                    if is_occupied_blynk and not db_slot['is_occupied']:
                        print(f"🚗 [Sync] Slot {slot_id} Detected Vehicle via Sensor")
                        entry_time = int(time.time())
                        db.occupy_slot(slot_id, entry_time)
                    
                    # Case 2: Detect Departure (Blynk: Empty, DB: Occupied) -> IGNORE HERE
                    # We do NOT auto-vacate on sensor clear because we need to generate BILL/Payment.
                    # Vacating is done via API (Payment) or Manual Vacate.
                    # HOWEVER, if it was just a glitch or unbilled, we might want to flag it? 
                    # For now, we trust the Payment/Vacate flow. 
                    # NOTE: Existing logic in `api/sync-from-blynk` had this, but for safety in background
                    # we only occupy. Vacating implies Billing which requires user interaction usually.
                    
                    # Optional: We could update 'is_occupied' purely for display if we wanted to show "Car Left but Not Paid"
                    # But that complicates state. Let's stick to reliable Occupancy detection.

        except Exception as e:
            print(f"⚠️ Sync Error: {e}")
        
        time.sleep(2)  # Wait 2 seconds before next poll

# Start the background thread
sync_thread = threading.Thread(target=sync_blynk_slots, daemon=True)
sync_thread.start()


# ============= ROUTES =============

@app.get("/")
async def root():
    return {
        "message": "Smart Parking System API", 
        "status": "running",
        "version": "3.0 - Optimized"
    }

# ============= MODELS =============

class EmailReceipt(BaseModel):
    to_email: str
    slot_number: str
    vehicle_number: str
    entry_time: str
    exit_time: str
    duration_minutes: int
    base_charge: float
    minute_charge: float
    total_amount: float

class SlotReservation(BaseModel):
    slot_id: int
    user_email: str
    user_phone: str
    vehicle_number: str
    arrival_time: Optional[int] = None  # Unix timestamp
    duration_hours: Optional[float] = 0  # Duration in hours

class PayBillRequest(BaseModel):
    user_email: str
    user_phone: str
    vehicle_number: str

class UnknownVehicleExit(BaseModel):
    user_email: str
    vehicle_number: str

class SlotCancellation(BaseModel):
    slot_id: int
    email_id: str

# ============= EMAIL ENDPOINT =============

@app.post("/api/send-receipt")
async def send_receipt(receipt: EmailReceipt):
    """Send parking receipt via email"""
    try:
        sender_email = os.getenv("EMAIL_SENDER")
        sender_password = os.getenv("EMAIL_PASSWORD")
        
        if not sender_email or not sender_password:
            return {
                "success": False, 
                "message": "Email service not configured"
            }
        
        message = MIMEMultipart("alternative")
        message["Subject"] = f"🚗 Parking Receipt - {receipt.vehicle_number}"
        message["From"] = f"Smart Parking System <{sender_email}>"
        message["To"] = receipt.to_email
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial; background: #f3f4f6;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px; text-align: center; color: white;">
                    <h1>🚗 Parking Receipt</h1>
                </div>
                <div style="padding: 30px;">
                    <h2>Parking Details</h2>
                    <p><strong>Slot:</strong> {receipt.slot_number}</p>
                    <p><strong>Vehicle:</strong> {receipt.vehicle_number}</p>
                    <p><strong>Entry:</strong> {receipt.entry_time}</p>
                    <p><strong>Exit:</strong> {receipt.exit_time}</p>
                    <p><strong>Duration:</strong> {receipt.duration_minutes} minutes</p>
                    <hr>
                    <h2>Billing</h2>
                    <p><strong>Base Charge:</strong> ₹{receipt.base_charge:.2f}</p>
                    <p><strong>Minute Charge:</strong> ₹{receipt.minute_charge:.2f}</p>
                    <h1 style="color: #10b981;">Total: ₹{receipt.total_amount:.2f}</h1>
                </div>
            </div>
        </body>
        </html>
        """
        
        message.attach(MIMEText(html_body, "html"))
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receipt.to_email, message.as_string())
        
        return {"success": True, "message": "Receipt sent successfully"}
    
    except Exception as e:
        print(f"❌ Email error: {e}")
        # Only return error if critical, otherwise log and continue
        return {"success": False, "message": str(e)}


# ============= SLOT ENDPOINTS =============

@app.get("/api/slots")
async def get_all_slots():
    """Get all parking slots - OPTIMIZED: READS DB ONLY"""
    try:
        # Auto-cancel expired reservations
        db.cancel_expired_reservations()
        
        # READ FROM DB ONLY - The Background Thread handles Sync!
        slots = db.get_all_slots()
        
        return slots
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/slots/{slot_id}")
async def get_slot(slot_id: int):
    """Get specific slot"""
    if slot_id not in [1, 2, 3]:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    try:
        slot = db.get_slot(slot_id)
        # We can also trust DB here, no need to poll Blynk individually
        return slot
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/slots/reserve")
async def reserve_slot(reservation: SlotReservation):
    """Reserve a parking slot"""
    if reservation.slot_id not in [1, 2, 3]:
        raise HTTPException(status_code=404, detail="Invalid slot ID")
    
    try:
        # Validate arrival_time is not in the past
        if reservation.arrival_time:
            current_time = int(time.time())
            if reservation.arrival_time < current_time:
                raise HTTPException(status_code=400, detail="Cannot reserve slot for past time")
        
        slot = db.get_slot(reservation.slot_id)
        # Check DB first
        if slot['is_occupied'] or slot['is_reserved']:
            raise HTTPException(status_code=400, detail="Slot is not available")
        
        # Reserve with arrival_time
        success = db.reserve_slot(
            reservation.slot_id,
            reservation.user_email,
            reservation.user_phone,
            reservation.vehicle_number,
            reservation.arrival_time,
            reservation.duration_hours
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to reserve slot (Occupied/Reserved)")
        
        # Fire and forget Blynk update (or wait if critical)
        try:
            blynk.set_slot_reservation(reservation.slot_id, True)
            blynk.log_event(f"Slot {reservation.slot_id} reserved by {reservation.vehicle_number}")
        except:
            pass # Don't fail reservation if Blynk is flaky
        
        # Send WhatsApp confirmation
        if whatsapp_service:
            whatsapp_service.send_reservation_message(
                reservation.user_phone, 
                reservation.slot_id, 
                reservation.vehicle_number
            )
            
        # Send Email confirmation
        if email_service:
            email_service.send_reservation_email(
                reservation.user_email,
                reservation.slot_id,
                reservation.vehicle_number
            )
        
        return {
            "success": True,
            "message": "Slot reserved successfully",
            "slot_id": reservation.slot_id,
            "vehicle_number": reservation.vehicle_number,
            "user_email": reservation.user_email,
            "arrival_time": reservation.arrival_time,
            "duration_hours": reservation.duration_hours
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/slots/cancel")
async def cancel_reservation(cancellation: SlotCancellation):
    """Cancel slot reservation"""
    if cancellation.slot_id not in [1, 2, 3]:
        raise HTTPException(status_code=404, detail="Invalid slot ID")
    
    try:
        slot = db.get_slot(cancellation.slot_id)
        
        if not slot['is_reserved']:
            raise HTTPException(status_code=400, detail="Slot is not reserved")
        
        # Verify email
        if slot.get('user_email') and slot['user_email'] != cancellation.email_id:
            raise HTTPException(status_code=403, detail="Email does not match reservation")
        
        # Cancel in database
        billing = db.cancel_reservation(cancellation.slot_id)
        
        # Update Blynk
        try:
            blynk.set_slot_reservation(cancellation.slot_id, False)
        except:
            pass
        
        message = "Reservation cancelled successfully"
        
        if billing:
            message = "Reservation cancelled and bill generated"
            try:
                blynk.log_event(f"Slot {cancellation.slot_id} cancelled & billed: ₹{billing['total_amount']}")
            except: pass
            
            # Send Billing Email
            if email_service and billing.get('user_email'):
                email_service.send_billing_email(billing['user_email'], billing)
            # WhatsApp Bill
            if whatsapp_service and billing.get('user_phone'):
                whatsapp_service.send_billing_message(billing['user_phone'], billing)
        else:
            try:
                blynk.log_event(f"Slot {cancellation.slot_id} reservation cancelled")
            except: pass
            
            # Send standard cancellation notifications
            if whatsapp_service and slot.get('user_phone'):
                whatsapp_service.send_cancellation_message(slot['user_phone'], cancellation.slot_id)
            if email_service and slot.get('user_email'):
                email_service.send_cancellation_email(slot['user_email'], cancellation.slot_id)
        
        return {
            "success": True,
            "message": message,
            "slot_id": cancellation.slot_id,
            "billing": billing
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/slots/occupy/{slot_id}")
async def occupy_slot(slot_id: int):
    """Mark slot as occupied (Manual Override)"""
    if slot_id not in [1, 2, 3]:
        raise HTTPException(status_code=404, detail="Invalid slot ID")
    
    try:
        entry_time = int(time.time())
        db.occupy_slot(slot_id, entry_time)
        return {
            "success": True,
            "message": "Slot marked as occupied",
            "slot_id": slot_id,
            "entry_time": entry_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/slots/vacate/{slot_id}")
async def vacate_slot(slot_id: int):
    """Vacate slot and generate bill"""
    if slot_id not in [1, 2, 3]:
        raise HTTPException(status_code=404, detail="Invalid slot ID")
    try:
        exit_time = int(time.time())
        billing = db.vacate_slot(slot_id, exit_time)
        
        if not billing:
            raise HTTPException(status_code=400, detail="No active parking session")
        
        blynk.reset_slot_timer(slot_id)
        blynk.set_slot_reservation(slot_id, False)
        blynk.log_event(f"Slot {slot_id} vacated - Bill: ₹{billing['total_amount']}")
        
        if whatsapp_service and billing.get('user_phone'):
            whatsapp_service.send_billing_message(billing['user_phone'], billing)
        
        return {
            "success": True, 
            "message": "Slot vacated successfully",
            "billing": billing
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/slots/pay-bill/{slot_id}")
async def pay_bill_for_occupied_slot(slot_id: int, data: PayBillRequest):
    """Collect payment details for occupied slot and vacate it"""
    if slot_id not in [1, 2, 3]:
        raise HTTPException(status_code=404, detail="Invalid slot ID")
    
    try:
        slot = db.get_slot(slot_id)
        if not slot or not slot['is_occupied']:
            raise HTTPException(status_code=400, detail="Slot is not occupied")
        
        # Update slot with user details
        success = db.update_occupied_slot_details(
            slot_id, data.user_email, data.user_phone, data.vehicle_number
        )
        if not success:
            raise HTTPException(status_code=400, detail="Failed to update slot details")
        
        # Vacate
        exit_time = int(time.time())
        billing = db.vacate_slot(slot_id, exit_time)
        
        if not billing:
            raise HTTPException(status_code=400, detail="Failed to vacate slot")
        
        # Send Receipt
        try:
             if email_service:
                 email_service.send_billing_email(data.user_email, billing)
        except Exception as e:
            print(f"⚠️ Receipt email error: {e}")
        
        blynk.reset_slot_timer(slot_id)
        blynk.set_slot_reservation(slot_id, False)
        
        if whatsapp_service and data.user_phone:
            whatsapp_service.send_billing_message(data.user_phone, billing)
        
        return {
            "success": True,
            "message": "Payment successful",
            "billing": billing
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history")
async def get_parking_history(limit: int = 50):
    try:
        return {"success": True, "history": db.get_parking_history(limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history/pending")
async def get_pending_payments():
    try:
        return {"success": True, "pending": db.get_pending_payments()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history/revenue")
async def get_revenue_stats():
    try:
        return {"success": True, "stats": db.get_revenue_stats()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/history/clear")
async def clear_history():
    try:
        db.clear_history()
        return {"success": True, "message": "History cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/history/mark-paid/{history_id}")
async def mark_payment_paid(history_id: int):
    try:
        db.mark_payment_paid(history_id)
        return {"success": True, "message": "Payment marked as paid"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/database/reset-slots")
async def reset_all_slots():
    try:
        db.reset_all_slots()
        return {"success": True, "message": "All slots reset"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sync-from-blynk")
async def manual_sync_from_blynk():
    """Manual Sync Trigger (Optional)"""
    try:
        # Re-use logic or just return success since background handles it
        return {"success": True, "message": "Manual sync triggered (Background thread is active)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
