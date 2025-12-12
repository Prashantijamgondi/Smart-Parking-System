# from pydantic import BaseModel, EmailStr
# from typing import Optional
# from datetime import datetime

# class SlotReservation(BaseModel):
#     slot_id: int
#     user_email: EmailStr
#     user_phone: str
#     vehicle_number: str

# class SlotCancellation(BaseModel):
#     slot_id: int
#     user_email: EmailStr

# class ParkingSession(BaseModel):
#     slot_id: int
#     vehicle_number: str
#     entry_time: int  # Unix timestamp in seconds
#     user_email: EmailStr
#     user_phone: str

# class SlotStatus(BaseModel):
#     slot_id: int
#     is_occupied: bool
#     is_reserved: bool
#     vehicle_number: Optional[str] = None
#     entry_time: Optional[int] = None
    
# class BillingInfo(BaseModel):
#     slot_id: int
#     vehicle_number: str
#     entry_time: int
#     exit_time: int
#     duration_minutes: int
#     total_amount: float
#     user_email: EmailStr
#     user_phone: str

from pydantic import BaseModel
from typing import Optional
from pydantic import BaseModel, EmailStr

class EmailReceipt(BaseModel):
    to_email: EmailStr
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

class SlotCancellation(BaseModel):
    slot_id: int
    user_email: str

class ParkingSession(BaseModel):
    slot_id: int
    vehicle_number: str
    entry_time: int  # Unix timestamp in seconds
    user_email: str
    user_phone: str

class SlotStatus(BaseModel):
    slot_id: int
    is_occupied: bool
    is_reserved: bool
    vehicle_number: Optional[str] = None
    entry_time: Optional[int] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    
class BillingInfo(BaseModel):
    slot_id: int
    vehicle_number: str
    entry_time: int
    exit_time: int
    duration_minutes: int
    total_amount: float
    user_email: Optional[str] = None
    user_phone: Optional[str] = None