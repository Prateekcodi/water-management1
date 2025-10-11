"""
SmartAqua Backend API
FastAPI-based backend for apartment water management system

Features:
- MQTT telemetry ingestion
- Real-time data storage
- Predictive analytics
- Alert system with Telegram integration
- REST API for dashboard
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import asyncio
import aiohttp
import paho.mqtt.client as mqtt
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
import statistics
import logging
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

# Configuration
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smart_aqua.db")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="SmartAqua Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client
supabase: Client = None

# Gemini AI client (will be configured after loading env vars)

# In-memory storage (fallback if Supabase not configured)
telemetry_data = {}
alerts = []
predictions = {}

# MQTT Client
mqtt_client = mqtt.Client()

# Event loop for async operations from MQTT thread
event_loop = None

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
    predicted_days_left: Optional[float] = None

class AlertData(BaseModel):
    device_id: str
    timestamp: str
    alert_type: str
    message: str
    severity: str

class PredictionData(BaseModel):
    device_id: str
    predicted_days_left: float
    confidence_level: str
    next_refill_date: str
    daily_average_liters: float

class CommandData(BaseModel):
    action: str
    device_id: str
    parameters: Optional[Dict[str, Any]] = None

class ChatMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    timestamp: str

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
    if device_id not in telemetry_data:
        telemetry_data[device_id] = []

    # Add demo data for missing sensors
    enhanced_data = data.copy()
    enhanced_data.update({
        "temperature_c": 25 + (data.get("percent_full", 50) - 50) * 0.1,  # Temperature varies with water level
        "flow_l_min": max(0, 2.5 - abs(data.get("percent_full", 50) - 50) * 0.05),  # Flow rate based on level
        "pump_state": "ON" if data.get("percent_full", 100) < 80 else "OFF",  # Pump on when low
        "tds_ppm": 150 + (data.get("percent_full", 50) - 50) * 2,  # TDS varies
        "tank_height_cm": 150  # Fixed tank height
    })

    # Store last 1000 readings
    telemetry_data[device_id].append(enhanced_data)
    if len(telemetry_data[device_id]) > 1000:
        telemetry_data[device_id].pop(0)

    # Update predictions
    update_predictions(device_id)

    # Check for alerts
    check_alerts(device_id, enhanced_data)

    logger.info(f"Telemetry received from {device_id}: {data['percent_full']:.1f}% full")

def handle_alert(data: dict):
    """Process incoming alerts"""
    alerts.append(data)
    if len(alerts) > 100:
        alerts.pop(0)

    # Send Telegram notification using event loop
    if event_loop:
        asyncio.run_coroutine_threadsafe(send_telegram_alert(data), event_loop)

    logger.warning(f"Alert received: {data['message']}")

def update_predictions(device_id: str):
    """Update consumption predictions"""
    if device_id not in telemetry_data or len(telemetry_data[device_id]) < 24:
        return

    recent_data = telemetry_data[device_id][-168:]  # Last 7 days (assuming 1 reading/hour)

    if len(recent_data) < 24:
        return

    # Calculate daily consumption
    daily_consumption = []
    current_day_consumption = 0
    current_day = None

    for reading in recent_data:
        reading_date = datetime.fromisoformat(reading['ts'].replace('Z', '+00:00')).date()

        if current_day != reading_date:
            if current_day is not None and current_day_consumption > 0:
                daily_consumption.append(current_day_consumption)
            current_day = reading_date
            current_day_consumption = 0

        # Calculate consumption from level changes (simplified)
        # In production, use flow sensor data
        current_level = reading.get('level_cm', 0)
        if len(daily_consumption) > 0 or current_level > 0:
            current_day_consumption += max(0, 100 - reading.get('percent_full', 0))  # Simplified

    if daily_consumption:
        avg_daily = statistics.mean(daily_consumption)
        current_volume = recent_data[-1].get('level_cm', 0) * 1.5  # Simplified volume calculation

        if avg_daily > 0:
            days_left = current_volume / avg_daily
            confidence = "high" if len(daily_consumption) >= 7 else "medium"

            predictions[device_id] = {
                "predicted_days_left": days_left,
                "confidence_level": confidence,
                "next_refill_date": (datetime.now() + timedelta(days=days_left)).isoformat(),
                "daily_average_liters": avg_daily
            }

def check_alerts(device_id: str, data: dict):
    """Check for alert conditions"""
    percent_full = data.get('percent_full', 100)
    pump_state = data.get('pump_state', 'OFF')
    flow_rate = data.get('flow_l_min', 0)
    leak_detected = data.get('leak_detected', False)
    tds = data.get('tds_ppm', 0)

    alerts_to_send = []

    # Low water alerts
    if percent_full <= 20:
        alerts_to_send.append({
            "device_id": device_id,
            "alert_type": "low_water",
            "message": f"CRITICAL: Tank only {percent_full:.1f}% full!",
            "severity": "high"
        })
    elif percent_full <= 40:
        alerts_to_send.append({
            "device_id": device_id,
            "alert_type": "low_water",
            "message": f"WARNING: Tank {percent_full:.1f}% full - refill soon",
            "severity": "medium"
        })

    # Leak detection
    if leak_detected:
        alerts_to_send.append({
            "device_id": device_id,
            "alert_type": "leak",
            "message": "LEAK DETECTED: Check for water leaks immediately!",
            "severity": "high"
        })

    # Pump fault detection
    if pump_state == "ON" and flow_rate < 0.1:
        alerts_to_send.append({
            "device_id": device_id,
            "alert_type": "pump_fault",
            "message": "PUMP FAULT: Pump running but no flow detected",
            "severity": "high"
        })

    # Water quality
    if tds > 1000:
        alerts_to_send.append({
            "device_id": device_id,
            "alert_type": "water_quality",
            "message": f"Water quality alert: TDS {tds} ppm (above 1000 ppm threshold)",
            "severity": "medium"
        })

    # Send alerts
    for alert in alerts_to_send:
        alert["timestamp"] = datetime.now().isoformat()
        handle_alert(alert)

async def send_telegram_alert(alert_data: dict):
    """Send alert via Telegram"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("Telegram credentials not configured")
        return

    message = f"🚨 SmartAqua Alert\n\n" \
              f"Device: {alert_data['device_id']}\n" \
              f"Type: {alert_data['alert_type']}\n" \
              f"Message: {alert_data['message']}\n" \
              f"Severity: {alert_data['severity']}\n" \
              f"Time: {alert_data['timestamp']}"

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML"
            }) as response:
                if response.status == 200:
                    logger.info("Telegram alert sent successfully")
                else:
                    logger.error(f"Failed to send Telegram alert: {response.status}")
        except Exception as e:
            logger.error(f"Error sending Telegram alert: {e}")

