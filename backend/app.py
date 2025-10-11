"""
SmartAqua Backend API - Consolidated FastAPI Backend
FastAPI-based backend for apartment water management system

Features:
- MQTT telemetry ingestion
- Real-time data storage with SQLite
- Predictive analytics
- Alert system with Telegram integration
- REST API for dashboard
- AI chat integration with Gemini
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import asyncio
import aiohttp
import paho.mqtt.client as mqtt
from concurrent.futures import ThreadPoolExecutor
import statistics
import logging
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configuration
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER = os.getenv("MQTT_USER", "")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smart_aqua.db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models
class Telemetry(Base):
    __tablename__ = "telemetry"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True)
    timestamp = Column(DateTime, index=True)
    level_cm = Column(Float)
    tank_height_cm = Column(Float)
    percent_full = Column(Float)
    flow_l_min = Column(Float)
    pump_state = Column(String)
    temperature_c = Column(Float)
    tds_ppm = Column(Float)
    battery_v = Column(Float, default=0)
    leak_detected = Column(Boolean, default=False)

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True)
    alert_type = Column(String)
    message = Column(String)
    timestamp = Column(DateTime, index=True)
    level_cm = Column(Float)
    percent_full = Column(Float)
    resolved = Column(Boolean, default=False)
    severity = Column(String, default="medium")

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True)
    tank_height_cm = Column(Float, default=150)
    tank_diameter_cm = Column(Float, default=100)
    tank_capacity_liters = Column(Float, default=1178)
    leak_threshold_percent = Column(Float, default=1.0)
    overflow_threshold_percent = Column(Float, default=95.0)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(
    title="SmartAqua Backend API",
    description="API for Smart Water Tank monitoring and prediction system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class TelemetryData(BaseModel):
    device_id: str
    ts: str
    level_cm: float
    tank_height_cm: float
    percent_full: float
    flow_l_min: float
    pump_state: str
    tds_ppm: Optional[float] = None
    battery_v: Optional[float] = None
    leak_detected: Optional[bool] = None
    temperature_c: Optional[float] = None

class AlertData(BaseModel):
    device_id: str
    timestamp: str
    alert_type: str
    message: str
    severity: str

class TankStatus(BaseModel):
    device_id: str
    current_level: float
    percent_full: float
    flow_rate: float
    pump_state: bool
    temperature: float
    tds: float
    last_update: str
    days_until_empty: Optional[float] = None
    consumption_today: Optional[float] = None
    consumption_week: Optional[float] = None

class ChatMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    timestamp: str

class CommandData(BaseModel):
    action: str
    device_id: str
    parameters: Optional[Dict[str, Any]] = None

# Global variables
mqtt_client = None
device_status = {}
event_loop = None

# Gemini AI setup
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        logger.info("Gemini AI initialized successfully")
    except Exception as e:
        gemini_model = None
        logger.error(f"Could not initialize Gemini model: {e}")
else:
    gemini_model = None
    logger.warning("Gemini API key not found. AI chat will use fallback responses.")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# MQTT Callbacks
def on_mqtt_connect(client, userdata, flags, rc):
    logger.info(f"Connected to MQTT broker with result code {rc}")
    client.subscribe("smartAqua/+/telemetry")
    client.subscribe("smartAqua/+/alert")

def on_mqtt_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        topic_parts = msg.topic.split("/")

        if len(topic_parts) >= 3:
            device_id = topic_parts[1]
            message_type = topic_parts[2]

            if message_type == "telemetry":
                handle_telemetry(device_id, payload)
            elif message_type == "alert":
                handle_alert(payload)

    except Exception as e:
        logger.error(f"Error processing MQTT message: {e}")

def handle_telemetry(device_id: str, data: dict):
    """Process incoming telemetry data"""
    try:
        db = SessionLocal()
        
        # Add missing fields with realistic defaults
        enhanced_data = data.copy()
        enhanced_data.update({
            "temperature_c": enhanced_data.get("temperature_c", 25 + (data.get("percent_full", 50) - 50) * 0.1),
            "flow_l_min": enhanced_data.get("flow_l_min", max(0, 2.5 - abs(data.get("percent_full", 50) - 50) * 0.05)),
            "pump_state": enhanced_data.get("pump_state", "ON" if data.get("percent_full", 100) < 80 else "OFF"),
            "tds_ppm": enhanced_data.get("tds_ppm", 150 + (data.get("percent_full", 50) - 50) * 2),
            "tank_height_cm": enhanced_data.get("tank_height_cm", 150),
            "battery_v": enhanced_data.get("battery_v", 3.7),
            "leak_detected": enhanced_data.get("leak_detected", False)
        })

        # Store in database
        telemetry = Telemetry(
            device_id=device_id,
            timestamp=datetime.fromisoformat(data["ts"].replace('Z', '+00:00')),
            level_cm=enhanced_data["level_cm"],
            tank_height_cm=enhanced_data["tank_height_cm"],
            percent_full=enhanced_data["percent_full"],
            flow_l_min=enhanced_data["flow_l_min"],
            pump_state=enhanced_data["pump_state"],
            temperature_c=enhanced_data["temperature_c"],
            tds_ppm=enhanced_data["tds_ppm"],
            battery_v=enhanced_data["battery_v"],
            leak_detected=enhanced_data["leak_detected"]
        )
        
        db.add(telemetry)
        db.commit()
        
        # Update device status
        device_status[device_id] = {
            "current_level": enhanced_data["level_cm"],
            "percent_full": enhanced_data["percent_full"],
            "flow_rate": enhanced_data["flow_l_min"],
            "pump_state": enhanced_data["pump_state"] == "ON",
            "temperature": enhanced_data["temperature_c"],
            "tds": enhanced_data["tds_ppm"],
            "last_update": data["ts"]
        }
        
        # Run analysis
        asyncio.create_task(run_analysis(device_id))
        
        db.close()
        logger.info(f"Telemetry processed for {device_id}: {enhanced_data['percent_full']:.1f}% full")
        
    except Exception as e:
        logger.error(f"Error processing telemetry: {e}")

def handle_alert(data: dict):
    """Process incoming alerts"""
    try:
        db = SessionLocal()
        
        alert = Alert(
            device_id=data["device_id"],
            alert_type=data["alert_type"],
            message=data["message"],
            timestamp=datetime.fromisoformat(data["timestamp"].replace('Z', '+00:00')),
            level_cm=data.get("level_cm", 0),
            percent_full=data.get("percent_full", 0),
            severity=data.get("severity", "medium")
        )
        
        db.add(alert)
        db.commit()
        
        # Send notification
        if event_loop:
            asyncio.run_coroutine_threadsafe(send_telegram_alert(alert), event_loop)
        
        db.close()
        logger.warning(f"Alert processed: {data['message']}")
        
    except Exception as e:
        logger.error(f"Error processing alert: {e}")

async def run_analysis(device_id: str):
    """Run prediction and leak detection analysis"""
    try:
        db = SessionLocal()
        
        # Get recent telemetry data
        recent_data = db.query(Telemetry).filter(
            Telemetry.device_id == device_id,
            Telemetry.timestamp >= datetime.utcnow() - timedelta(days=7)
        ).order_by(Telemetry.timestamp.desc()).all()
        
        if len(recent_data) < 2:
            db.close()
            return
        
        # Calculate consumption and predictions
        consumption_data = calculate_consumption(recent_data)
        days_until_empty = predict_days_until_empty(consumption_data, device_status.get(device_id, {}))
        
        # Update device status with predictions
        if device_id in device_status:
            device_status[device_id]["days_until_empty"] = days_until_empty
            device_status[device_id]["consumption_today"] = consumption_data.get("today", 0)
            device_status[device_id]["consumption_week"] = consumption_data.get("week", 0)
        
        # Check for leaks
        await check_leak_detection(device_id, recent_data)
        
        db.close()
        
    except Exception as e:
        logger.error(f"Error in analysis: {e}")

def calculate_consumption(telemetry_data: List[Telemetry]) -> Dict[str, float]:
    """Calculate consumption from telemetry data"""
    if len(telemetry_data) < 2:
        return {"today": 0, "week": 0}
    
    # Calculate daily consumption
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    
    today_data = [t for t in telemetry_data if t.timestamp.date() == today]
    week_data = [t for t in telemetry_data if t.timestamp.date() >= week_ago]
    
    # Calculate consumption from level changes
    today_consumption = 0
    if len(today_data) >= 2:
        level_change = today_data[-1].level_cm - today_data[0].level_cm
        # Convert to liters (assuming circular tank)
        tank_radius = 50  # cm - should be from device config
        tank_area = 3.14159 * tank_radius * tank_radius
        today_consumption = abs(level_change * tank_area / 1000)  # Convert to liters
    
    week_consumption = 0
    if len(week_data) >= 2:
        level_change = week_data[-1].level_cm - week_data[0].level_cm
        tank_radius = 50  # cm
        tank_area = 3.14159 * tank_radius * tank_radius
        week_consumption = abs(level_change * tank_area / 1000)
    
    return {
        "today": today_consumption,
        "week": week_consumption
    }

def predict_days_until_empty(consumption_data: Dict[str, float], device_status: Dict[str, Any]) -> Optional[float]:
    """Predict days until tank is empty"""
    if not device_status or "percent_full" not in device_status:
        return None
    
    current_percent = device_status["percent_full"]
    if current_percent <= 0:
        return 0
    
    # Use weekly average consumption
    weekly_consumption = consumption_data.get("week", 0)
    if weekly_consumption <= 0:
        return None
    
    daily_consumption = weekly_consumption / 7
    if daily_consumption <= 0:
        return None
    
    # Calculate remaining volume
    tank_capacity = 1178  # liters - should be from device config
    remaining_volume = (current_percent / 100) * tank_capacity
    
    days_until_empty = remaining_volume / daily_consumption
    
    return max(0, days_until_empty)

async def check_leak_detection(device_id: str, telemetry_data: List[Telemetry]):
    """Check for potential leaks"""
    if len(telemetry_data) < 2:
        return
    
    # Get device configuration
    db = SessionLocal()
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        db.close()
        return
    
    # Check for unexpected level drops when pump is off
    recent_data = telemetry_data[:10]  # Last 10 readings
    
    for i in range(1, len(recent_data)):
        current = recent_data[i-1]
        previous = recent_data[i]
        
        # If pump was off and level dropped significantly
        if (current.pump_state == "OFF" and 
            previous.pump_state == "OFF" and
            current.level_cm < previous.level_cm):
            
            level_drop = previous.level_cm - current.level_cm
            percent_drop = (level_drop / device.tank_height_cm) * 100
            
            if percent_drop > device.leak_threshold_percent:
                # Create leak alert
                alert = Alert(
                    device_id=device_id,
                    alert_type="LEAK_DETECTED",
                    message=f"Unexpected level drop of {percent_drop:.1f}% detected",
                    timestamp=datetime.utcnow(),
                    level_cm=current.level_cm,
                    percent_full=current.percent_full,
                    severity="high"
                )
                
                db.add(alert)
                db.commit()
                
                # Send notification
                if event_loop:
                    asyncio.run_coroutine_threadsafe(send_telegram_alert(alert), event_loop)
                
                break
    
    db.close()

async def send_telegram_alert(alert: Alert):
    """Send alert via Telegram"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    
    message = f"""
🚨 SmartAqua Alert
Device: {alert.device_id}
Type: {alert.alert_type}
Message: {alert.message}
Level: {alert.level_cm:.1f} cm ({alert.percent_full:.1f}%)
Time: {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
"""
    
    try:
        async with aiohttp.ClientSession() as session:
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
            async with session.post(url, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message
            }) as response:
                if response.status == 200:
                    logger.info("Telegram alert sent successfully")
                else:
                    logger.error(f"Failed to send Telegram alert: {response.status}")
    except Exception as e:
        logger.error(f"Error sending Telegram alert: {e}")

