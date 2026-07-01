import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppSettingsProvider, useAppSettings } from './contexts/AppSettingsContext';
import LoginPage from './pages/LoginPage';
import PublicationPage from './pages/PublicationPage';
import GuidePage from './pages/GuidePage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useAppSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-main dark:bg-[#0b1224]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sofi-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted dark:text-slate-200">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

import DashboardPage from './pages/DashboardPage';

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/publication"
        element={
          <ProtectedRoute>
            <PublicationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guide"
        element={
          <ProtectedRoute>
            <GuidePage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/publication" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppSettingsProvider>
  );
}
