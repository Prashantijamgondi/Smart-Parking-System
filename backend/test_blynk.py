#!/usr/bin/env python3
"""
Test Blynk Connection
Run this to verify your Blynk setup is working
"""

import os
from dotenv import load_dotenv
from blynk_manager import BlynkManager

# Load environment variables
load_dotenv()

def test_blynk_connection():
    print("\n" + "="*50)
    print("  Blynk Connection Test")
    print("="*50 + "\n")
    
    # Get token
    token = os.getenv("BLYNK_AUTH_TOKEN")
    
    if not token:
        print("❌ ERROR: BLYNK_AUTH_TOKEN not found in .env file")
        print("\nPlease create a .env file with:")
        print('BLYNK_AUTH_TOKEN="your_token_here"')
        return False
    
    print(f"✓ Token found: {token[:10]}...{token[-5:]}")
    print(f"✓ Token length: {len(token)} characters")
    
    # Create Blynk manager
    print("\nConnecting to Blynk Cloud...")
    blynk = BlynkManager(token)
    
    # Test reading a pin
    print("\nTesting Virtual Pin V0 (Slot 1 Status)...")
    result = blynk.read_virtual_pin("V0")
    
    if result is not None:
        print(f"✅ SUCCESS! Received: {result}")
        print("\nBlynk connection is working!")
        
        # Try to get all slots
        print("\nFetching all slots status...")
        slots = blynk.get_all_slots_status()
        
        if slots:
            print(f"✅ Found {len(slots)} slots:")
            for slot in slots:
                status = "OCCUPIED" if slot['is_occupied'] else "EMPTY"
                reserved = "RESERVED" if slot['is_reserved'] else "NOT RESERVED"
                print(f"  - Slot {slot['slot_id']}: {status}, {reserved}")
        else:
            print("⚠️  No slots data received")
        
        return True
    else:
        print("❌ FAILED: Could not read from Blynk")
        print("\nPossible issues:")
        print("1. Wrong auth token")
        print("2. Blynk server is down")
        print("3. Virtual pins not configured in Blynk app")
        print("4. Network/firewall issues")
        
        print("\nTo fix:")
        print("1. Check your Blynk auth token in the app")
        print("2. Make sure your Blynk template has virtual pins V0-V8")
        print("3. Verify you can access blynk.cloud in browser")
        
        return False

if __name__ == "__main__":
    try:
        success = test_blynk_connection()
        print("\n" + "="*50)
        if success:
            print("✅ All tests passed!")
        else:
            print("❌ Tests failed - check errors above")
        print("="*50 + "\n")
    except Exception as e:
        print(f"\n❌ Error during test: {e}")
        import traceback
        traceback.print_exc()