# SmartAqua - Intelligent Water Management System

A comprehensive IoT solution for apartment complexes to monitor, predict, and manage water tank levels with real-time monitoring, leak detection, and AI-powered insights.

## 🌟 Features

- **Real-time Monitoring**: Live water level, flow rate, temperature, and quality tracking
- **Predictive Analytics**: AI-powered consumption predictions and refill alerts
- **Leak Detection**: Advanced algorithms to detect water leaks automatically
- **Mobile-Responsive Dashboard**: Beautiful, modern UI that works on all devices
- **AI Chat Assistant**: Get insights and recommendations about your water system
- **Town-wide Visualization**: Monitor multiple tanks across your community
- **Alert System**: Telegram notifications for critical events
- **Dark/Light Mode**: User-friendly theme switching

## 🏗️ System Architecture

```
ESP32 Tank Controller ──MQTT──► FastAPI Backend ──HTTP──► React Dashboard
       │                           │                        │
       ├── Ultrasonic Sensor       ├── SQLite Database      ├── Real-time Charts
       ├── Flow Sensor            ├── MQTT Broker          ├── Alert Management
       ├── Pump Relay             ├── AI Integration       ├── Predictive Analytics
       ├── TDS Sensor             └── Telegram Bot         └── Mobile PWA
       └── Temperature Sensor
```

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (2.0+)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd smart-aqua
   ```

2. **Start the system:**
   ```bash
   ./start.sh
   ```

   Or manually:
   ```bash
   docker-compose up --build -d
   ```

3. **Access the dashboard:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=sqlite:///./smart_aqua.db

# MQTT Configuration
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USER=
MQTT_PASSWORD=

# Telegram Notifications (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# AI Chat (Optional)
GEMINI_API_KEY=your_gemini_api_key

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000
```

### MQTT Setup

The system includes a built-in MQTT broker. For production, consider using a dedicated MQTT broker like Mosquitto or AWS IoT.

### AI Integration

To enable AI chat features:
1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env` file

### Telegram Notifications

To enable Telegram alerts:
1. Create a bot with [@BotFather](https://t.me/botfather)
2. Get your chat ID by messaging your bot
3. Add both to your `.env` file

## 📱 Usage

### Dashboard Features

1. **Main Dashboard**: Real-time tank status, charts, and predictions
2. **Town View**: Monitor multiple tanks across your community
3. **Alerts**: View and manage system alerts
4. **AI Chat**: Get insights and recommendations
5. **Settings**: Configure system parameters

### API Endpoints

- `GET /devices/{device_id}/status` - Get current tank status
- `GET /devices/{device_id}/telemetry` - Get historical data
- `GET /devices/{device_id}/alerts` - Get alerts
- `POST /devices/{device_id}/alerts/{alert_id}/resolve` - Resolve alert
- `GET /devices/{device_id}/predictions` - Get consumption predictions
- `POST /chat` - AI chat endpoint
- `POST /commands` - Send commands to devices

## 🔌 Hardware Integration

### ESP32 Setup

1. **Required Components:**
   - ESP32 Dev Board
   - HC-SR04 Ultrasonic Sensor
   - 5V Relay Module
   - YF-S201 Flow Sensor (optional)
   - TDS Sensor Module (optional)
   - DS3231 RTC Module (optional)

2. **Wiring:**
   ```cpp
   #define ULTRASONIC_TRIGGER_PIN 14
   #define ULTRASONIC_ECHO_PIN 27
   #define FLOW_SENSOR_PIN 16
   #define PUMP_RELAY_PIN 26
   #define TDS_ANALOG_PIN 34
   ```

3. **Firmware:**
   - Upload `firmware/smart_tank_firmware.ino` to your ESP32
   - Configure WiFi and MQTT settings
   - The device will automatically connect and start sending data

### MQTT Topics

- `smartAqua/{device_id}/telemetry` - Telemetry data
- `smartAqua/{device_id}/alert` - Alert notifications
- `smartAqua/{device_id}/command` - Device commands

## 🛠️ Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend Development

```bash
cd dashboard
npm install
npm start
```

### Database Management

The system uses SQLite by default. For production, consider PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@localhost/smartaqua
```

## 📊 Monitoring & Maintenance

### Health Checks

- Backend: `GET /health`
- Frontend: Check http://localhost:3000
- MQTT: Check broker connection

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Backup

```bash
# Backup database
docker-compose exec backend cp smart_aqua.db /backup/smart_aqua_$(date +%Y%m%d).db
```

## 🚨 Troubleshooting

### Common Issues

1. **Services won't start:**
   - Check Docker is running
   - Verify ports 3000, 8000, 1883 are available
   - Check logs: `docker-compose logs`

2. **Frontend can't connect to backend:**
   - Verify `REACT_APP_API_URL` in `.env`
   - Check backend is running on port 8000
   - Check CORS settings

3. **MQTT connection fails:**
   - Verify MQTT broker is running
   - Check MQTT credentials in `.env`
   - Test connection: `mosquitto_pub -h localhost -t test -m "hello"`

4. **Database issues:**
   - Check database file permissions
   - Verify `DATABASE_URL` in `.env`
   - Reset database: `rm backend/smart_aqua.db`

### Performance Optimization

1. **Database:**
   - Regular cleanup of old telemetry data
   - Index optimization for large datasets
   - Consider time-series database for production

2. **Frontend:**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement service worker for offline support

## 🔒 Security

### Production Checklist

- [ ] Change default MQTT credentials
- [ ] Use HTTPS for frontend and API
- [ ] Implement proper authentication
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Backup strategy

### API Security

- Rate limiting
- Input validation
- CORS configuration
- Authentication tokens

## 📈 Scaling

### Horizontal Scaling

- Load balancer for multiple backend instances
- Redis for session management
- Database clustering
- CDN for frontend assets

### Vertical Scaling

- Increase container resources
- Optimize database queries
- Implement caching layers
- Use time-series databases

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/yourusername/smart-aqua/issues)
- **Community**: [Discord/Slack link]

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Frontend powered by [React](https://reactjs.org/)
- Charts by [Recharts](https://recharts.org/)
- Icons by [Lucide](https://lucide.dev/)
- AI by [Google Gemini](https://ai.google.dev/)

---

**Built with ❤️ for sustainable water management**