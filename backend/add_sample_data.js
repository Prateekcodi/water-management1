const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');

// Database setup
const db = new sqlite3.Database('./smart_tank.db');

console.log('Adding sample data to Smart Tank database...');

// Add device
db.run(`INSERT OR IGNORE INTO devices (device_id, tank_height_cm, tank_diameter_cm, tank_capacity_liters, leak_threshold_percent, overflow_threshold_percent)
        VALUES (?, ?, ?, ?, ?, ?)`,
       ['tank01', 150.0, 100.0, 1178.0, 1.0, 95.0], function(err) {
  if (err) {
    console.error('Error adding device:', err);
  } else {
    console.log('Added device tank01');
  }
});

// Add sample telemetry data for the last 24 hours
const now = moment();
const baseLevel = 112.5; // 75% of 150cm

for (let i = 0; i < 24 * 4; i++) { // Every 15 minutes for 24 hours
  const timestamp = now.clone().subtract(15 * i, 'minutes').toDate();

  // Simulate gradual water consumption
  const levelDrop = i * 0.5;
  const currentLevel = Math.max(20, baseLevel - levelDrop + (Math.random() - 0.5) * 4);

  const percentFull = (currentLevel / 150.0) * 100;

  // Simulate pump turning on when level gets low
  const pumpState = percentFull < 30 ? 'ON' : 'OFF';

  // Simulate flow rate
  const flowRate = pumpState === 'OFF' ? Math.random() * 5 : 10 + Math.random() * 10;

  db.run(`INSERT INTO telemetry (device_id, timestamp, level_cm, tank_height_cm, percent_full, flow_l_min, pump_state, temperature_c, tds_ppm)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         ['tank01', timestamp, currentLevel, 150.0, percentFull, flowRate, pumpState,
          20 + Math.random() * 5, 200 + Math.random() * 200]);
}

console.log(`Added ${24 * 4} telemetry records`);

// Close database
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Sample data added successfully!');
    console.log('Please restart the backend server to load the new data.');
  }
});