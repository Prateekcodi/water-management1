#!/usr/bin/env python3
"""
SmartAqua Connection Test Script
Test ESP32 to Backend to Dashboard connection
"""

import requests
import json
import time
import paho.mqtt.client as mqtt
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8000"
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
DEVICE_ID = "tank01"

def test_backend_api():
    """Test if backend API is responding"""
    print("🔍 Testing Backend API...")

    try:
        response = requests.get(f"{BACKEND_URL}/")
        if response.status_code == 200:
            print("✅ Backend API is running")
            return True
        else:
            print(f"❌ Backend API error: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False

def test_device_status():
    """Test device status endpoint"""
    print("🔍 Testing Device Status...")

    try:
        response = requests.get(f"{BACKEND_URL}/devices/{DEVICE_ID}/status")
        if response.status_code == 200:
            data = response.json()
            print("✅ Device status received:")
            print(f"   Level: {data.get('current_level', 'N/A')} cm")
            print(f"   Percent: {data.get('percent_full', 'N/A')}%")
            print(f"   Pump: {data.get('pump_state', 'N/A')}")
            return True
        else:
            print(f"❌ Device status error: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot get device status: {e}")
        return False

def test_mqtt_connection():
    """Test MQTT broker connection"""
    print("🔍 Testing MQTT Connection...")

    connected = False

    def on_connect(client, userdata, flags, rc):
        nonlocal connected
        if rc == 0:
            connected = True
            print("✅ MQTT Connected successfully")
            client.subscribe(f"smartAqua/{DEVICE_ID}/telemetry")
        else:
            print(f"❌ MQTT Connection failed: {rc}")

    def on_message(client, userdata, msg):
        print(f"📡 MQTT Message received: {msg.payload.decode()}")

    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        time.sleep(2)  # Wait for connection
        client.loop_stop()

        if connected:
            return True
        else:
            print("❌ MQTT connection timeout")
            return False

    except Exception as e:
        print(f"❌ MQTT connection error: {e}")
        return False

def test_telemetry_data():
    """Test telemetry data retrieval"""
    print("🔍 Testing Telemetry Data...")

    try:
        response = requests.get(f"{BACKEND_URL}/devices/{DEVICE_ID}/telemetry?hours=1")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Telemetry data received: {len(data)} readings")
            if data:
                latest = data[-1]
                print(f"   Latest: {latest.get('percent_full', 'N/A')}% at {latest.get('timestamp', 'N/A')}")
            return True
        else:
            print(f"❌ Telemetry error: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot get telemetry: {e}")
        return False

def test_predictions():
    """Test prediction endpoint"""
    print("🔍 Testing Predictions...")

    try:
        response = requests.get(f"{BACKEND_URL}/devices/{DEVICE_ID}/predictions?days_ahead=3")
        if response.status_code == 200:
            data = response.json()
            print("✅ Predictions received:")
            print(f"   Days left: {data.get('summary', {}).get('predicted_days_left', 'N/A')}")
            return True
        else:
            print(f"❌ Predictions error: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot get predictions: {e}")
        return False

def send_test_command():
    """Send a test command to device"""
    print("🔍 Testing Command Sending...")

    command = {
        "action": "PUMP_OFF",  # Safe test command
        "device_id": DEVICE_ID
    }

    try:
        response = requests.post(f"{BACKEND_URL}/commands", json=command)
        if response.status_code == 200:
            print("✅ Test command sent successfully")
            return True
        else:
            print(f"❌ Command error: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot send command: {e}")
        return False

def main():
    print("🚀 SmartAqua Connection Test")
    print("=" * 40)

    tests = [
        ("Backend API", test_backend_api),
        ("Device Status", test_device_status),
        ("MQTT Connection", test_mqtt_connection),
        ("Telemetry Data", test_telemetry_data),
        ("Predictions", test_predictions),
        ("Command Sending", send_test_command),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}")
        print("-" * 20)
        if test_func():
            passed += 1
        time.sleep(0.5)  # Small delay between tests

    print("\n" + "=" * 40)
    print(f"📊 Test Results: {passed}/{total} passed")

    if passed == total:
        print("🎉 All tests passed! Your SmartAqua system is working perfectly!")
        print("\n📱 Your dashboard should now show live ESP32 data at:")
        print("   http://localhost:3000")
    else:
        print("⚠️  Some tests failed. Check the error messages above.")
        print("\n🔧 Troubleshooting tips:")
        print("   1. Make sure backend is running: python smart_aqua_backend.py")
        print("   2. Check ESP32 WiFi and MQTT settings")
        print("   3. Verify MQTT broker is running")
        print("   4. Check firewall settings")


if __name__ == "__main__":
    main()