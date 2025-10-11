#!/usr/bin/env python3
"""
Simple SmartAqua API Test
Tests backend API without MQTT dependencies
"""

import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:8000"

def test_api():
    """Test basic API functionality"""
    print("🧪 Testing SmartAqua Backend API")
    print("=" * 40)

    # Test 1: Root endpoint
    try:
        response = requests.get(f"{BACKEND_URL}/")
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend API is running!")
            print(f"   Service: {data.get('message', 'Unknown')}")
            print(f"   Version: {data.get('version', 'Unknown')}")
        else:
            print(f"❌ Backend not responding: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False

    # Test 2: Device status (will fail gracefully without ESP32)
    try:
        response = requests.get(f"{BACKEND_URL}/devices/tank01/status")
        print(f"📊 Device status endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Device data received:")
            print(f"   Level: {data.get('current_level', 'N/A')} cm")
            print(f"   Percent: {data.get('percent_full', 'N/A')}%")
            print(f"   Pump: {data.get('pump_state', 'N/A')}")
        elif response.status_code == 404:
            print("ℹ️  No device data yet (normal without ESP32)")
    except Exception as e:
        print(f"❌ Device status error: {e}")

    # Test 3: List devices
    try:
        response = requests.get(f"{BACKEND_URL}/devices")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Device list: {len(data.get('devices', []))} devices")
    except Exception as e:
        print(f"❌ Device list error: {e}")

    # Test 4: Send test command
    try:
        command = {
            "action": "PUMP_OFF",
            "device_id": "tank01"
        }
        response = requests.post(f"{BACKEND_URL}/commands", json=command)
        print(f"📤 Command test: {response.status_code}")
        if response.status_code == 200:
            print("✅ Command endpoint working")
    except Exception as e:
        print(f"❌ Command test error: {e}")

    print("\n" + "=" * 40)
    print("🎯 API Test Complete!")
    print("\n📋 Next Steps:")
    print("1. Upload ESP32 code with MQTT_SERVER = 'broker.hivemq.com'")
    print("2. ESP32 will connect and start sending data")
    print("3. Dashboard will show live tank levels!")
    print("\n🌐 Dashboard: http://localhost:3000")
    print("🔗 ESP32 Code: Ready to upload!")

    return True

if __name__ == "__main__":
    test_api()