async def chat_with_ai(message: str, context: Dict[str, Any] = None) -> str:
    """Chat with Gemini AI about water tank system"""
    if not gemini_model:
        return "AI chat is not configured. Please set GEMINI_API_KEY in environment variables."
    
    try:
        # Get current tank data
        tank_data = {}
        if 'tank01' in device_status:
            status = device_status['tank01']
            tank_data = {
                "current_level_cm": status.get("current_level", 0),
                "percent_full": status.get("percent_full", 0),
                "temperature_c": status.get("temperature", 25),
                "flow_rate_l_min": status.get("flow_rate", 0),
                "pump_state": "ON" if status.get("pump_state", False) else "OFF",
                "tds_ppm": status.get("tds", 0),
                "last_update": status.get("last_update", ""),
                "days_until_empty": status.get("days_until_empty", 0)
            }

        system_prompt = f"""You are an AI assistant for a SmartAqua water tank monitoring system. You have access to real-time data from the tank sensors.

CURRENT TANK STATUS:
- Water Level: {tank_data.get('current_level_cm', 0)} cm ({tank_data.get('percent_full', 0)}% full)
- Temperature: {tank_data.get('temperature_c', 25)}°C
- Flow Rate: {tank_data.get('flow_rate_l_min', 0)} L/min
- Pump Status: {tank_data.get('pump_state', 'UNKNOWN')}
- Water Quality (TDS): {tank_data.get('tds_ppm', 0)} ppm
- Days Until Empty: {tank_data.get('days_until_empty', 0)} days
- Last Update: {tank_data.get('last_update', 'Never')}

You help users with:
- Real-time tank status and alerts
- Water consumption analysis and predictions
- System maintenance recommendations
- Water quality insights
- Troubleshooting pump and sensor issues
- Water conservation tips based on usage patterns

Always provide specific, actionable advice based on the current tank data. Be helpful, accurate, and focus on practical water management solutions.

IMPORTANT: Respond in plain text only. Do not use any markdown formatting like **bold**, *italics*, or bullet points. Keep responses conversational and easy to read.

User Question: {message}

AI Assistant Response:"""

        response = gemini_model.generate_content(system_prompt)
        return response.text.strip()

    except Exception as e:
        logger.error(f"Error with Gemini AI: {e}")
        return f"Sorry, I'm having trouble connecting to the AI service right now. Error: {str(e)}. Please try again later."

