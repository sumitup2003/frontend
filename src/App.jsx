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
  

  useEffect(() => {
    initTheme();
    checkAuth();
  }, []);

  useEffect(() => {
    // Connect socket when user is authenticated
    if (user) {
      socketService.connect(user._id);
    }

    return () => {
      socketService.disconnect();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  {user && <CallManager />}

  return (
    
    <Routes>
      
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <Register /> : <Navigate to="/" />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;