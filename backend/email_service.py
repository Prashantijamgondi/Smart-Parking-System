import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

class EmailService:
    def __init__(self, smtp_server: str, smtp_port: int, email: str, password: str):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.email = email
        self.password = password
    
    def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Helper method to send email using SMTP_SSL"""
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(html_content, 'html'))
            
            # Use SMTP_SSL for port 465 (Gmail defaults)
            if self.smtp_port == 465:
                # SSL connection
                with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port) as server:
                    server.login(self.email, self.password)
                    server.send_message(msg)
            else:
                # TLS connection
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.email, self.password)
                    server.send_message(msg)
            
            print(f"✅ Email sent to {to_email}: {subject}")
            return True
            
        except Exception as e:
            print(f"❌ Error sending email to {to_email}: {e}")
            return False

    def send_billing_email(self, to_email: str, billing_info: dict) -> bool:
        """Send billing email to user"""
        subject = f"Parking Bill - Slot {billing_info['slot_id']}"
        
        entry_time = datetime.fromtimestamp(billing_info['entry_time']).strftime('%Y-%m-%d %H:%M:%S')
        exit_time = datetime.fromtimestamp(billing_info['exit_time']).strftime('%Y-%m-%d %H:%M:%S')
        
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                    <h2 style="color: #2563eb; text-align: center;">Smart Parking System</h2>
                    <h3 style="color: #333;">Parking Bill</h3>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr style="background-color: #f3f4f6;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Slot Number</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{billing_info['slot_id']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Vehicle Number</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{billing_info['vehicle_number']}</td>
                        </tr>
                        <tr style="background-color: #f3f4f6;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Entry Time</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{entry_time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Exit Time</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{exit_time}</td>
                        </tr>
                        <tr style="background-color: #f3f4f6;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Duration</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{billing_info['duration_minutes']} minutes</td>
                        </tr>
                        <tr style="background-color: #dcfce7;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd; font-size: 18px; color: #16a34a;"><strong>₹{billing_info['total_amount']:.2f}</strong></td>
                        </tr>
                    </table>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px;">
                        <p style="margin: 0; color: #1e40af;"><strong>Billing Details:</strong></p>
                        <p style="margin: 5px 0; color: #475569;">Rate: ₹50 per minute</p>
                        <p style="margin: 5px 0; color: #475569;">Minimum charge: ₹30</p>
                    </div>
                    
                    <p style="text-align: center; color: #64748b; margin-top: 30px; font-size: 14px;">
                        Thank you for using Smart Parking System!
                    </p>
                </div>
            </body>
        </html>
        """
        return self._send_email(to_email, subject, html)
    
    def send_reservation_email(self, to_email: str, slot_id: int, vehicle_number: str) -> bool:
        """Send reservation confirmation email"""
        subject = f"Parking Reservation Confirmed - Slot {slot_id}"
        
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                    <h2 style="color: #16a34a; text-align: center;">Reservation Confirmed!</h2>
                    <p style="font-size: 16px; color: #333;">Your parking slot has been successfully reserved.</p>
                    
                    <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Slot Number:</strong> {slot_id}</p>
                        <p style="margin: 5px 0;"><strong>Vehicle Number:</strong> {vehicle_number}</p>
                    </div>
                    
                    <p style="color: #64748b;">Please arrive within the next 15 minutes to park your vehicle.</p>
                </div>
            </body>
        </html>
        """
        return self._send_email(to_email, subject, html)

    def send_cancellation_email(self, to_email: str, slot_id: int) -> bool:
        """Send cancellation confirmation email"""
        subject = f"Reservation Cancelled - Slot {slot_id}"
        
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                    <h2 style="color: #ef4444; text-align: center;">Reservation Cancelled</h2>
                    <p style="font-size: 16px; color: #333;">Your reservation for Slot {slot_id} has been cancelled.</p>
                    
                    <p style="color: #64748b; margin-top: 20px;">If this was a mistake, please book again through our website.</p>
                </div>
            </body>
        </html>
        """
        return self._send_email(to_email, subject, html)