import React, { useState, useEffect } from 'react';
import useAuthStore from './store/authStore';
import LoginScreen from './screens/LoginScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import WordGroupScreen from './screens/WordGroupScreen.jsx';
import QuizScreen from './screens/QuizScreen.jsx';
import StreakScreen from './screens/StreakScreen.jsx';

export default function App() {
  const user = useAuthStore((state) => state.user);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [screen, setScreen] = useState('Home'); // 'Home', 'WordGroup', 'Quiz', 'Streak'
  const [params, setParams] = useState({}); // Stores parameters like { groupId, root }

  useEffect(() => {
    // Check local storage session on mount
    checkAuth();
  }, [checkAuth]);

  // Loading Screen
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Connecting to Word Power...</p>
      </div>
    );
  }

  // Auth Router
  if (!user) {
    return (
      <div className="app-container">
        <LoginScreen />
      </div>
    );
  }

  // App Screen Switcher
  return (
    <div className="app-container">
      {screen === 'Home' && (
        <HomeScreen setScreen={setScreen} setParams={setParams} />
      )}
      
      {screen === 'WordGroup' && (
        <WordGroupScreen 
          groupId={params.groupId} 
          root={params.root} 
          setScreen={setScreen} 
        />
      )}
      
      {screen === 'Quiz' && (
        <QuizScreen 
          groupId={params.groupId} 
          setScreen={setScreen} 
        />
      )}
      
      {screen === 'Streak' && (
        <StreakScreen setScreen={setScreen} />
      )}
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#121224',
    color: '#a0a6b5',
    gap: '16px',
  },
  spinner: {
    width: '45px',
    height: '45px',
    border: '4px solid rgba(255, 255, 255, 0.05)',
    borderTopColor: '#00b4d8',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  loadingText: {
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '0.2px',
  },
};
