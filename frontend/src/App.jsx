import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Screens
import LandingScreen from './screens/LandingScreen.jsx';
import LoginScreen from './screens/LoginScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import WordGroupScreen from './screens/WordGroupScreen.jsx';
import QuizScreen from './screens/QuizScreen.jsx';
import ReviewScreen from './screens/ReviewScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import ReferScreen from './screens/ReferScreen.jsx';

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // Check local storage session on mount
    checkAuth();
  }, [checkAuth]);

  // Loading Screen while verifying session
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Connecting to Word Power...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingScreen />} />
        <Route path="/login" element={<LoginScreen />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <HomeScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/group/:groupId" 
          element={
            <ProtectedRoute>
              <WordGroupScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/quiz/:groupId" 
          element={
            <ProtectedRoute>
              <QuizScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/review" 
          element={
            <ProtectedRoute>
              <ReviewScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfileScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/refer" 
          element={
            <ProtectedRoute>
              <ReferScreen />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#0F1117',
    color: 'var(--text-secondary)',
    gap: '16px',
  },
  spinner: {
    width: '45px',
    height: '45px',
    border: '4px solid rgba(255, 255, 255, 0.05)',
    borderTopColor: 'var(--color-blue)',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  loadingText: {
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '0.2px',
  },
};
