/*
 * SmartAqua ESP32 Tank Monitor - Updated with Your Working Ultrasonic Code!
 */

// ========== CHANGE THESE SETTINGS ==========
const char* WIFI_SSID = "Prateek";           // Your WiFi name
const char* WIFI_PASSWORD = "prateekpal";   // Your WiFi password
const char* MQTT_SERVER = "broker.hivemq.com";  // Public MQTT broker
#define DEVICE_ID "tank01"                         // Unique ID for your tank
// ============================================

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Pin definitions - YOUR WORKING PINS
#define TRIG_PIN 13  // D13
#define ECHO_PIN 12  // D12
#define RELAY_PIN 26

// Tank configuration - YOUR MEASUREMENTS
#define DISTANCE_EMPTY 5.0   // distance from sensor to water when tank is empty
#define DISTANCE_FULL  100.0 // distance from sensor to water when tank is full
#define TANK_HEIGHT_CM 150.0
#define TANK_AREA_M2 1.5

// Timing
#define TELEMETRY_INTERVAL 1000  // Send data every 1 second

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Global variables
float tankLevelCm = 0.0;
float tankPercent = 0.0;
bool pumpState = false;
unsigned long lastTelemetry = 0;
float lastTankLevelCm = 0.0;
unsigned long lastFlowCalc = 0;
float flowRateLMin = 0.0;

void setup() {
  Serial.begin(115200);
  Serial.println("\n🚀 SmartAqua ESP32 Starting...");

  // Initialize pins - YOUR WORKING PIN SETUP
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);  // Pump off by default

  // Connect to WiFi
  setupWiFi();

  // Setup MQTT
  mqttClient.setServer(MQTT_SERVER, 1883);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();

  // Initialize flow calculation
  lastFlowCalc = millis();

  Serial.println("✅ Setup complete! ESP32 is ready.");
}

void loop() {
  // Keep MQTT connection alive
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  unsigned long currentMillis = millis();

  // Read ultrasonic sensor every 5 seconds
  static unsigned long lastSensorRead = 0;
  if (currentMillis - lastSensorRead >= 5000) {
    readUltrasonicSensor();
    lastSensorRead = currentMillis;
  }

  // Send telemetry every 1 second
  if (currentMillis - lastTelemetry >= TELEMETRY_INTERVAL) {
    sendTelemetry();
    lastTelemetry = currentMillis;
  }

  digitalWrite(2, WiFi.status() == WL_CONNECTED ? HIGH : LOW);
}

void setupWiFi() {
  Serial.print("📡 Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("📍 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
  }
}

void connectMQTT() {
  Serial.println("🔗 Connecting to MQTT...");

  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");

    if (mqttClient.connect(DEVICE_ID)) {
      Serial.println("✅ Connected to MQTT!");
      mqttClient.subscribe("smartAqua/tank01/command");
    } else {
      Serial.print("❌ Failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" - trying again in 5 seconds");
      delay(5000);
    }
  }
}

// YOUR WORKING ULTRASONIC CODE
float getDistanceCM() {
  // Trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Read echo
  long duration = pulseIn(ECHO_PIN, HIGH);

  // Convert to cm
  float distance = duration * 0.034 / 2;
  return distance;
}

void readUltrasonicSensor() {
  float distance = getDistanceCM();

  // Clamp distance to empty/full range
  if(distance > DISTANCE_FULL) distance = DISTANCE_FULL;
  if(distance < DISTANCE_EMPTY) distance = DISTANCE_EMPTY;

  // Calculate tank % full using YOUR WORKING FORMULA
  tankPercent = ((DISTANCE_FULL - distance) / (DISTANCE_FULL - DISTANCE_EMPTY)) * 100.0;

  // Store distance measured
  tankLevelCm = distance;

  // Constrain to valid range
  tankPercent = constrain(tankPercent, 0.0, 100.0);

  // Calculate flow rate based on level change (simplified)
  unsigned long currentMillis = millis();
  if (lastFlowCalc > 0) {
    float timeDiffHours = (currentMillis - lastFlowCalc) / 3600000.0; // Convert to hours
    if (timeDiffHours > 0) {
      float levelChangeCm = lastTankLevelCm - tankLevelCm; // Positive = water added
      if (levelChangeCm > 0) { // Water level increased
        float volumeChangeLiters = levelChangeCm * TANK_AREA_M2 * 1000.0; // Convert m³ to liters
        flowRateLMin = volumeChangeLiters / (timeDiffHours * 60.0); // Convert to L/min
      } else {
        flowRateLMin = 0.0; // No inflow
      }
    }
  }
  lastTankLevelCm = tankLevelCm;
  lastFlowCalc = currentMillis;

  // Control pump based on tank level
  if (tankPercent < 20.0) {
    pumpState = true;  // Turn pump ON when tank is low
    digitalWrite(RELAY_PIN, HIGH);
  } else if (tankPercent > 80.0) {
    pumpState = false; // Turn pump OFF when tank is full
    digitalWrite(RELAY_PIN, LOW);
  }
  // Keep current state if between 20-80%

  Serial.print("📏 Distance: ");
  Serial.print(distance);
  Serial.print(" cm, Tank Full: ");
  Serial.print(tankPercent);
  Serial.print(" %, Flow: ");
  Serial.print(flowRateLMin);
  Serial.print(" L/min, Pump: ");
  Serial.println(pumpState ? "ON" : "OFF");
}

void sendTelemetry() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }

  // Create JSON payload
  DynamicJsonDocument doc(512);

  doc["device_id"] = DEVICE_ID;
  doc["ts"] = getTimestamp();
  doc["level_cm"] = tankLevelCm;
  doc["tank_height_cm"] = TANK_HEIGHT_CM;
  doc["percent_full"] = tankPercent;
  doc["flow_l_min"] = flowRateLMin;
  doc["pump_state"] = pumpState ? "ON" : "OFF";
  doc["tds_ppm"] = 0;
  doc["battery_v"] = 3.3;

  // Convert to string
  String jsonString;
  serializeJson(doc, jsonString);

  // Publish to MQTT
  if (mqttClient.publish("smartAqua/tank01/telemetry", jsonString.c_str())) {
    Serial.println("📤 Telemetry sent successfully!");
    Serial.println("Data: " + jsonString);
  } else {
    Serial.println("❌ Failed to send telemetry");
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.println("📨 MQTT Command Received!");

  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  DynamicJsonDocument doc(256);
  DeserializationError error = deserializeJson(doc, message);

  if (!error) {
    String action = doc["action"];

    if (action == "PUMP_ON") {
      pumpState = true;
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("🔄 Pump turned ON");
    } else if (action == "PUMP_OFF") {
      pumpState = false;
      digitalWrite(RELAY_PIN, LOW);
      Serial.println("🔄 Pump turned OFF");
    }
  }
}

String getTimestamp() {
  time_t now;
  time(&now);
  char buf[sizeof "2025-09-27T10:00:00Z"];
  strftime(buf, sizeof buf, "%Y-%m-%dT%H:%M:%SZ", gmtime(&now));
  return String(buf);
}