async def chat_with_ai(message: str, context: Dict[str, Any] = None) -> str:
    """Chat with Gemini AI about water tank system using real database data"""
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        return "AI chat is not configured. Please set GEMINI_API_KEY in environment variables."

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        # Get current tank data from database
        tank_data = {}
        if 'tank01' in telemetry_data and telemetry_data['tank01']:
            latest = telemetry_data['tank01'][-1]
            tank_data = {
                "current_level_cm": latest.get("level_cm", 0),
                "percent_full": latest.get("percent_full", 0),
                "temperature_c": latest.get("temperature_c", 25),
                "flow_rate_l_min": latest.get("flow_l_min", 0),
                "pump_state": latest.get("pump_state", "UNKNOWN"),
                "tds_ppm": latest.get("tds_ppm", 0),
                "last_update": latest.get("ts", ""),
                "tank_height_cm": latest.get("tank_height_cm", 150)
            }

        # Get recent telemetry history (last 10 readings)
        recent_readings = []
        if 'tank01' in telemetry_data and len(telemetry_data['tank01']) > 0:
            recent_readings = telemetry_data['tank01'][-10:]

        # Get predictions if available
        predictions_data = predictions.get('tank01', {})

        # Create comprehensive context about the water tank system
        system_context = f"""
        You are an AI assistant for a SmartAqua water tank monitoring system. You have access to real-time data from the tank sensors.

        CURRENT TANK STATUS:
        - Water Level: {tank_data.get('current_level_cm', 0)} cm ({tank_data.get('percent_full', 0)}% full)
        - Temperature: {tank_data.get('temperature_c', 25)}°C
        - Flow Rate: {tank_data.get('flow_rate_l_min', 0)} L/min
        - Pump Status: {tank_data.get('pump_state', 'UNKNOWN')}
        - Water Quality (TDS): {tank_data.get('tds_ppm', 0)} ppm
        - Last Update: {tank_data.get('last_update', 'Never')}

        PREDICTIONS AVAILABLE:
        - Days until empty: {predictions_data.get('predicted_days_left', 'Calculating...')}
        - Daily consumption: {predictions_data.get('daily_average_liters', 0)} liters
        - Confidence level: {predictions_data.get('confidence_level', 'Unknown')}

        RECENT ACTIVITY:
        - Total readings in last 24h: {len(recent_readings)}
        - Average water level: {sum(r.get('percent_full', 0) for r in recent_readings) / max(len(recent_readings), 1):.1f}%

        You help users with:
        - Real-time tank status and alerts
        - Water consumption analysis and predictions
        - System maintenance recommendations
        - Water quality insights
        - Troubleshooting pump and sensor issues
        - Water conservation tips based on usage patterns

        Always provide specific, actionable advice based on the current tank data. Be helpful, accurate, and focus on practical water management solutions.

        IMPORTANT: Respond in plain text only. Do not use any markdown formatting like **bold**, *italics*, or bullet points. Keep responses conversational and easy to read.

        CRITICAL REQUIREMENT: Every single response must end with exactly 4 suggested follow-up questions or actions, formatted as:
        1. [Question 1]
        2. [Question 2]
        3. [Question 3]
        4. [Question 4]

        These suggestions must be relevant to the water tank system and provide useful next steps for the user. Never skip this requirement.
        """

        prompt = f"{system_context}\n\nUser Question: {message}\n\nAI Assistant Response:"

        model = "gemini-2.0-flash-exp"
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                ],
            ),
        ]

        response_text = ""
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
        ):
            response_text += chunk.text

        return response_text.strip()

    except Exception as e:
        logger.error(f"Error with Gemini AI: {e}")
        return f"Sorry, I'm having trouble connecting to the AI service right now. Error: {str(e)}. Please try again later."

