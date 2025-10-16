import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import socketService from './utils/socket';
import CallManager from './components/chat/CallManager';
import { useThemeStore } from './store/themeStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const { isAuthenticated, loading, checkAuth, user } = useAuthStore();
  const { initTheme } = useThemeStore();

  // Initialize theme and check authentication on app load
  useEffect(() => {
    initTheme();
    checkAuth();
  }, []);

  // Connect socket when user is fully loaded
  useEffect(() => {
    // Only connect if user is authenticated AND user data is loaded (has _id)
    if (isAuthenticated && user && user._id) {
      console.log('✅ Socket connecting for user:', user._id);
      socketService.connect(user._id);
    } else if (!isAuthenticated) {
      console.log('❌ Socket disconnecting - user not authenticated');
      socketService.disconnect();
    }
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="App">
      {/* Global Call Manager - Only render when user is fully authenticated and loaded */}
      {isAuthenticated && user && user._id && <CallManager />}

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to="/" />}
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;