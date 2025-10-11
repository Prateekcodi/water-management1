import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { TankDashboard } from './components/TankDashboard';
import { SettingsPage } from './components/SettingsPage';
import AlertsPage from './components/AlertsPage';
import AIChat from './components/AIChat';
import { TownWaterVisualization } from './components/TownWaterVisualization';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import UserProfile from './components/profile/UserProfile';
import AdminProfile from './components/profile/AdminProfile';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    },
  },
});

// Main App Content Component
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
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
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminProfile />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;