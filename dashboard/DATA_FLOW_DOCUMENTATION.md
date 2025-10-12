# SmartAqua Water Management System - Data Flow Documentation

## 🏗️ System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Python)      │◄──►│   (Supabase)    │
│   Port: 3003    │    │   Port: 8000    │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Sensors   │    │   AI Service    │    │   Blockchain    │
│   (ESP32)       │    │   (Gemini)      │    │   (Ethereum)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Data Sources & Flow

### 1. **IoT Sensors (ESP32)**
- **Water Level Sensor**: Ultrasonic sensor measuring tank depth
- **Temperature Sensor**: DS18B20 measuring water temperature
- **pH Sensor**: Analog sensor measuring water acidity
- **Turbidity Sensor**: Optical sensor measuring water clarity
- **Flow Sensor**: Hall effect sensor measuring water flow rate

**Data Flow**: ESP32 → MQTT Broker → Backend API → Supabase Database

### 2. **Supabase Database Tables**

#### **Users Table**
```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- full_name (VARCHAR)
- role (ENUM: 'admin', 'user')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **Homes Table**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- name (VARCHAR)
- address (TEXT)
- town_id (UUID, Foreign Key → towns.id)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(user_id) -- Users can only have one home
```

#### **Alerts Table**
```sql
- id (UUID, Primary Key)
- home_id (UUID, Foreign Key → homes.id)
- alert_type (ENUM: 'LEAK_DETECTED', 'OVERFLOW', 'PUMP_FAULT', 'LOW_LEVEL')
- message (TEXT)
- level_cm (DECIMAL)
- percent_full (DECIMAL)
- resolved (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **Sensor Data Table**
```sql
- id (UUID, Primary Key)
- home_id (UUID, Foreign Key → homes.id)
- water_level (DECIMAL)
- temperature (DECIMAL)
- ph_level (DECIMAL)
- turbidity (DECIMAL)
- timestamp (TIMESTAMP)
```

#### **Blockchain Data Table**
```sql
- id (UUID, Primary Key)
- home_id (UUID, Foreign Key → homes.id)
- transaction_hash (VARCHAR)
- block_number (BIGINT)
- gas_used (BIGINT)
- timestamp (TIMESTAMP)
```

### 3. **Data Flow Paths**

#### **Real-time Sensor Data Flow**
```
ESP32 Sensors → MQTT Broker → Backend API → Supabase → Frontend
     ↓              ↓            ↓           ↓         ↓
  Raw Data    →  Processed  →  Validated  →  Stored  →  Displayed
```

#### **User Authentication Flow**
```
Frontend → Supabase Auth → JWT Token → Protected Routes
    ↓           ↓             ↓            ↓
  Login    →  Verify    →  Store Token →  Access Data
```

#### **AI Chat Data Flow**
```
User Input → Frontend → Backend API → Gemini AI → Supabase Context → Response
     ↓         ↓           ↓           ↓            ↓              ↓
  Question →  Send    →  Process   →  AI Model  →  User Data   →  Answer
```

## 🔄 Component Data Flow

### **Dashboard Component**
```typescript
// Data Sources
- Supabase: Real-time sensor data
- Backend API: Historical data
- Local State: UI state management

// Data Flow
useEffect(() => {
  fetchSensorData() → setSensorData()
  fetchAlerts() → setAlerts()
  fetchAnalytics() → setAnalytics()
}, [])
```

### **Town View Component**
```typescript
// Data Sources
- Supabase: All homes data
- 3D Visualization: Real-time rendering
- User Interaction: Click events

// Data Flow
useEffect(() => {
  fetchAllHomes() → setHomes()
  calculateTownStats() → setTownStats()
}, [])
```

### **AI Chat Component**
```typescript
// Data Sources
- Supabase: User's home data
- Gemini AI: AI responses
- Voice Recognition: Speech input

