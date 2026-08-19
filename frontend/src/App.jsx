import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthScreen } from './pages/AuthScreen';
import { FeedApp } from './pages/FeedApp';
import { UserProfile } from './pages/UserProfile';
import { AdminApp } from './pages/admin/AdminApp';
import { UserRoute } from './components/routing/UserRoute';
import { RoleBasedRouting } from './components/routing/RoleBasedRouting';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <RoleBasedRouting />
            <Routes>
              <Route path="/" element={<AuthScreen />} />
              <Route path="/feed" element={<UserRoute><FeedApp /></UserRoute>} />
              <Route path="/profile" element={<UserRoute><UserProfile /></UserRoute>} />
              <Route path="/profile/:username" element={<UserRoute><UserProfile /></UserRoute>} />
              <Route path="/admin/*" element={<AdminApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
