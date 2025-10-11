#!/usr/bin/env python3
"""
Add sample data to the Smart Tank database for testing
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import SessionLocal, Device, Telemetry, device_status
from sqlalchemy.orm import Session

def add_sample_device(db: Session):
    """Add a sample device to the database"""
    # Check if device already exists
    existing_device = db.query(Device).filter(Device.device_id == "tank01").first()
    if existing_device:
        print("Device tank01 already exists")
        return existing_device
    
    device = Device(
        device_id="tank01",
        tank_height_cm=150.0,
        tank_diameter_cm=100.0,
        tank_capacity_liters=1178.0,
        leak_threshold_percent=1.0,
        overflow_threshold_percent=95.0,
        created_at=datetime.utcnow()
    )
    
    db.add(device)
    db.commit()
    print("Added device tank01")
    return device

def add_sample_telemetry(db: Session):
    """Add sample telemetry data"""
    # Generate sample data for the last 24 hours
    now = datetime.utcnow()
    
    # Start with a tank that's 75% full and gradually decreasing
    base_level = 112.5  # 75% of 150cm
    
    for i in range(24 * 4):  # Every 15 minutes for 24 hours
        timestamp = now - timedelta(minutes=15 * i)
        
        # Simulate gradual water consumption
        level_drop = i * 0.5  # Gradual decrease
        current_level = max(20, base_level - level_drop + random.uniform(-2, 2))
        
        percent_full = (current_level / 150.0) * 100
        
        # Simulate pump turning on when level gets low
        pump_state = "ON" if percent_full < 30 else "OFF"
        
        # Simulate flow rate
        flow_rate = random.uniform(0, 5) if pump_state == "OFF" else random.uniform(10, 20)
        
        telemetry = Telemetry(
            device_id="tank01",
            timestamp=timestamp,
            level_cm=current_level,
            tank_height_cm=150.0,
            percent_full=percent_full,
            flow_l_min=flow_rate,
            pump_state=pump_state,
            temperature_c=random.uniform(20, 25),
            tds_ppm=random.uniform(200, 400)
        )
        
        db.add(telemetry)
    
    db.commit()
    print(f"Added {24 * 4} telemetry records")

def update_device_status():
    """Update the in-memory device status"""
    db = SessionLocal()
    try:
        # Get the latest telemetry
        latest = db.query(Telemetry).filter(
            Telemetry.device_id == "tank01"
        ).order_by(Telemetry.timestamp.desc()).first()
        
        if latest:
            device_status["tank01"] = {
                "current_level": latest.level_cm,
                "percent_full": latest.percent_full,
                "flow_rate": latest.flow_l_min,
                "pump_state": latest.pump_state == "ON",
                "temperature": latest.temperature_c,
                "tds": latest.tds_ppm,
                "last_update": latest.timestamp,
                "days_until_empty": 5.2,  # Sample prediction
                "consumption_today": 45.5,  # Sample consumption
                "consumption_week": 320.0   # Sample weekly consumption
            }
            print("Updated device status in memory")
    finally:
        db.close()

def main():
    """Main function to add sample data"""
    print("Adding sample data to Smart Tank database...")
    
    db = SessionLocal()
    try:
        # Add device
        add_sample_device(db)
        
        # Add telemetry data
        add_sample_telemetry(db)
        
        print("Sample data added successfully!")
        
    except Exception as e:
        print(f"Error adding sample data: {e}")
        db.rollback()
    finally:
        db.close()
    
    # Update in-memory status
    update_device_status()

if __name__ == "__main__":
    main()