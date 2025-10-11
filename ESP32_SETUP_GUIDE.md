# 🚀 ESP32 Setup Guide - Connect to SmartAqua System

This guide will help you connect your ESP32 to the SmartAqua backend and get live updates on your dashboard.

## 📋 Prerequisites

- ESP32 Dev Board
- Arduino IDE with ESP32 support
- USB cable for programming
- WiFi network
- Backend server running (see Backend Setup section)

## 🔧 Step 1: Configure ESP32 Firmware

### 1.1 Download and Open Firmware

1. Open `firmware/smart_tank_firmware.ino` in Arduino IDE
2. Install required libraries:
   - Go to **Sketch → Include Library → Manage Libraries**
   - Install: `WiFi`, `PubSubClient`, `ArduinoOTA`, `RTClib`, `NewPing`, `ArduinoJson`, `SD`

### 1.2 Configure WiFi and MQTT Settings

Edit these lines in the firmware:

```cpp
// WiFi credentials - CHANGE THESE!
const char* ssid = "YOUR_WIFI_SSID";           // Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";   // Your WiFi password

// MQTT Broker - CHANGE THIS!
#define MQTT_SERVER "192.168.1.100"            // IP of your backend server
#define MQTT_PORT 1883
```

**How to find your backend IP:**
- If backend is on same computer: Use `192.168.1.XXX` (check with `ipconfig` on Windows or `ifconfig` on Linux)
- If backend is on different device: Use that device's IP address

### 1.3 Configure Device ID

```cpp
#define DEVICE_ID "tank01"  // Change if you have multiple tanks
```

### 1.4 Upload Firmware

1. Select your ESP32 board: **Tools → Board → ESP32 Dev Module**
2. Select COM port: **Tools → Port**
3. Click **Upload** (arrow button)
4. Wait for "Done uploading" message

## 🖥️ Step 2: Setup Backend Server

### 2.1 Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2.2 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file:
```env
MQTT_BROKER=localhost          # Keep as localhost if backend runs on same machine
MQTT_PORT=1883
API_HOST=0.0.0.0
API_PORT=8000
```

### 2.3 Start Backend

```bash
python smart_aqua_backend.py
```

You should see:
```
SmartAqua Backend started
Connected to MQTT broker with result code 0
```

## 🌐 Step 3: Setup MQTT Broker (Mosquitto)

### Option A: Install Mosquitto locally

**Windows:**
```bash
# Download from https://mosquitto.org/download/
# Install and start service
```

**Linux/Ubuntu:**
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

### Option B: Use Online MQTT Broker (for testing)

Change in firmware:
```cpp
#define MQTT_SERVER "broker.hivemq.com"  // Public broker for testing
```

And in backend `.env`:
```env
MQTT_BROKER=broker.hivemq.com
```

## 📊 Step 4: Connect Dashboard

### 4.1 Update API Base URL

Edit `dashboard/src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000';  // Change if backend is on different machine
```

### 4.2 Start Dashboard

```bash
cd dashboard
npm install
npm start
```

Dashboard will be at `http://localhost:3000`

## 🧪 Step 5: Test Connection

### 5.1 Check ESP32 Connection

Look at ESP32 Serial Monitor (Arduino IDE → Tools → Serial Monitor):

```
SmartAqua Tank Controller Starting...
Connecting to WiFi...
Connected!
IP Address: 192.168.1.105
Connecting to MQTT...
Connected!
SmartAqua Tank Controller Ready!
Telemetry sent successfully
```

### 5.2 Check Backend Logs

Backend terminal should show:
```
Connected to MQTT broker with result code 0
INFO: Telemetry received from tank01: 75.2% full
```

### 5.3 Check Dashboard

1. Open `http://localhost:3000`
2. You should see live tank data updating every 30 seconds
3. Tank visualization should show real water levels
4. Charts should populate with data

## 🔧 Hardware Connection (Optional Sensors)

### Ultrasonic Sensor (HC-SR04)
```
ESP32    HC-SR04
14  ──── TRIGGER
27  ──── ECHO
GND ──── GND
5V  ──── VCC
```

### Relay Module (Pump Control)
```
ESP32    Relay
26  ──── IN
GND ──── GND
5V  ──── VCC
```

### Flow Sensor (YF-S201)
```
ESP32    YF-S201
16  ──── SIGNAL (Yellow wire)
5V  ──── VCC (Red wire)
GND ──── GND (Black wire)
```

### TDS Sensor
```
ESP32    TDS Sensor
34  ──── ANALOG OUT
GND ──── GND
5V  ──── VCC
```

## 🐛 Troubleshooting

### ESP32 Not Connecting to WiFi
```cpp
// Add this for debugging
Serial.println("WiFi status: " + String(WiFi.status()));
// Common issues:
// - Wrong SSID/password
// - WiFi signal too weak
// - ESP32 power supply insufficient
```

### MQTT Connection Failed
```cpp
// Check broker details
Serial.println("MQTT state: " + String(mqttClient.state()));
// States: -4 = connection timeout, -2 = network error, -1 = protocol error
```

### No Data on Dashboard
1. Check backend is running: `curl http://localhost:8000/devices/tank01/status`
2. Check MQTT messages: Install MQTT client and subscribe to `smartAqua/tank01/telemetry`
3. Check API_BASE_URL in dashboard

### Ultrasonic Sensor Issues
```cpp
// Test sensor readings
Serial.printf("Distance: %d cm\n", sonar.ping_cm());
// Issues:
// - Wrong pins
// - Insufficient power (needs 5V)
// - Sensor not waterproof (for overhead tanks)
```

## 📡 Network Architecture

```
ESP32 ──WiFi──► Router ──LAN──► Backend Server
   │                    │
   └──MQTT──────────────┘
        │
        ▼
   Dashboard Browser
```

## 🎯 Quick Test Commands

### Test MQTT Connection
```bash
# Install mosquitto client
mosquitto_sub -h localhost -t "smartAqua/tank01/telemetry"
```

### Test Backend API
```bash
curl http://localhost:8000/devices/tank01/status
curl http://localhost:8000/devices
```

### Send Test Command
```bash
curl -X POST http://localhost:8000/commands \
  -H "Content-Type: application/json" \
  -d '{"action": "PUMP_OFF", "device_id": "tank01"}'
```

## 🚀 Going Live

1. **Secure MQTT**: Add authentication to broker
2. **Fixed IPs**: Assign static IPs to ESP32 and backend
3. **Remote Access**: Use ngrok or VPN for remote dashboard access
4. **Backup Power**: Add battery backup for ESP32
5. **Weather Protection**: Waterproof enclosure for outdoor installation

## 📞 Need Help?

1. Check serial output from ESP32
2. Verify all IP addresses and ports
3. Test each component individually
4. Check firewall settings
5. Use MQTT client to debug message flow

Your ESP32 should now be sending live data to your SmartAqua dashboard! 🎉