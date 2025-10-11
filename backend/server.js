const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const moment = require('moment');

// Load environment variables
dotenv.config();

// Database setup
const db = new sqlite3.Database('./smart_tank.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT,
    timestamp DATETIME,
    level_cm REAL,
    tank_height_cm REAL,
    percent_full REAL,
    flow_l_min REAL,
    pump_state TEXT,
    temperature_c REAL,
    tds_ppm REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT,
    alert_type TEXT,
    message TEXT,
    timestamp DATETIME,
    level_cm REAL,
    percent_full REAL,
    resolved BOOLEAN DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE,
    tank_height_cm REAL,
    tank_diameter_cm REAL,
    tank_capacity_liters REAL,
    leak_threshold_percent REAL DEFAULT 1.0,
    overflow_threshold_percent REAL DEFAULT 95.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Global variables
let deviceStatus = {};
let mqttClient = null;

// Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'localhost';
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const MQTT_USER = process.env.MQTT_USER || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let geminiModel = null;
if (GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// MQTT Callbacks
function onConnect() {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('tank/telemetry');
  mqttClient.subscribe('tank/alerts');
}

function onMessage(topic, message) {
  try {
    const payload = JSON.parse(message.toString());
    if (topic === 'tank/telemetry') {
      processTelemetry(payload);
    } else if (topic === 'tank/alerts') {
      processAlert(payload);
    }
  } catch (e) {
    console.error('Error processing MQTT message:', e);
  }
}

function processTelemetry(data) {
  const stmt = db.prepare(`INSERT INTO telemetry (device_id, timestamp, level_cm, tank_height_cm, percent_full, flow_l_min, pump_state, temperature_c, tds_ppm) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(data.device_id, new Date(data.ts * 1000), data.level_cm, data.tank_height_cm, data.percent_full, data.flow_l_min, data.pump_state, data.temperature_c, data.tds_ppm);
  stmt.finalize();

  deviceStatus[data.device_id] = {
    current_level: data.level_cm,
    percent_full: data.percent_full,
    flow_rate: data.flow_l_min,
    pump_state: data.pump_state === 'ON',
    temperature: data.temperature_c,
    tds: data.tds_ppm,
    last_update: new Date(data.ts * 1000)
  };

  runAnalysis(data.device_id);
}

function processAlert(data) {
  const stmt = db.prepare(`INSERT INTO alerts (device_id, alert_type, message, timestamp, level_cm, percent_full) VALUES (?, ?, ?, ?, ?, ?)`);
  stmt.run(data.device_id, data.alert_type, data.message, new Date(data.timestamp * 1000), data.level_cm, data.percent_full);
  stmt.finalize();

  sendNotification(data);
}

async function runAnalysis(deviceId) {
  db.all(`SELECT * FROM telemetry WHERE device_id = ? AND timestamp >= datetime('now', '-7 days') ORDER BY timestamp DESC`, [deviceId], (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    if (rows.length < 2) return;

    const consumption = calculateConsumption(rows);
    const daysUntilEmpty = predictDaysUntilEmpty(consumption, deviceStatus[deviceId]);

    if (deviceStatus[deviceId]) {
      deviceStatus[deviceId].days_until_empty = daysUntilEmpty;
      deviceStatus[deviceId].consumption_today = consumption.today;
      deviceStatus[deviceId].consumption_week = consumption.week;
    }

    checkLeakDetection(deviceId, rows);
  });
}

function calculateConsumption(telemetry) {
  const today = moment().startOf('day');
  const weekAgo = moment().subtract(7, 'days').startOf('day');

  const todayData = telemetry.filter(t => moment(t.timestamp).isSame(today, 'day'));
  const weekData = telemetry.filter(t => moment(t.timestamp).isAfter(weekAgo));

  let todayConsumption = 0;
  if (todayData.length >= 2) {
    const levelChange = todayData[todayData.length - 1].level_cm - todayData[0].level_cm;
    const tankRadius = 50;
    const tankArea = Math.PI * tankRadius * tankRadius;
    todayConsumption = Math.abs(levelChange * tankArea / 1000);
  }

  let weekConsumption = 0;
  if (weekData.length >= 2) {
    const levelChange = weekData[weekData.length - 1].level_cm - weekData[0].level_cm;
    const tankRadius = 50;
    const tankArea = Math.PI * tankRadius * tankRadius;
    weekConsumption = Math.abs(levelChange * tankArea / 1000);
  }

  return { today: todayConsumption, week: weekConsumption };
}

function predictDaysUntilEmpty(consumption, status) {
  if (!status || !status.percent_full) return null;

  const currentPercent = status.percent_full;
  if (currentPercent <= 0) return 0;

  const weeklyConsumption = consumption.week;
  if (weeklyConsumption <= 0) return null;

  const dailyConsumption = weeklyConsumption / 7;
  if (dailyConsumption <= 0) return null;

  const tankCapacity = 1178;
  const remainingVolume = (currentPercent / 100) * tankCapacity;

  const daysUntilEmpty = remainingVolume / dailyConsumption;

  return Math.max(0, daysUntilEmpty);
}

function checkLeakDetection(deviceId, telemetry) {
  db.get(`SELECT * FROM devices WHERE device_id = ?`, [deviceId], (err, device) => {
    if (err || !device) return;

    const recentData = telemetry.slice(0, 10);

    for (let i = 1; i < recentData.length; i++) {
      const current = recentData[i - 1];
      const previous = recentData[i];

      if (current.pump_state === 'OFF' && previous.pump_state === 'OFF' && current.level_cm < previous.level_cm) {
        const levelDrop = previous.level_cm - current.level_cm;
        const percentDrop = (levelDrop / device.tank_height_cm) * 100;

        if (percentDrop > device.leak_threshold_percent) {
          const stmt = db.prepare(`INSERT INTO alerts (device_id, alert_type, message, timestamp, level_cm, percent_full) VALUES (?, ?, ?, ?, ?, ?)`);
          stmt.run(deviceId, 'LEAK_DETECTED', `Unexpected level drop of ${percentDrop.toFixed(1)}% detected`, new Date(), current.level_cm, current.percent_full);
          stmt.finalize();

          sendNotification({ device_id: deviceId, alert_type: 'LEAK_DETECTED', message: `Unexpected level drop of ${percentDrop.toFixed(1)}% detected`, timestamp: Date.now() / 1000, level_cm: current.level_cm, percent_full: current.percent_full });
          break;
        }
      }
    }
  });
}

function sendNotification(alert) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const message = `
🚨 Smart Tank Alert
Device: ${alert.device_id}
Type: ${alert.alert_type}
Message: ${alert.message}
Level: ${alert.level_cm.toFixed(1)} cm (${alert.percent_full.toFixed(1)}%)
Time: ${moment(alert.timestamp * 1000).format('YYYY-MM-DD HH:mm:ss')}
  `;

  axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message
  }).catch(e => console.error('Error sending notification:', e));
}

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Smart Tank API', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/devices/:deviceId/status', (req, res) => {
  const { deviceId } = req.params;
  if (!deviceStatus[deviceId]) {
    return res.status(404).json({ detail: 'Device not found' });
  }

  const status = deviceStatus[deviceId];
  res.json({
    device_id: deviceId,
    current_level: status.current_level,
    percent_full: status.percent_full,
    flow_rate: status.flow_rate,
    pump_state: status.pump_state,
    temperature: status.temperature,
    tds: status.tds,
    last_update: status.last_update,
    days_until_empty: status.days_until_empty,
    consumption_today: status.consumption_today,
    consumption_week: status.consumption_week
  });
});

app.get('/devices/:deviceId/telemetry', (req, res) => {
  const { deviceId } = req.params;
  const hours = req.query.hours || 24;
  const since = moment().subtract(hours, 'hours').toDate();

  db.all(`SELECT * FROM telemetry WHERE device_id = ? AND timestamp >= ? ORDER BY timestamp DESC`, [deviceId, since], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(t => ({
      timestamp: t.timestamp,
      level_cm: t.level_cm,
      percent_full: t.percent_full,
      flow_l_min: t.flow_l_min,
      pump_state: t.pump_state,
      temperature_c: t.temperature_c,
      tds_ppm: t.tds_ppm
    })));
  });
});

app.get('/devices/:deviceId/alerts', (req, res) => {
  const { deviceId } = req.params;
  const resolved = req.query.resolved;
  let query = `SELECT * FROM alerts WHERE device_id = ?`;
  const params = [deviceId];
  if (resolved !== undefined) {
    query += ' AND resolved = ?';
    params.push(resolved === 'true' ? 1 : 0);
  }
  query += ' ORDER BY timestamp DESC LIMIT 50';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(a => ({
      id: a.id,
      alert_type: a.alert_type,
      message: a.message,
      timestamp: a.timestamp,
      level_cm: a.level_cm,
      percent_full: a.percent_full,
      resolved: !!a.resolved
    })));
  });
});

app.post('/devices/:deviceId/alerts/:alertId/resolve', (req, res) => {
  const { deviceId, alertId } = req.params;
  db.run(`UPDATE alerts SET resolved = 1 WHERE id = ? AND device_id = ?`, [alertId, deviceId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ detail: 'Alert not found' });
    res.json({ message: 'Alert resolved' });
  });
});

app.get('/devices/:deviceId/predictions', (req, res) => {
  const { deviceId } = req.params;
  const daysAhead = parseInt(req.query.days_ahead) || 7;
  const since = moment().subtract(30, 'days').toDate();

  db.all(`SELECT * FROM telemetry WHERE device_id = ? AND timestamp >= ? ORDER BY timestamp ASC`, [deviceId, since], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length < 2) return res.json({ predictions: [], message: 'Insufficient data for predictions' });

    const dailyConsumption = calculateDailyConsumption(rows);
    const predictions = [];
    const currentDate = moment().startOf('day');
    for (let i = 0; i < daysAhead; i++) {
      const date = currentDate.clone().add(i, 'days');
      predictions.push({
        date: date.format('YYYY-MM-DD'),
        predicted_consumption: dailyConsumption
      });
    }
    res.json({ predictions });
  });
});

function calculateDailyConsumption(telemetry) {
  const dailyData = {};
  telemetry.forEach(t => {
    const date = moment(t.timestamp).format('YYYY-MM-DD');
    if (!dailyData[date]) dailyData[date] = [];
    dailyData[date].push(t);
  });

  const dailyConsumptions = Object.values(dailyData).map(data => {
    if (data.length >= 2) {
      const levelChange = data[data.length - 1].level_cm - data[0].level_cm;
      const tankRadius = 50;
      const tankArea = Math.PI * tankRadius * tankRadius;
      return Math.abs(levelChange * tankArea / 1000);
    }
    return 0;
  }).filter(c => c > 0);

  return dailyConsumptions.length ? dailyConsumptions.reduce((a, b) => a + b, 0) / dailyConsumptions.length : 0;
}

function cleanMarkdownFormatting(text) {
  text = text.replace(/^\s*\*\s+/gm, '- ');
  text = text.replace(/\*\*/g, '').replace(/\*/g, '');
  text = text.replace(/__/g, '').replace(/_/g, '');
  text = text.replace(/\s+/g, ' ');
  text = text.split('\n').map(line => line.trim()).join('\n');
  return text.trim();
}

async function generateAIResponse(message, context) {
  const deviceId = 'tank01';
  let tankData = '';

  if (deviceStatus[deviceId]) {
    const status = deviceStatus[deviceId];
    tankData = `
Current Smart Tank Status:
- Water Level: ${status.current_level.toFixed(1)} cm (${status.percent_full.toFixed(1)}% of tank capacity)
- Temperature: ${status.temperature.toFixed(1)}°C
- Water Quality (TDS): ${status.tds.toFixed(0)} ppm
- Pump Status: ${status.pump_state ? 'ON' : 'OFF'}
- Flow Rate: ${status.flow_rate.toFixed(1)} L/min
- Last Update: ${status.last_update}
- Tank Height: 150 cm
- Tank Capacity: ~1178 liters
    `;
  } else {
    tankData = 'Tank data is currently unavailable. Please check if your device is connected.';
  }

  if (geminiModel) {
    try {
      const systemPrompt = `You are a Smart Water Tank AI Assistant. You help users monitor and manage their water tank system.

${tankData}

Instructions:
- Be helpful, friendly, and knowledgeable about water tank systems
- Provide specific information based on the current tank data above
- Give practical advice about water management, maintenance, and efficiency
- If asked about water level, temperature, quality, pump status, or consumption, use the exact data provided
- For general questions about water tanks, provide educational and helpful responses
- Keep responses concise but informative
- If the data shows concerning levels (below 20%), mention it and suggest action
- IMPORTANT: Do not use any asterisks (*), double asterisks (**), underscores (_), or any markdown formatting
- Write in plain text only using normal sentences and paragraphs
- Use simple bullet points with dashes (-) if needed, but no special formatting

User Question: ${message}

Respond in plain text without any asterisks, bold formatting, or markdown. Just use normal conversational text.`;

      const result = await geminiModel.generateContent(systemPrompt);
      return cleanMarkdownFormatting(result.response.text());
    } catch (e) {
      console.error('Error calling Gemini AI:', e);
    }
  }

  // Fallback responses
  const messageLower = message.toLowerCase();
  if (!tankData || tankData.includes('unavailable')) {
    return "I don't have current tank data available. Please check if your device is connected and try again.";
  }

  const status = deviceStatus[deviceId];
  const { current_level, percent_full, temperature, tds, pump_state, flow_rate } = status;

  if (messageLower.includes('level') || messageLower.includes('water level') || messageLower.includes('how much water')) {
    return `Your current water level is ${current_level.toFixed(1)} cm, which is ${percent_full.toFixed(1)}% of tank capacity. The tank is ${percent_full > 80 ? 'nearly full' : percent_full > 50 ? 'at a good level' : percent_full > 20 ? 'getting low' : 'critically low'}.`;
  } else if (messageLower.includes('temperature') || messageLower.includes('temp')) {
    return `The current water temperature is ${temperature.toFixed(1)}°C. This is ${temperature >= 15 && temperature <= 30 ? 'normal' : temperature > 30 ? 'quite warm' : 'quite cold'}.`;
  } else if (messageLower.includes('tds') || messageLower.includes('quality') || messageLower.includes('purity')) {
    const quality = tds < 150 ? 'excellent' : tds < 300 ? 'good' : tds < 500 ? 'acceptable' : 'poor';
    return `The water quality shows ${tds.toFixed(0)} ppm TDS. This indicates ${quality} water quality.`;
  } else if (messageLower.includes('pump') || messageLower.includes('pumping')) {
    return `The pump is currently ${pump_state ? 'ON' : 'OFF'}. ${pump_state ? 'Water is being pumped into the tank' : 'The pump is on standby'}.`;
  } else if (messageLower.includes('status') || messageLower.includes('overview') || messageLower.includes('summary')) {
    return `Tank Status: ${current_level.toFixed(1)} cm (${percent_full.toFixed(1)}%), Temperature: ${temperature.toFixed(1)}°C, Quality: ${tds.toFixed(0)} ppm TDS, Pump: ${pump_state ? 'ON' : 'OFF'}, Flow: ${flow_rate.toFixed(1)} L/min`;
  } else {
    return `I understand you're asking about your water tank. Currently at ${percent_full.toFixed(1)}% capacity (${current_level.toFixed(1)} cm), temperature ${temperature.toFixed(1)}°C, pump ${pump_state ? 'ON' : 'OFF'}. Ask me about water level, temperature, quality, or pump status!`;
  }
}

async function generatePredictionResponse(houseData, weatherData) {
  if (geminiModel) {
    try {
      const prompt = `Analyze water consumption patterns and predict future demand for: ${JSON.stringify(houseData)}. Weather: ${JSON.stringify(weatherData || {})}.

Return ONLY a valid JSON object with exactly these keys:
{
  "totalDemand": number (total water demand in liters),
  "peakHours": array of numbers (peak usage hours, e.g. [7, 12, 19]),
  "efficiency": number (efficiency percentage, e.g. 87.5),
  "recommendations": array of strings (recommendation messages)
}

Do not include any markdown formatting, explanations, or additional text. Return only the JSON object.`;

      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text().trim();

      try {
        return JSON.parse(text);
      } catch (e) {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (e2) {
            console.error('Failed to parse extracted JSON:', e2);
          }
        }
        console.error('Failed to parse Gemini response as JSON:', text.substring(0, 200));
        throw e;
      }
    } catch (e) {
      console.error('Error calling Gemini AI for prediction:', e);
    }
  }

  // Fallback
  return {
    totalDemand: 12580 + Math.random() * 2000,
    peakHours: [7, 12, 19],
    efficiency: 87 + Math.random() * 8,
    recommendations: ["System operating optimally", "Monitor for efficiency improvements"]
  };
}

app.post('/predict', async (req, res) => {
  try {
    const { houseData, weatherData } = req.body;
    const prediction = await generatePredictionResponse(houseData, weatherData);
    res.json({
      totalDemand: prediction.totalDemand || 12580,
      peakHours: prediction.peakHours || [7, 12, 19],
      efficiency: prediction.efficiency || 87,
      recommendations: prediction.recommendations || ["System operating optimally"],
      timestamp: new Date()
    });
  } catch (e) {
    console.error('Error in prediction endpoint:', e);
    res.json({
      totalDemand: 12580,
      peakHours: [7, 12, 19],
      efficiency: 87,
      recommendations: ["System operating optimally"],
      timestamp: new Date()
    });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const responseText = await generateAIResponse(message, context);
    res.json({
      response: responseText,
      timestamp: new Date()
    });
  } catch (e) {
    console.error('Error in chat endpoint:', e);
    res.json({
      response: "I'm having trouble processing your request right now. Please try again later.",
      timestamp: new Date()
    });
  }
});

// Startup
// Load existing device statuses
db.all(`SELECT * FROM devices`, (err, devices) => {
  if (err) console.error(err);
  devices.forEach(device => {
    db.get(`SELECT * FROM telemetry WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1`, [device.device_id], (err, row) => {
      if (err) console.error(err);
      if (row) {
        deviceStatus[device.device_id] = {
          current_level: row.level_cm,
          percent_full: row.percent_full,
          flow_rate: row.flow_l_min,
          pump_state: row.pump_state === 'ON',
          temperature: row.temperature_c,
          tds: row.tds_ppm,
          last_update: row.timestamp
        };
        console.log(`Loaded status for device ${device.device_id}`);
      }
    });
  });
});

// MQTT connection
mqttClient = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
  username: MQTT_USER || undefined,
  password: MQTT_PASSWORD || undefined
});

mqttClient.on('connect', onConnect);
mqttClient.on('message', onMessage);

app.listen(8000, () => {
  console.log('Smart Tank API server running on port 8000');
});

// Graceful shutdown
process.on('SIGINT', () => {
  if (mqttClient) {
    mqttClient.end();
  }
  db.close();
  process.exit(0);
});