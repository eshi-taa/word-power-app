import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import PerspectiveGrid from '../components/PerspectiveGrid';

export default function SettingsScreen() {
  const [notify, setNotify] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="animated-fade-in" style={styles.container}>
      {/* Background Perspective Grid */}
      <PerspectiveGrid />

      {/* Wide Content Wrapper */}
      <div className="wide-content-wrapper">
        {/* Header bar */}
        <header className="header-bar" style={{ pointerEvents: 'auto' }}>
          <button className="btn btn-secondary" style={styles.backBtn} onClick={() => navigate('/profile')}>
            ← Back
          </button>
          <h1 className="header-title">Settings</h1>
        </header>

        {/* Main Section */}
        <main style={styles.main}>
          <div style={styles.content}>
            {/* User Section */}
            <div className="glass-panel" style={styles.userCard}>
              <div style={styles.avatar}>👤</div>
              <div style={styles.userDetails}>
                <h3 style={styles.userName}>{user?.name || 'Academic User'}</h3>
                <p style={styles.userEmail}>{user?.email || 'student@example.com'}</p>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="glass-panel" style={styles.settingsPanel}>
              <h3 style={styles.sectionTitle}>App Preferences</h3>

              <div style={styles.settingRow}>
                <div>
                  <h4 style={styles.settingTitle}>Daily Reminder Notifications</h4>
                  <p style={styles.settingDesc}>Receive email/FCM alerts when word reviews are due.</p>
                </div>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={notify}
                  onChange={() => setNotify(!notify)}
                />
              </div>

              <div style={styles.settingRow}>
                <div>
                  <h4 style={styles.settingTitle}>Dark Theme Mode</h4>
                  <p style={styles.settingDesc}>Toggle light or dark styling templates.</p>
                </div>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                />
              </div>
            </div>

            {/* Session Actions */}
            <button className="btn btn-primary" style={styles.logoutBtn} onClick={handleLogout}>
              Log Out Account
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    position: 'relative',
  },
  backBtn: {
    padding: '8px 14px',
    fontSize: '14px',
  },
  main: {
    paddingBottom: '40px',
    position: 'relative',
    zIndex: 2,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    maxWidth: '680px', // Center and constrain settings width
    margin: '24px auto 0 auto',
    pointerEvents: 'auto',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    textAlign: 'left',
  },
  avatar: {
    fontSize: '36px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  userEmail: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  settingsPanel: {
    padding: '24px',
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid var(--border-muted)',
  },
  settingTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  settingDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    maxWidth: '280px',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    accentColor: 'var(--color-blue)',
  },
  logoutBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, var(--color-red) 0%, #5c202a 100%)',
    boxShadow: '0 4px 15px rgba(122, 46, 60, 0.2)',
  },
};
