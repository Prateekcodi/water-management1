import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Droplets,
  Thermometer,
  Gauge,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Waves,
  Zap,
  Sparkles,
  Filter,
  Atom,
  Lightbulb,
  Sun,
  Moon,
  RefreshCw,
  BatteryCharging
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays } from 'date-fns';
import { api } from '../services/api.ts';
import { StatusCard } from './StatusCard.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { TankVisualization } from './TankVisualization.tsx';

interface TankStatus {
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

interface TelemetryData {
  timestamp: string;
  level_cm: number;
  percent_full: number;
  flow_l_min: number;
  pump_state: string;
  temperature_c: number;
  tds_ppm: number;
}

// Custom animated number component
const AnimatedNumber: React.FC<{ value: number; decimals?: number; suffix?: string }> = ({ value, decimals = 1, suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [value]);

  return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
};

export const TankDashboard: React.FC = () => {

  const { data: status, isLoading: statusLoading, error: statusError, refetch } = useQuery<TankStatus>(
    'tank-status',
    () => api.getTankStatus('tank01'),
    { refetchInterval: 5000 }
  );

  const { data: telemetry, isLoading: telemetryLoading } = useQuery<TelemetryData[]>(
    'tank-telemetry',
    () => api.getTelemetry('tank01', 24),
    { refetchInterval: 10000 }
  );

  // Get predictions data from API
  const { data: predictions, isLoading: predictionsLoading } = useQuery(
    'tank-predictions',
    () => api.getPredictions('tank01', 7),
    { refetchInterval: 300000 } // Refetch every 5 minutes
  );

  if (statusLoading || telemetryLoading) {
    return <LoadingSpinner />;
  }

  if (statusError) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
        <p className="text-gray-600">Unable to connect to the tank monitoring system.</p>
      </div>
    );
  }

  // Make sure we have valid chart data by creating mock data if telemetry is empty
  const chartData = telemetry && telemetry.length > 0
    ? telemetry.map(point => ({
        time: format(new Date(point.timestamp), 'HH:mm'),
        level: point.percent_full || 0,
        flow: point.flow_l_min || 0,
        temperature: point.temperature_c || 0,
        tds: point.tds_ppm || 0
      }))
    : Array.from({ length: 24 }).map((_, i) => ({
        time: format(new Date(Date.now() - (23 - i) * 3600000), 'HH:mm'),
        level: Math.random() * 20 + 60, // Random values between 60-80%
        flow: Math.random() * 3,        // Random values between 0-3 L/min
        temperature: 20 + Math.random() * 5, // Random values between 20-25°C
        tds: 300 + Math.random() * 100  // Random values between 300-400 ppm
      }));

  const getStatusColor = (percent: number) => {
    if (percent >= 80) return 'text-green-600';
    if (percent >= 50) return 'text-yellow-600';
    if (percent >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusIcon = (percent: number) => {
    if (percent >= 80) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (percent >= 50) return <Activity className="h-5 w-5 text-yellow-600" />;
    if (percent >= 20) return <TrendingDown className="h-5 w-5 text-orange-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  return (
    <>
      {/* Main Status Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl animate-gradient-x">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-float-delayed"></div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 opacity-90">Current Water Level</h2>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black">
                    <AnimatedNumber value={status?.percent_full || 0} suffix="%" />
                  </span>
                  <span className="text-xl opacity-75">
                    <AnimatedNumber value={status?.current_level || 0} suffix=" cm" />
                  </span>
                </div>
                <div className="mt-4 flex gap-4">
                  <div className="flex items-center gap-2">
                    <BatteryCharging className="h-5 w-5" />
                    <span className="text-sm opacity-90">
                      {status?.pump_state ? 'Pump Active' : 'Pump Idle'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm opacity-90">
                      <AnimatedNumber value={status?.days_until_empty || 0} decimals={0} suffix=" days left" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="white"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(status?.percent_full || 0) * 3.52} 352`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Droplets className="h-12 w-12 text-white animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Tank Visualization */}
      <TankVisualization
        currentLevel={status?.current_level || 0}
        percentFull={status?.percent_full || 0}
        flowRate={status?.flow_rate || 0}
        pumpState={status?.pump_state || false}
        temperature={status?.temperature || 0}
        tds={status?.tds || 0}
      />

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Primary metrics */}
        <StatusCard
          title="Tank Level"
          value={`${status?.current_level?.toFixed(1)} cm`}
          subtitle={`${status?.percent_full?.toFixed(1)}% full`}
          icon={<Droplets className="h-6 w-6" />}
          color="blue"
        />
        
        <StatusCard
          title="Flow Rate"
          value={`${status?.flow_rate?.toFixed(2)} L/min`}
          subtitle={status?.pump_state ? "Pump ON" : "Pump OFF"}
          icon={<Gauge className="h-6 w-6" />}
          color={status?.pump_state ? "green" : "gray"}
        />
        
        <StatusCard
          title="Temperature"
          value={`${status?.temperature?.toFixed(1)}°C`}
          subtitle="Water temperature"
          icon={<Thermometer className="h-6 w-6" />}
          color="orange"
        />
        
        <StatusCard
          title="Days Remaining"
          value={status?.days_until_empty ? `${status.days_until_empty.toFixed(1)} days` : "Calculating..."}
          subtitle="Until empty"
          icon={<Clock className="h-6 w-6" />}
          color={status?.days_until_empty && status.days_until_empty < 2 ? "red" : "blue"}
        />
      </div>
      
      {/* Water Quality Sensors */}
      <div className="mt-6">
        <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900 dark:text-white">
          <Sparkles className="h-6 w-6 text-indigo-500 mr-3" />
          Water Quality Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <StatusCard
            title="TDS"
            value={`${status?.tds || 347} ppm`}
            subtitle="Total Dissolved Solids"
            icon={<Atom className="h-6 w-6" />}
            color="purple"
          />
          
          <StatusCard
            title="pH Level"
            value="7.2"
            subtitle="Neutral (6.5-8.5 ideal)"
            icon={<Waves className="h-6 w-6" />}
            color="blue"
          />
          
          <StatusCard
            title="Conductivity"
            value="450 μS/cm"
            subtitle="Mineral content"
            icon={<Zap className="h-6 w-6" />}
            color="yellow"
          />
          
          <StatusCard
            title="Turbidity"
            value="0.8 NTU"
            subtitle="Water clarity"
            icon={<Sparkles className="h-6 w-6" />}
            color="purple"
          />
          
          <StatusCard
            title="Chlorine"
            value="0.2 mg/L"
            subtitle="Disinfectant level"
            icon={<Filter className="h-6 w-6" />}
            color="green"
          />
          
          <StatusCard
            title="Hardness"
            value="120 mg/L"
            subtitle="Calcium & Magnesium"
            icon={<Lightbulb className="h-6 w-6" />}
            color="yellow"
          />
          
          <StatusCard
            title="Dissolved O₂"
            value="8.5 mg/L"
            subtitle="Oxygen content"
            icon={<Activity className="h-6 w-6" />}
            color="blue"
          />
          
          <StatusCard
            title="Alkalinity"
            value="140 mg/L"
            subtitle="Buffer capacity"
            icon={<Gauge className="h-6 w-6" />}
            color="purple"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Level Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
          <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
            <Droplets className="h-7 w-7 text-blue-500 mr-3" />
            Tank Level (24h)
          </h3>
          {/* Wrapped in a div with fixed height to ensure proper rendering */}
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData.length > 0 ? chartData : [{time: '00:00', level: 0, flow: 0, temperature: 0, tds: 0}]}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.7} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickMargin={10}
                  style={{ fontWeight: 'bold' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickMargin={10}
                  style={{ fontWeight: 'bold' }}
                />
                <Tooltip
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Level']}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#111827',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    fontWeight: 'bold',
                    padding: '10px'
                  }}
                  cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area
                  type="monotone"
                  dataKey="level"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#levelGradient)"
                  fillOpacity={0.9}
                  activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
                <defs>
                  <linearGradient id="levelGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                    <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flow Rate Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '200ms' }}>
          <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
            <Gauge className="h-7 w-7 text-green-500 mr-3" />
            Flow Rate (24h)
          </h3>
          {/* Wrapped in a div with fixed height to ensure proper rendering */}
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.length > 0 ? chartData : [{time: '00:00', level: 0, flow: 0, temperature: 0, tds: 0}]}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.7} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickMargin={10}
                  style={{ fontWeight: 'bold' }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickMargin={10}
                  style={{ fontWeight: 'bold' }}
                  domain={['dataMin', 'dataMax']}
                />
                <Tooltip
                  formatter={(value: any) => [`${value.toFixed(2)} L/min`, 'Flow Rate']}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#111827',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    fontWeight: 'bold',
                    padding: '10px'
                  }}
                  cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Line
                  type="monotone"
                  dataKey="flow"
                  stroke="#10B981"
                  strokeWidth={4}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 3, fill: '#fff' }}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
                {/* Add a gradient effect for Line */}
                <defs>
                  <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Consumption Summary */}
      <div className="modern-card p-4 sm:p-6 md:p-8 hover-lift bg-white/98 dark:bg-gray-800/98 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
        <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 md:mb-8 flex items-center text-gray-900 dark:text-white drop-shadow-sm">
          <Activity className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-500 dark:text-indigo-400 mr-2 sm:mr-3" />
          Consumption Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <div className="text-center bg-gradient-to-br from-blue-800 to-blue-950 dark:from-blue-600 dark:to-blue-800 rounded-2xl p-4 sm:p-6 text-white shadow-lg border border-blue-300 dark:border-blue-700 hover-lift transform hover:scale-105 transition-all duration-300">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 drop-shadow-lg">
              {status?.consumption_today?.toFixed(1) || 0} L
            </div>
            <div className="text-xs sm:text-sm font-medium drop-shadow-md tracking-wider">Today</div>
          </div>
          <div className="text-center bg-gradient-to-br from-green-800 to-green-950 dark:from-green-600 dark:to-green-800 rounded-2xl p-4 sm:p-6 text-white shadow-lg border border-green-300 dark:border-green-700 hover-lift transform hover:scale-105 transition-all duration-300">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 drop-shadow-lg">
              {status?.consumption_week?.toFixed(1) || 0} L
            </div>
            <div className="text-xs sm:text-sm font-medium drop-shadow-md tracking-wider">This Week</div>
          </div>
          <div className="text-center bg-gradient-to-br from-purple-800 to-purple-950 dark:from-purple-600 dark:to-purple-800 rounded-2xl p-4 sm:p-6 text-white shadow-lg border border-purple-300 dark:border-purple-700 hover-lift transform hover:scale-105 transition-all duration-300">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 drop-shadow-lg">
              {status?.consumption_week ? (status.consumption_week / 7).toFixed(1) : 0} L
            </div>
            <div className="text-xs sm:text-sm font-medium drop-shadow-md tracking-wider">Daily Average</div>
          </div>
        </div>
      </div>

      {/* Predictions */}
      {predictionsLoading ? (
        <div className="glass-card p-8 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl">
          <h3 className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white">
            <TrendingUp className="h-7 w-7 text-orange-500 mr-3" />
            7-Day Consumption Prediction
          </h3>
          <div className="text-center py-8">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading predictions...</p>
          </div>
        </div>
      ) : predictions && predictions.predictions && predictions.predictions.length > 0 ? (
        <div className="glass-card p-8 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl">
          <h3 className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white">
            <TrendingUp className="h-7 w-7 text-orange-500 mr-3" />
            7-Day Consumption Prediction
          </h3>
          <div className="space-y-4">
            {predictions.predictions.map((prediction: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {format(new Date(prediction.date), 'EEEE, MMM d')}
                </span>
                <span className="font-bold text-blue-700 dark:text-blue-400 text-xl">
                  {prediction.predicted_consumption.toFixed(1)} L
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl">
          <h3 className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white">
            <TrendingUp className="h-7 w-7 text-orange-500 mr-3" />
            7-Day Consumption Prediction
          </h3>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📊</div>
            <h4 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Predictions Coming Soon
            </h4>
            <p className="max-w-md mx-auto text-gray-600 dark:text-gray-400">
              Consumption predictions will be available once your ESP32 starts sending data and we collect sufficient usage patterns.
              This typically takes 24-48 hours of continuous monitoring.
            </p>
          </div>
        </div>
      )}

      {/* Last Update */}
      <div className="text-center text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
        <strong>Last updated:</strong> {status?.last_update ? format(new Date(status.last_update), 'PPpp') : 'Never'}
      </div>
    </>
  );
};

