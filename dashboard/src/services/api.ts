import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface TankStatus {
  device_id: string;
  current_level: number;
  percent_full: number;
  flow_rate: number;
  pump_state: boolean;
  temperature: number;
  tds: number;
  last_update: string;
  days_until_empty?: number;
  consumption_today?: number;
  consumption_week?: number;
}

export interface TelemetryData {
  timestamp: string;
  level_cm: number;
  percent_full: number;
  flow_l_min: number;
  pump_state: string;
  temperature_c: number;
  tds_ppm: number;
}

export interface Alert {
  id: number;
  alert_type: string;
  message: string;
  timestamp: string;
  level_cm: number;
  percent_full: number;
  resolved: boolean;
}

export interface Prediction {
  date: string;
  predicted_consumption: number;
}

export const api = {
  // Tank status
  getTankStatus: async (deviceId: string): Promise<TankStatus> => {
    try {
      const response = await apiClient.get(`/devices/${deviceId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tank status:', error);
      throw error;
    }
  },

  // Telemetry data
  getTelemetry: async (deviceId: string, hours: number = 24): Promise<TelemetryData[]> => {
    try {
      const response = await apiClient.get(`/devices/${deviceId}/telemetry?hours=${hours}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching telemetry data:', error);
      return []; // Return empty array on error
    }
  },

  // Alerts
  getAlerts: async (deviceId: string, resolved?: boolean): Promise<Alert[]> => {
    try {
      const params = resolved !== undefined ? { resolved } : {};
      const response = await apiClient.get(`/devices/${deviceId}/alerts`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return []; // Return empty array on error
    }
  },

  resolveAlert: async (deviceId: string, alertId: number): Promise<void> => {
    try {
      await apiClient.post(`/devices/${deviceId}/alerts/${alertId}/resolve`);
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  },

  // Predictions
  getPredictions: async (deviceId: string, daysAhead: number = 7): Promise<{ predictions: Prediction[] }> => {
    try {
      const response = await apiClient.get(`/devices/${deviceId}/predictions?days_ahead=${daysAhead}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return { predictions: [] }; // Return empty predictions on error
    }
  },

  // AI Chat
  chatWithAI: async (message: string, context?: any): Promise<{ response: string; timestamp: string }> => {
    try {
      const response = await apiClient.post('/chat', { message, context });
      return response.data;
    } catch (error) {
      console.error('Error with AI chat:', error);
      return {
        response: "Sorry, I'm having trouble connecting to the AI service right now. Please try again later.",
        timestamp: new Date().toISOString()
      };
    }
  },

  // Device control
  setPumpState: async (deviceId: string, state: boolean): Promise<void> => {
    try {
      await apiClient.post('/commands', {
        action: state ? 'PUMP_ON' : 'PUMP_OFF',
        device_id: deviceId
      });
    } catch (error) {
      console.error('Error controlling pump:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking health:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  },

  // List devices
  listDevices: async (): Promise<{ devices: string[]; total_devices: number }> => {
    try {
      const response = await apiClient.get('/devices');
      return response.data;
    } catch (error) {
      console.error('Error listing devices:', error);
      return { devices: [], total_devices: 0 };
    }
  },
};