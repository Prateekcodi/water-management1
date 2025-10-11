#!/usr/bin/env python3
"""
Initialize database with sample data for testing
"""

from sqlalchemy.orm import sessionmaker
from main import engine, Device, Telemetry, device_status
from datetime import datetime, timedelta
import random

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Add device
    device = Device(
        device_id="tank01",
        tank_height_cm=200.0,
        tank_diameter_cm=100.0,
        tank_capacity_liters=1570.0,
        leak_threshold_percent=1.0,
        overflow_threshold_percent=95.0
    )
    db.add(device)
    db.commit()

    # Add sample telemetry data for the last 24 hours
    base_time = datetime.utcnow() - timedelta(hours=24)
    level = 150.0  # Start at 150cm

    for i in range(24):
        timestamp = base_time + timedelta(hours=i)
        # Simulate some consumption (level decreases slightly)
        level -= random.uniform(0.1, 0.5)
        level = max(level, 50.0)  # Don't go below 50cm

        telemetry = Telemetry(
            device_id="tank01",
            timestamp=timestamp,
            level_cm=level,
            tank_height_cm=200.0,
            percent_full=(level / 200.0) * 100,
            flow_l_min=random.uniform(0.5, 2.0),
            pump_state="OFF" if random.random() > 0.3 else "ON",
            temperature_c=random.uniform(20.0, 30.0),
            tds_ppm=random.uniform(50.0, 200.0)
        )
        db.add(telemetry)

    db.commit()

    # Update device_status with latest data
    latest_telemetry = db.query(Telemetry).filter(Telemetry.device_id == "tank01").order_by(Telemetry.timestamp.desc()).first()
    if latest_telemetry:
        device_status["tank01"] = {
            "current_level": latest_telemetry.level_cm,
            "percent_full": latest_telemetry.percent_full,
            "flow_rate": latest_telemetry.flow_l_min,
            "pump_state": latest_telemetry.pump_state == "ON",
            "temperature": latest_telemetry.temperature_c,
            "tds": latest_telemetry.tds_ppm,
            "last_update": latest_telemetry.timestamp
        }

    print("Sample data initialized successfully")

except Exception as e:
    print(f"Error initializing data: {e}")
    db.rollback()

finally:
    db.close()