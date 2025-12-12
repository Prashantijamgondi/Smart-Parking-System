from twilio.rest import Client
from datetime import datetime

class WhatsAppService:
    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        self.client = Client(account_sid, auth_token)
        self.from_number = from_number  # Format: 'whatsapp:+14155238886'
    
    def send_billing_message(self, to_number: str, billing_info: dict) -> bool:
        """Send billing information via WhatsApp"""
        try:
            # Format phone number for WhatsApp
            if not to_number.startswith('whatsapp:'):
                to_number = f"whatsapp:{to_number}"
            
            entry_time = datetime.fromtimestamp(billing_info['entry_time']).strftime('%d-%m-%Y %H:%M:%S')
            exit_time = datetime.fromtimestamp(billing_info['exit_time']).strftime('%d-%m-%Y %H:%M:%S')
            
            message_body = f"""
🅿️ *Smart Parking - Bill Receipt*

*Slot Number:* {billing_info['slot_id']}
*Vehicle:* {billing_info['vehicle_number']}

*Entry Time:* {entry_time}
*Exit Time:* {exit_time}
*Duration:* {billing_info['duration_minutes']} minutes

*Rate:* ₹50 per minute
*Minimum Charge:* ₹30

*Total Amount: ₹{billing_info['total_amount']:.2f}*

Thank you for using Smart Parking System! 🚗
            """
            
            message = self.client.messages.create(
                body=message_body.strip(),
                from_=self.from_number,
                to=to_number
            )
            
            print(f"WhatsApp message sent to {to_number}: {message.sid}")
            return True
            
        except Exception as e:
            print(f"Error sending WhatsApp message: {e}")
            return False
    
    def send_reservation_message(self, to_number: str, slot_id: int, vehicle_number: str) -> bool:
        """Send reservation confirmation via WhatsApp"""
        try:
            if not to_number.startswith('whatsapp:'):
                to_number = f"whatsapp:{to_number}"
            
            message_body = f"""
✅ *Parking Slot Reserved!*

*Slot Number:* {slot_id}
*Vehicle Number:* {vehicle_number}

Your parking slot is confirmed. Please arrive within 15 minutes.

Smart Parking System 🅿️
            """
            
            message = self.client.messages.create(
                body=message_body.strip(),
                from_=self.from_number,
                to=to_number
            )
            
            return True
            
        except Exception as e:
            print(f"Error sending reservation WhatsApp: {e}")
            return False
    
    def send_cancellation_message(self, to_number: str, slot_id: int) -> bool:
        """Send cancellation confirmation via WhatsApp"""
        try:
            if not to_number.startswith('whatsapp:'):
                to_number = f"whatsapp:{to_number}"
            
            message_body = f"""
❌ *Reservation Cancelled*

Your reservation for Slot {slot_id} has been cancelled.

Smart Parking System 🅿️
            """
            
            message = self.client.messages.create(
                body=message_body.strip(),
                from_=self.from_number,
                to=to_number
            )
            
            return True
            
        except Exception as e:
            print(f"Error sending cancellation WhatsApp: {e}")
            return False