# API Endpoints
@app.get("/")
async def root():
    return {"message": "SmartAqua Backend API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/devices/{device_id}/status", response_model=TankStatus)
async def get_device_status(device_id: str, db: Session = Depends(get_db)):
    """Get current status of a device"""
    if device_id not in device_status:
        # Return default status if device not found
        return TankStatus(
            device_id=device_id,
            current_level=0,
            percent_full=0,
            flow_rate=0,
            pump_state=False,
            temperature=25,
            tds=0,
            last_update=datetime.utcnow().isoformat(),
            days_until_empty=None,
            consumption_today=0,
            consumption_week=0
        )
    
    status = device_status[device_id]
    
    return TankStatus(
        device_id=device_id,
        current_level=status["current_level"],
        percent_full=status["percent_full"],
        flow_rate=status["flow_rate"],
        pump_state=status["pump_state"],
        temperature=status["temperature"],
        tds=status["tds"],
        last_update=status["last_update"],
        days_until_empty=status.get("days_until_empty"),
        consumption_today=status.get("consumption_today"),
        consumption_week=status.get("consumption_week")
    )

@app.get("/devices/{device_id}/telemetry")
async def get_device_telemetry(device_id: str, hours: int = 24, db: Session = Depends(get_db)):
    """Get telemetry data for a device"""
    since = datetime.utcnow() - timedelta(hours=hours)
    
    telemetry = db.query(Telemetry).filter(
        Telemetry.device_id == device_id,
        Telemetry.timestamp >= since
    ).order_by(Telemetry.timestamp.desc()).limit(100).all()
    
    return [
        {
            "timestamp": t.timestamp.isoformat(),
            "level_cm": t.level_cm,
            "percent_full": t.percent_full,
            "flow_l_min": t.flow_l_min,
            "pump_state": t.pump_state,
            "temperature_c": t.temperature_c,
            "tds_ppm": t.tds_ppm
        }
        for t in telemetry
    ]

