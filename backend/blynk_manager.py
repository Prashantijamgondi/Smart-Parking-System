import requests
import time
from typing import Optional

class BlynkManager:
    def __init__(self, auth_token: str, server: str = "blynk.cloud"):
        self.auth_token = auth_token
        self.base_url = f"https://{server}/external/api"
        
    def _get_url(self, endpoint: str) -> str:
        return f"{self.base_url}/{endpoint}"
    
    def read_virtual_pin(self, pin: str) -> Optional[str]:
        """Read value from virtual pin"""
        try:
            url = self._get_url(f"get?token={self.auth_token}&{pin}")
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                return response.text
            return None
        except Exception as e:
            print(f"Error reading pin {pin}: {e}")
            return None
    
    def write_virtual_pin(self, pin: str, value) -> bool:
        """Write value to virtual pin"""
        try:
            url = self._get_url(f"update?token={self.auth_token}&{pin}={value}")
            response = requests.get(url, timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"Error writing pin {pin}: {e}")
            return False
    
    def set_slot_reservation(self, slot_id: int, reserved: bool) -> bool:
        """Set reservation status for a slot"""
        # Virtual pins for reservation: V3, V4, V5 for slots 1, 2, 3
        pin = f"V{slot_id + 2}"
        return self.write_virtual_pin(pin, 1 if reserved else 0)
    
    def get_slot_status(self, slot_id: int) -> Optional[dict]:
        """Get status of a slot from Blynk"""
        # Virtual pins for status: V0, V1, V2 for slots 1, 2, 3
        status_pin = f"V{slot_id - 1}"
        reserve_pin = f"V{slot_id + 2}"
        entry_time_pin = f"V{slot_id + 5}"
        
        status = self.read_virtual_pin(status_pin)
        reserved = self.read_virtual_pin(reserve_pin)
        entry_time = self.read_virtual_pin(entry_time_pin)
        
        if status is None:
            return None
        
        return {
            'slot_id': slot_id,
            'is_occupied': int(status) == 1 if status else False,
            'is_reserved': int(reserved) == 1 if reserved else False,
            'entry_time': int(entry_time) if entry_time and entry_time != '0' else None
        }
    
    def get_all_slots_status(self) -> list:
        """Get status of all slots"""
        slots = []
        for slot_id in [1, 2, 3]:
            slot_status = self.get_slot_status(slot_id)
            if slot_status:
                slots.append(slot_status)
        return slots
    
    def reset_slot_timer(self, slot_id: int) -> bool:
        """Reset entry time for a slot"""
        entry_time_pin = f"V{slot_id + 5}"
        return self.write_virtual_pin(entry_time_pin, 0)
    
    def log_event(self, message: str) -> bool:
        """Log event to Blynk terminal (if configured)"""
        try:
            url = self._get_url(f"logEvent?token={self.auth_token}&code=parking_event")
            response = requests.get(url, timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"Error logging event: {e}")
            return False