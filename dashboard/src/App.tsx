import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { TankDashboard } from './components/TankDashboard';
import { SettingsPage } from './components/SettingsPage';
import AlertsPage from './components/AlertsPage';
import AIChat from './components/AIChat';
import { TownWaterVisualization } from './components/TownWaterVisualization';
import { api } from './services/api';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Sample town data for visualization
  const [townData] = useState({
    totalWaterStorage: 8750,
    rainInput: 2.5,
    houses: [
      {
        id: 'house1',
        name: 'Smith Residence',
        tankLevel: 85,
        waterUsage: 12,
        waterQuality: 'good' as const,
        rainwaterCollected: 65,
        hasLeak: false
      },
      {
        id: 'house2',
        name: 'Johnson Home',
        tankLevel: 62,
        waterUsage: 8,
        waterQuality: 'good' as const,
        rainwaterCollected: 45,
        hasLeak: false
      },
      {
        id: 'house3',
        name: 'Miller Family',
        tankLevel: 38,
        waterUsage: 15,
        waterQuality: 'fair' as const,
        rainwaterCollected: 30,
        hasLeak: true
      },
      {
        id: 'house4',
        name: 'Davis Cottage',
        tankLevel: 90,
        waterUsage: 5,
        waterQuality: 'good' as const,
        rainwaterCollected: 70,
        hasLeak: false
      },
      {
        id: 'house5',
        name: 'Wilson Residence',
        tankLevel: 25,
        waterUsage: 18,
        waterQuality: 'poor' as const,
        rainwaterCollected: 20,
        hasLeak: false
      },
      {
        id: 'house6',
        name: 'Taylor Home',
        tankLevel: 75,
        waterUsage: 10,
        waterQuality: 'fair' as const,
        rainwaterCollected: 50,
        hasLeak: false
      }
    ]
  });

  useEffect(() => {
    // Set dark mode based on user preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<TankDashboard />} />
            <Route path="/town" element={
              <React.Suspense fallback={<div>Loading...</div>}>
                <TownWaterVisualization />
              </React.Suspense>
            } />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/chat" element={<AIChat />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;