@app.get("/devices/{device_id}/alerts")
async def get_alerts(device_id: str, resolved: Optional[bool] = None, db: Session = Depends(get_db)):
    """Get alerts for a device"""
    query = db.query(Alert).filter(Alert.device_id == device_id)
    
    if resolved is not None:
        query = query.filter(Alert.resolved == resolved)
    
    alerts = query.order_by(Alert.timestamp.desc()).limit(50).all()
    
    return [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "message": a.message,
            "timestamp": a.timestamp.isoformat(),
            "level_cm": a.level_cm,
            "percent_full": a.percent_full,
            "resolved": a.resolved,
            "severity": a.severity
        }
        for a in alerts
    ]

@app.post("/devices/{device_id}/alerts/{alert_id}/resolve")
async def resolve_alert(device_id: str, alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as resolved"""
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.device_id == device_id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.resolved = True
    db.commit()
    
    return {"message": "Alert resolved"}

@app.get("/devices/{device_id}/predictions")
async def get_device_predictions(device_id: str, days_ahead: int = 7, db: Session = Depends(get_db)):
    """Get consumption predictions for a device"""
    # Get historical data
    since = datetime.utcnow() - timedelta(days=30)
    telemetry = db.query(Telemetry).filter(
        Telemetry.device_id == device_id,
        Telemetry.timestamp >= since
    ).order_by(Telemetry.timestamp.asc()).all()
    
    if len(telemetry) < 2:
        return {"predictions": [], "message": "Insufficient data for predictions"}
    
    # Calculate daily consumption
    daily_consumption = calculate_daily_consumption(telemetry)
    
    # Generate predictions
    predictions = []
    current_date = datetime.utcnow().date()
    
    for i in range(days_ahead):
        date = current_date + timedelta(days=i)
        predicted_consumption = daily_consumption
        predictions.append({
            "date": date.isoformat(),
            "predicted_consumption": predicted_consumption
        })
    
    return {"predictions": predictions}

def calculate_daily_consumption(telemetry: List[Telemetry]) -> float:
    """Calculate average daily consumption from telemetry data"""
    if len(telemetry) < 2:
        return 0
    
    # Group by date and calculate daily consumption
    daily_data = {}
    for t in telemetry:
        date = t.timestamp.date()
        if date not in daily_data:
            daily_data[date] = []
        daily_data[date].append(t)
    
    daily_consumptions = []
    for date, data in daily_data.items():
        if len(data) >= 2:
            level_change = data[-1].level_cm - data[0].level_cm
            # Convert to liters (assuming circular tank)
            tank_radius = 50  # cm
            tank_area = 3.14159 * tank_radius * tank_radius
            consumption = abs(level_change * tank_area / 1000)
            daily_consumptions.append(consumption)
    
    return sum(daily_consumptions) / len(daily_consumptions) if daily_consumptions else 0

@app.post("/chat", response_model=ChatResponse)
async def ai_chat(chat_request: ChatMessage):
    """AI chat endpoint using Gemini"""
    response = await chat_with_ai(chat_request.message, chat_request.context)
    return ChatResponse(
        response=response,
        timestamp=datetime.utcnow().isoformat()
    )

@app.post("/commands")
async def send_command(command: CommandData, background_tasks: BackgroundTasks):
    """Send command to device via MQTT"""
    topic = f"smartAqua/{command.device_id}/command"
    
    payload = {
        "action": command.action,
        "timestamp": datetime.utcnow().isoformat(),
        "parameters": command.parameters or {}
    }
    
    try:
        mqtt_client.publish(topic, json.dumps(payload))
        return {"status": "success", "message": f"Command sent to {command.device_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send command: {str(e)}")

@app.get("/devices")
async def list_devices():
    return {
        "devices": list(device_status.keys()),
        "total_devices": len(device_status)
    }

# MQTT Setup
def setup_mqtt():
    global mqtt_client
    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_mqtt_connect
    mqtt_client.on_message = on_mqtt_message

    if MQTT_USER and MQTT_PASSWORD:
        mqtt_client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        logger.info("MQTT client started")
    except Exception as e:
        logger.error(f"Failed to connect to MQTT broker: {e}")

# Startup event
@app.on_event("startup")
async def startup_event():
    global event_loop
    
    # Set the event loop for MQTT callbacks
    event_loop = asyncio.get_running_loop()
    
    # Add demo data for immediate dashboard display
    demo_device = "tank01"
    if demo_device not in device_status:
        # Create demo device in database
        db = SessionLocal()
        try:
            # Check if device exists
            existing_device = db.query(Device).filter(Device.device_id == demo_device).first()
            if not existing_device:
                device = Device(
                    device_id=demo_device,
                    tank_height_cm=150,
                    tank_diameter_cm=100,
                    tank_capacity_liters=1178
                )
                db.add(device)
                db.commit()
                logger.info(f"Created demo device: {demo_device}")
            
            # Add some demo telemetry data
            base_time = datetime.utcnow() - timedelta(hours=24)
            for i in range(24):
                demo_reading = Telemetry(
                    device_id=demo_device,
                    timestamp=base_time + timedelta(hours=i),
                    level_cm=120 + (i % 10) * 2,
                    tank_height_cm=150,
                    percent_full=80 + (i % 5) * 2,
                    flow_l_min=2.0 + (i % 3) * 0.5,
                    pump_state="ON" if i % 4 != 0 else "OFF",
                    temperature_c=24 + (i % 5),
                    tds_ppm=200 + (i % 20) * 10,
                    battery_v=3.7,
                    leak_detected=False
                )
                db.add(demo_reading)
            
            db.commit()
            
            # Update device status
            device_status[demo_device] = {
                "current_level": 125.0,
                "percent_full": 83.3,
                "flow_rate": 2.5,
                "pump_state": True,
                "temperature": 26.0,
                "tds": 250.0,
                "last_update": datetime.utcnow().isoformat(),
                "days_until_empty": 12.5,
                "consumption_today": 45.2,
                "consumption_week": 316.4
            }
            
        except Exception as e:
            logger.error(f"Error setting up demo data: {e}")
        finally:
            db.close()

    logger.info("SmartAqua Backend started with demo data")
    setup_mqtt()

@app.on_event("shutdown")
async def shutdown_event():
    if mqtt_client:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        logger.info("MQTT client stopped")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)