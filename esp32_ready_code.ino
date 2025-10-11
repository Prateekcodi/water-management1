/*
 * SmartAqua ESP32 Tank Monitor - Ready to Use!
 * Copy this entire code and paste it into Arduino IDE
 *
 * SETUP INSTRUCTIONS:
 * 1. Install ESP32 board support in Arduino IDE
 * 2. Install these libraries: WiFi, PubSubClient, NewPing, ArduinoJson
 * 3. Change WiFi credentials below
 * 4. Upload to ESP32
 * 5. Open Serial Monitor to see connection status
 */

// ========== CHANGE THESE SETTINGS ==========
const char* WIFI_SSID = "YOUR_WIFI_NAME";           // Your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";   // Your WiFi password
const char* MQTT_SERVER = "192.168.1.100";         // Computer running backend (check ipconfig/ifconfig)
#define DEVICE_ID "tank01"                         // Unique ID for your tank
// ============================================

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Pin definitions - UPDATED FOR YOUR WORKING CONFIG
#define TRIG_PIN 13  // D13
#define ECHO_PIN 12  // D12
#define RELAY_PIN 26

// Tank configuration - UPDATED FOR YOUR MEASUREMENTS
#define DISTANCE_EMPTY 5.0   // distance from sensor to water when tank is empty
#define DISTANCE_FULL  100.0 // distance from sensor to water when tank is full
#define TANK_HEIGHT_CM 150.0
#define TANK_AREA_M2 1.5

// Timing
#define TELEMETRY_INTERVAL 30000  // Send data every 30 seconds

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Global variables
float tankLevelCm = 0.0;
float tankPercent = 0.0;
bool pumpState = false;
unsigned long lastTelemetry = 0;
unsigned long lastFlowCheck = 0;
int flowPulseCount = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("\n🚀 SmartAqua ESP32 Starting...");

  // Initialize pins
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

  // Send telemetry every 30 seconds
  if (currentMillis - lastTelemetry >= TELEMETRY_INTERVAL) {
    sendTelemetry();
    lastTelemetry = currentMillis;
  }

  // Status LED
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
    Serial.println("Check your WiFi credentials and try again.");
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

  // Calculate tank % full using your working formula
  tankPercent = ((DISTANCE_FULL - distance) / (DISTANCE_FULL - DISTANCE_EMPTY)) * 100.0;

  // Calculate water level in cm
  tankLevelCm = distance;  // Distance measured

  // Constrain to valid range
  tankPercent = constrain(tankPercent, 0.0, 100.0);

  Serial.print("📏 Distance: ");
  Serial.print(distance);
  Serial.print(" cm, Tank Full: ");
  Serial.print(tankPercent);
  Serial.println(" %");
}

void sendTelemetry() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }

  // Create JSON payload
  DynamicJsonDocument doc(512);

  doc["device_id"] = DEVICE_ID;
  doc["ts"] = getTimestamp();
  doc["level_cm"] = tankLevelCm;  // Distance measured
  doc["tank_height_cm"] = TANK_HEIGHT_CM;
  doc["percent_full"] = tankPercent;  // Correct percentage calculation
  doc["flow_l_min"] = 0.0;
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
  Serial.println("📨 MQTT Message Received!");

  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println("Topic: " + String(topic));
  Serial.println("Message: " + message);

  // Parse JSON command
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
    } else if (action == "RESTART") {
      Serial.println("🔄 Restarting ESP32...");
      ESP.restart();
    }
  }
}

String getTimestamp() {
  // Simple timestamp (you can add RTC for better timestamps)
  time_t now;
  time(&now);
  char buf[sizeof "2025-09-27T10:00:00Z"];
  strftime(buf, sizeof buf, "%Y-%m-%dT%H:%M:%SZ", gmtime(&now));
  return String(buf);
}

// Flow sensor interrupt (uncomment if you have flow sensor)
/*
void IRAM_ATTR flowPulseISR() {
  flowPulseCount++;
}
*/