# API Endpoints
@app.get("/")
async def root():
    return {"message": "SmartAqua Backend API", "version": "1.0.0"}

@app.post("/chat", response_model=ChatResponse)
async def ai_chat(chat_request: ChatMessage):
    """AI chat endpoint using Gemini"""
    # Get current system context
    context = {}
    if telemetry_data and 'tank01' in telemetry_data and telemetry_data['tank01']:
        latest = telemetry_data['tank01'][-1]
        context = {
            "tank_level": latest.get("percent_full", 0),
            "temperature": latest.get("temperature_c", 25),
            "flow_rate": latest.get("flow_l_min", 0),
            "pump_status": latest.get("pump_state", "UNKNOWN"),
            "tds": latest.get("tds_ppm", 0),
            "last_update": latest.get("ts", "")
        }

    response = await chat_with_ai(chat_request.message, context)
    return ChatResponse(
        response=response,
        timestamp=datetime.now().isoformat()
    )

@app.get("/devices/{device_id}/status")
async def get_device_status(device_id: str):
    if device_id not in telemetry_data or not telemetry_data[device_id]:
        raise HTTPException(status_code=404, detail="Device not found")

    latest = telemetry_data[device_id][-1]
    return {
        "device_id": device_id,
        "current_level": latest.get("level_cm", 0),
        "percent_full": latest.get("percent_full", 0),
        "flow_rate": latest.get("flow_l_min", 0),
        "pump_state": latest.get("pump_state", "UNKNOWN"),
        "temperature": latest.get("temperature_c", 25),
        "tds": latest.get("tds_ppm", 0),
        "last_update": latest.get("ts", ""),
        "days_until_empty": predictions.get(device_id, {}).get("predicted_days_left", 0),
        "consumption_today": 0,  # Calculate from recent data
        "consumption_week": 0    # Calculate from weekly data
    }

@app.get("/devices/{device_id}/telemetry")
async def get_device_telemetry(device_id: str, hours: int = 24):
    if device_id not in telemetry_data:
        raise HTTPException(status_code=404, detail="Device not found")

    # Filter data for the requested time period
    cutoff_time = datetime.now() - timedelta(hours=hours)
    recent_data = []

    for reading in telemetry_data[device_id]:
        try:
            # Parse timestamp and make both datetimes offset-naive for comparison
            reading_time_str = reading['ts'].replace('Z', '+00:00')
            reading_time = datetime.fromisoformat(reading_time_str)
            if reading_time.tzinfo is not None:
                reading_time = reading_time.replace(tzinfo=None)

            cutoff_naive = cutoff_time.replace(tzinfo=None) if cutoff_time.tzinfo else cutoff_time

            if reading_time > cutoff_naive:
                recent_data.append(reading)
        except Exception as e:
            logger.warning(f"Error parsing timestamp {reading.get('ts', 'unknown')}: {e}")
            continue

    return [
        {
            "timestamp": reading["ts"],
            "level_cm": reading.get("level_cm", 0),
            "percent_full": reading.get("percent_full", 0),
            "flow_l_min": reading.get("flow_l_min", 0),
            "pump_state": reading.get("pump_state", "UNKNOWN"),
            "temperature_c": reading.get("temperature_c", 25),
            "tds_ppm": reading.get("tds_ppm", 0)
        }
        for reading in recent_data[-100:]  # Last 100 readings
    ]