// Data Flow
handleSendMessage() → {
  getUserData() → sendToAI() → getResponse() → displayResponse()
}
```

## 🎯 Business Logic

### **Water Level Monitoring**
```typescript
if (waterLevel < 30) {
  createAlert('LOW_LEVEL', 'Water level below 30%')
} else if (waterLevel > 90) {
  createAlert('OVERFLOW', 'Tank nearly full')
}
```

### **Leak Detection**
```typescript
const expectedUsage = calculateExpectedUsage(historicalData)
const actualUsage = currentReading - previousReading
if (actualUsage > expectedUsage * 1.5) {
  createAlert('LEAK_DETECTED', 'Unusual water usage detected')
}
```

### **User Role Management**
```typescript
// Admin: Can see all data
if (user.role === 'admin') {
  showAllHomes()
  showAllAlerts()
  showAllUsers()
}

// User: Can only see own data
if (user.role === 'user') {
  showOwnHome()
  showOwnAlerts()
  restrictToOneHome()
}
```

## 🔐 Security & Permissions

### **Row Level Security (RLS)**
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own homes" ON homes
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see everything
CREATE POLICY "Admins can view all homes" ON homes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### **API Security**
- JWT tokens for authentication
- CORS protection
- Rate limiting
- Input validation

## 📱 Frontend State Management

### **Authentication Context**
```typescript
const AuthContext = {
  user: User | null
  session: Session | null
  signIn: (email, password) => Promise
  signUp: (email, password, name) => Promise
  signOut: () => Promise
  isAdmin: boolean
  isUser: boolean
}
```

### **Theme Context**
```typescript
const ThemeContext = {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}
```

## 🎨 3D Visualizations

### **Water Tank 3D**
- Real-time water level visualization
- Temperature color coding
- Leak detection animations
- Interactive controls

### **Town View 3D**
- 3D building representations
- Water level indicators
- Rain particle effects
- Click-to-inspect functionality

## 🔄 Real-time Updates

### **WebSocket Connections**
- MQTT for sensor data
- Supabase real-time subscriptions
- Automatic UI updates

### **Polling Strategy**
- Critical data: 1-second intervals
- Regular data: 30-second intervals
- Analytics: 5-minute intervals

## 📊 Analytics & Reporting

### **Water Usage Analytics**
- Daily, monthly, yearly consumption
- Peak usage hours
- Seasonal patterns
- Cost analysis

### **System Health Monitoring**
- Sensor accuracy tracking
- Alert frequency analysis
- System uptime monitoring
- Performance metrics

## 🚀 Deployment Architecture

```
┌─────────────────┐
│   Cloudflare    │
│   (CDN)         │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Vercel        │
│   (Frontend)    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Railway       │
│   (Backend)     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │
│   (Database)    │
└─────────────────┘
```

## 🔧 Environment Variables

```env
# Supabase
REACT_APP_SUPABASE_URL=https://nywdoakinnaeguhulxhk.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API
REACT_APP_API_URL=http://localhost:8000

# AI Service
REACT_APP_GEMINI_API_KEY=your_gemini_key

# MQTT Broker
REACT_APP_MQTT_BROKER_URL=mqtt://localhost:1883
```

## 📈 Performance Optimizations

1. **Database Indexing**: Optimized queries with proper indexes
2. **Caching**: React Query for data caching
3. **Lazy Loading**: Code splitting for better performance
4. **3D Optimization**: LOD (Level of Detail) for 3D models
5. **Real-time Efficiency**: Selective subscriptions

## 🧪 Testing Strategy

1. **Unit Tests**: Component logic testing
2. **Integration Tests**: API integration testing
3. **E2E Tests**: Full user journey testing
4. **Performance Tests**: Load and stress testing
5. **3D Tests**: WebGL and Three.js testing

This documentation provides a comprehensive overview of how data flows through the SmartAqua system, from IoT sensors to the user interface, ensuring transparency and maintainability.