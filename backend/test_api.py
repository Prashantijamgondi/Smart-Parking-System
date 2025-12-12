"""
Test script for Smart Parking System API
Tests reservation, cancellation, and payment tracking features
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_api():
    print("=" * 60)
    print("SMART PARKING SYSTEM API TESTS")
    print("=" * 60)
    
    # Test 1: Health Check
    print("\n1. Testing Health Check...")
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 2: Get All Slots
    print("\n2. Testing Get All Slots...")
    response = requests.get(f"{BASE_URL}/api/slots")
    slots = response.json()
    print(f"   Status: {response.status_code}")
    print(f"   Slots: {json.dumps(slots, indent=2)}")
    
    # Test 3: Reset Database
    print("\n3. Testing Database Reset...")
    response = requests.post(f"{BASE_URL}/api/database/reset-slots")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 4: Reserve a Slot
    print("\n4. Testing Slot Reservation...")
    reservation_data = {
        "slot_id": 1,
        "user_email": "test@example.com",
        "user_phone": "+919876543210",
        "vehicle_number": "KA01AB1234"
    }
    response = requests.post(f"{BASE_URL}/api/slots/reserve", json=reservation_data)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 5: Get Slot Status
    print("\n5. Checking Slot 1 Status...")
    response = requests.get(f"{BASE_URL}/api/slots/1")
    slot = response.json()
    print(f"   Status: {response.status_code}")
    print(f"   Slot Data: {json.dumps(slot, indent=2)}")
    
    # Test 6: Cancel Reservation
    print("\n6. Testing Reservation Cancellation...")
    cancel_data = {
        "slot_id": 1,
        "email_id": "test@example.com"
    }
    response = requests.post(f"{BASE_URL}/api/slots/cancel", json=cancel_data)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 7: Occupy Slot (simulating car entry)
    print("\n7. Testing Slot Occupation...")
    response = requests.post(f"{BASE_URL}/api/slots/occupy/1")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Wait a bit to simulate parking duration
    print("\n   Waiting 3 seconds to simulate parking...")
    time.sleep(3)
    
    # Test 8: Vacate Unknown Vehicle
    print("\n8. Testing Unknown Vehicle Exit...")
    unknown_vehicle_data = {
        "user_email": "unknown@example.com",
        "vehicle_number": "KA02XY5678"
    }
    response = requests.post(f"{BASE_URL}/api/slots/vacate-unknown/1", json=unknown_vehicle_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Response: {json.dumps(result, indent=2)}")
    else:
        print(f"   Error: {response.text}")
    
    # Test 9: Get Parking History
    print("\n9. Testing Get Parking History...")
    response = requests.get(f"{BASE_URL}/api/history?limit=10")
    history = response.json()
    print(f"   Status: {response.status_code}")
    print(f"   History Count: {history.get('count', 0)}")
    if history.get('history'):
        for record in history['history']:
            print(f"   - Slot {record['slot_id']}: {record['vehicle_number']} - ₹{record['total_amount']} - {record['payment_status']}")
    
    # Test 10: Get Pending Payments
    print("\n10. Testing Get Pending Payments...")
    response = requests.get(f"{BASE_URL}/api/history/pending")
    pending = response.json()
    print(f"   Status: {response.status_code}")
    print(f"   Pending Count: {pending.get('count', 0)}")
    
    # Test 11: Mark Payment as Paid
    if pending.get('pending') and len(pending['pending']) > 0:
        history_id = pending['pending'][0]['id']
        print(f"\n11. Testing Mark Payment as Paid (ID: {history_id})...")
        response = requests.post(f"{BASE_URL}/api/history/mark-paid/{history_id}")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Could not connect to the API server.")
        print("   Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ ERROR: {e}")