@app.get("/devices/{device_id}/predictions")
async def get_device_predictions(device_id: str, days_ahead: int = 7):
    if device_id not in predictions:
        raise HTTPException(status_code=404, detail="No predictions available")

    pred = predictions[device_id]

    # Generate prediction data for the requested days
    predictions_list = []
    base_date = datetime.now()

    for i in range(days_ahead):
        pred_date = base_date + timedelta(days=i)
        # Simplified prediction - in production use more sophisticated models
        predicted_consumption = pred["daily_average_liters"] * (0.9 + 0.2 * (i / days_ahead))  # Vary by day

        predictions_list.append({
            "date": pred_date.strftime("%Y-%m-%d"),
            "predicted_consumption": predicted_consumption
        })

    return {
        "device_id": device_id,
        "predictions": predictions_list,
        "summary": pred
    }

@app.get("/alerts")
async def get_alerts(limit: int = 50):
    return alerts[-limit:]

@app.post("/commands")
async def send_command(command: CommandData, background_tasks: BackgroundTasks):
    """Send command to device via MQTT"""
    topic = f"smartAqua/{command.device_id}/command"

    payload = {
        "action": command.action,
        "timestamp": datetime.now().isoformat(),
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
        "devices": list(telemetry_data.keys()),
        "total_devices": len(telemetry_data)
    }

# MQTT Setup
def setup_mqtt():
    mqtt_client.on_connect = on_mqtt_connect
    mqtt_client.on_message = on_mqtt_message

    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        logger.info("MQTT client started")
    except Exception as e:
        logger.error(f"Failed to connect to MQTT broker: {e}")

# Startup event
@app.on_event("startup")
async def startup_event():
    global supabase, event_loop

    # Set the event loop for MQTT callbacks
    event_loop = asyncio.get_running_loop()

    # Initialize Supabase if credentials are available
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

    if SUPABASE_URL and SUPABASE_ANON_KEY:
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase: {e}")
            supabase = None
    else:
        logger.info("Supabase credentials not found - using in-memory storage")

    # Configure Gemini AI if API key is available
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if GEMINI_API_KEY:
        try:
            # Test the client
            client = genai.Client(api_key=GEMINI_API_KEY)
            logger.info("Gemini AI configured successfully")
        except Exception as e:
            logger.error(f"Failed to configure Gemini AI: {e}")
    else:
        logger.info("Gemini API key not found - AI chat will be disabled")

    # Add demo data for immediate dashboard display
    demo_device = "tank01"
    if demo_device not in telemetry_data:
        telemetry_data[demo_device] = []

        # Add some demo readings
        base_time = datetime.now() - timedelta(hours=24)
        for i in range(24):
            demo_reading = {
                "device_id": demo_device,
                "ts": (base_time + timedelta(hours=i)).isoformat(),
                "level_cm": 120 + (i % 10) * 2,  # Vary level slightly
                "tank_height_cm": 150,
                "percent_full": 80 + (i % 5) * 2,  # 80-88% full
                "flow_l_min": 2.0 + (i % 3) * 0.5,  # 2.0-3.5 L/min
                "pump_state": "ON" if i % 4 != 0 else "OFF",  # Mostly ON
                "temperature_c": 24 + (i % 5),  # 24-28°C
                "tds_ppm": 200 + (i % 20) * 10  # 200-380 ppm
            }
            telemetry_data[demo_device].append(demo_reading)

        # Update predictions with demo data
        update_predictions(demo_device)

    logger.info("SmartAqua Backend started with demo data")
    setup_mqtt()

@app.on_event("shutdown")
async def shutdown_event():
    mqtt_client.loop_stop()
    logger.info("SmartAqua Backend shutting down")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)