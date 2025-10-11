# Smart Tank - Intelligent Water Management System

A modern water management system with real-time monitoring, analytics, and visualization for both individual tanks and town-wide water systems.

## Features

- Real-time water tank monitoring
- Flow rate and water quality tracking
- Leak detection algorithms
- Consumption predictions
- Town-wide water management visualization
- AI-powered chat assistant
- Mobile-responsive dashboard

## Architecture

The system consists of:

1. **Backend API** (Node.js Express)
   - MQTT telemetry ingestion
   - SQLite database for storage
   - Real-time analytics
   - REST API endpoints

2. **Frontend Dashboard** (React + TypeScript)
   - Interactive visualizations
   - Real-time updates
   - Responsive design
   - Dark/light mode

3. **ESP32 Firmware** (Arduino)
   - Sensor integration
   - MQTT communication
   - Low-power operation

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smart-tank.git
   cd smart-tank
   ```

2. Start the application using Docker Compose:
   ```bash
   docker-compose up
   ```

3. Access the dashboard at http://localhost:3000

### Manual Setup (without Docker)

#### Backend

```bash
cd backend
npm install
npm start
```

The backend will be available at http://localhost:8000

#### Frontend

```bash
cd dashboard
npm install
npm start
```

The frontend will be available at http://localhost:3000

## Development

### Backend API Endpoints

- `GET /devices/:deviceId/status` - Get current tank status
- `GET /devices/:deviceId/telemetry` - Get historical telemetry data
- `GET /devices/:deviceId/alerts` - Get alerts
- `POST /devices/:deviceId/alerts/:alertId/resolve` - Resolve an alert
- `GET /devices/:deviceId/predictions` - Get consumption predictions
- `POST /chat` - Interact with AI assistant

### Environment Variables

Backend:
- `DATABASE_URL` - SQLite database URL
- `MQTT_BROKER` - MQTT broker address
- `MQTT_PORT` - MQTT broker port
- `MQTT_USER` - MQTT username (optional)
- `MQTT_PASSWORD` - MQTT password (optional)
- `GEMINI_API_KEY` - Google Gemini API key for AI chat

Frontend:
- `REACT_APP_API_URL` - Backend API URL

## Docker Deployment

The project includes Docker configuration for easy deployment:

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
# water-management1
