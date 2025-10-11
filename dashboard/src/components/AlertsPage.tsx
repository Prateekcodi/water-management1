import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Droplets, X, Filter, TrendingUp, Bell, BellOff } from 'lucide-react';

interface Alert {
  id: number;
  alert_type: string;
  message: string;
  timestamp: string;
  level_cm: number;
  percent_full: number;
  resolved: boolean;
}

type AlertType = 'LEAK_DETECTED' | 'OVERFLOW' | 'PUMP_FAULT' | 'LOW_LEVEL';

export default function AlertsPage() {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('time');
  const [showResolved, setShowResolved] = useState(true);

  // Mock data - replace with actual API data
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      alert_type: 'LEAK_DETECTED',
      message: 'Potential leak detected - water level dropping faster than normal usage',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      level_cm: 145.3,
      percent_full: 72.65,
      resolved: false
    },
    {
      id: 2,
      alert_type: 'OVERFLOW',
      message: 'Tank level critically high - overflow risk detected',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      level_cm: 195.8,
      percent_full: 97.9,
      resolved: false
    },
    {
      id: 3,
      alert_type: 'PUMP_FAULT',
      message: 'Pump motor temperature above normal threshold',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      level_cm: 120.5,
      percent_full: 60.25,
      resolved: false
    },
    {
      id: 4,
      alert_type: 'LOW_LEVEL',
      message: 'Water level below 30% - consider refilling',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      level_cm: 55.2,
      percent_full: 27.6,
      resolved: true
    }
  ]);

  const handleResolveAlert = (alertId: number) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const handleDismissAlert = (alertId: number) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'LEAK_DETECTED':
        return <Droplets className="h-5 w-5" />;
      case 'OVERFLOW':
        return <TrendingUp className="h-5 w-5" />;
      case 'PUMP_FAULT':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getAlertStyles = (alertType: string) => {
    switch (alertType) {
      case 'LEAK_DETECTED':
        return {
          border: 'border-l-red-500',
          bg: 'bg-red-50',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800',
          priority: 'Critical'
        };
      case 'OVERFLOW':
        return {
          border: 'border-l-red-500',
          bg: 'bg-red-50',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800',
          priority: 'Critical'
        };
      case 'PUMP_FAULT':
        return {
          border: 'border-l-orange-500',
          bg: 'bg-orange-50',
          icon: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-800',
          priority: 'High'
        };
      default:
        return {
          border: 'border-l-yellow-500',
          bg: 'bg-yellow-50',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800',
          priority: 'Medium'
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const filteredUnresolved = unresolvedAlerts
    .filter(alert => filter === 'all' || alert.alert_type === filter)
    .sort((a, b) => {
      if (sortBy === 'time') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'priority') {
        const priorities: Record<AlertType, number> = { LEAK_DETECTED: 3, OVERFLOW: 3, PUMP_FAULT: 2, LOW_LEVEL: 1 };
        return (priorities[b.alert_type as AlertType] || 0) - (priorities[a.alert_type as AlertType] || 0);
      }
      return 0;
    });

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Alerts</h1>
            <p className="text-gray-600 mt-1">Monitor and manage tank system notifications</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
          </div>
        </div>

        {/* Stats Cards with Animation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Critical Alerts</p>
                <p className="text-4xl font-bold mt-2">
                  {unresolvedAlerts.filter(a => ['LEAK_DETECTED', 'OVERFLOW'].includes(a.alert_type)).length}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <AlertTriangle className="h-8 w-8" />
              </div>
            </div>
            {unresolvedAlerts.length > 0 && (
              <div className="mt-4 flex items-center gap-1">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs text-red-100">Requires immediate attention</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Alerts</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{unresolvedAlerts.length}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Bell className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Last updated now</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Resolved</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{resolvedAlerts.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-green-600 font-medium">
              ↑ {resolvedAlerts.length > 0 ? '100%' : '0%'} resolution rate
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Alerts</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{alerts.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Last 24 hours
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
              {['all', 'LEAK_DETECTED', 'OVERFLOW', 'PUMP_FAULT', 'LOW_LEVEL'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter === type
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type === 'all' ? 'All' : type.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="time">Time</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {filteredUnresolved.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-500 animate-pulse" />
              Active Alerts ({filteredUnresolved.length})
            </h2>
            {filteredUnresolved.map((alert, index) => {
              const styles = getAlertStyles(alert.alert_type);
              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-xl shadow-lg border-l-4 ${styles.border} overflow-hidden transform hover:scale-[1.02] transition-all duration-200`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`${styles.bg} p-6`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`${styles.icon} mt-1`}>
                          {getAlertIcon(alert.alert_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {alert.alert_type.replace('_', ' ')}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles.badge}`}>
                              {styles.priority}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatTimestamp(alert.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-3">{alert.message}</p>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Droplets className="h-4 w-4 text-blue-500" />
                              <span className="text-gray-600">
                                Level: <span className="font-semibold">{alert.level_cm.toFixed(1)} cm</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all duration-500"
                                  style={{ width: `${alert.percent_full}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold text-gray-700">{alert.percent_full.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Resolve
                        </button>
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-600">No active alerts at the moment. All systems operating normally.</p>
          </div>
        )}

        {/* Resolved Alerts */}
        {showResolved && resolvedAlerts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Resolved Alerts ({resolvedAlerts.length})
              </h2>
              <button
                onClick={() => setShowResolved(!showResolved)}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Hide
              </button>
            </div>
            {resolvedAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="bg-white rounded-xl shadow p-6 opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {alert.alert_type.replace('_', ' ')}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Resolved
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}