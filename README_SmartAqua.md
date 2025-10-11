# SmartAqua - Apartment Water Management System

A comprehensive IoT solution for apartment complexes to monitor, predict, and manage water tank levels with per-flat usage tracking, leak detection, and automated pump control.

## 🏗️ System Architecture

```
ESP32 Tank Controller ──MQTT──► Backend API ──HTTP──► React Dashboard
       │                           │                        │
       ├── Ultrasonic Sensor       ├── FastAPI              ├── Real-time Charts
       ├── Flow Sensor            ├── PostgreSQL           ├── Alert Management
       ├── Pump Relay             ├── InfluxDB             ├── Predictive Analytics
       ├── TDS Sensor             └── Telegram Bot        └── Mobile PWA
       └── RTC + SD Card
```

## 🚀 Quick Start

### 1. Hardware Setup

**Core Components:**
- ESP32 Dev Board
- HC-SR04 Ultrasonic Sensor
- 5V Relay Module
- YF-S201 Flow Sensor (optional)
- TDS Sensor Module (optional)
- DS3231 RTC Module
- MicroSD Card Module

**Wiring:**
```cpp
// ESP32 Pin Configuration
#define ULTRASONIC_TRIGGER_PIN 14
#define ULTRASONIC_ECHO_PIN 27
#define FLOW_SENSOR_PIN 16
#define PUMP_RELAY_PIN 26
#define TDS_ANALOG_PIN 34
#define SD_CS_PIN 5
```

### 2. ESP32 Firmware Setup

1. Install Arduino IDE with ESP32 board support
2. Install required libraries:
   - `WiFi`
   - `PubSubClient`
   - `ArduinoOTA`
   - `RTClib`
   - `NewPing`
   - `ArduinoJson`
   - `SD`

3. Configure WiFi and MQTT settings in `firmware/smart_tank_firmware.ino`:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   #define MQTT_SERVER "192.168.1.100"
   ```

4. Upload firmware to ESP32

### 3. Backend Setup

1. Create virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. Run the backend:
   ```bash
   python smart_aqua_backend.py
   ```

### 4. Dashboard Setup

1. Install dependencies:
   ```bash
   cd dashboard
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

## 📊 API Endpoints

### Device Status
```http
GET /devices/{device_id}/status
```

### Telemetry Data
```http
GET /devices/{device_id}/telemetry?hours=24
```

### Predictions
```http
GET /devices/{device_id}/predictions?days_ahead=7
```

### Send Commands
```http
POST /commands
Content-Type: application/json

{
  "action": "PUMP_ON",
  "device_id": "tank01"
}
```

## 🔧 Configuration

### Tank Calibration

1. Measure your tank dimensions:
   ```cpp
   #define TANK_HEIGHT_CM 150
   #define TANK_CROSS_SECTION_M2 1.5
   ```

2. Calibrate ultrasonic sensor:
   - Empty tank: Record distance
   - Full tank: Record distance
   - Update `TANK_HEIGHT_CM` accordingly

### Flow Sensor Calibration

1. Run known volume (e.g., 10 liters) through sensor
2. Count pulses received
3. Calculate: `pulses_per_liter = total_pulses / volume_liters`
4. Update `FLOW_SENSOR_CALIBRATION`

## 🚨 Alert System

### Alert Types
- **Low Water**: Tank below 20% or 40%
- **Leak Detected**: Unusual consumption when pump off
- **Pump Fault**: Pump running but no flow
- **Water Quality**: TDS above threshold

### Telegram Integration

1. Create Telegram bot: Message @BotFather
2. Get chat ID: Send message to bot, check `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Configure in `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_token
   TELEGRAM_CHAT_ID=your_chat_id
   ```

## 📈 Prediction Algorithm

### Daily Consumption Calculation
```python
# Rolling 7-day average
daily_avg_liters = sum(last_7_days_total_l) / 7
days_left = current_volume_liters / daily_avg_liters
```

### Leak Detection
```python
if pump_state == "OFF" and consumption_last_hour > 50L:
    trigger_leak_alert()
```

## 🔒 Security Features

- MQTT authentication (configure broker)
- API rate limiting
- Command confirmation for critical actions
- Local data storage fallback
- OTA firmware updates with password protection

## 🧪 Testing Checklist

### Hardware Tests
- [ ] Ultrasonic sensor distance accuracy (±1cm)
- [ ] Flow sensor pulse counting (calibrate with bucket test)
- [ ] Relay switching (no voltage on control pins)
- [ ] TDS sensor readings (compare with lab meter)
- [ ] RTC time accuracy
- [ ] SD card logging

### Software Tests
- [ ] MQTT connection and telemetry publishing
- [ ] API endpoints responding correctly
- [ ] Dashboard displaying real-time data
- [ ] Alert system triggering on thresholds
- [ ] Prediction calculations accuracy
- [ ] Dark mode toggle functionality

### Integration Tests
- [ ] Pump control via dashboard
- [ ] Leak detection with simulated leak
- [ ] Multi-device support
- [ ] Telegram alert delivery

## 🛠️ Troubleshooting

### Common Issues

**ESP32 not connecting to WiFi:**
- Check credentials in firmware
- Verify WiFi signal strength
- Try different WiFi channel

**Ultrasonic sensor erratic readings:**
- Clean sensor surface
- Check voltage levels (5V required)
- Verify pin connections
- Add noise filtering in code

**Flow sensor not counting:**
- Check interrupt pin configuration
- Verify flow direction
- Clean sensor turbine
- Recalibrate pulse factor

**MQTT connection fails:**
- Verify broker IP and port
- Check firewall settings
- Ensure broker is running

## 📚 Advanced Features

### Per-Flat Metering
Add flow sensors at each flat's inlet for individual usage tracking.

### Machine Learning Predictions
Implement LSTM models for better consumption forecasting.

### Billing Integration
Connect with society management software for automated billing.

### Mobile App
Convert dashboard to PWA for native mobile experience.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Documentation: Check this README
- Issues: GitHub Issues
- Community: [Discord/Slack link]

---

**Built with ❤️ for apartment communities worldwide**