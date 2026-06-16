import React, { useState } from 'react';
import useAuthStore from '../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const setError = useAuthStore((state) => state.setError);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password');
      return;
    }

    try {
      // Create mock token in development
      const mockFirebaseToken = `mock-token-${email.trim().toLowerCase()}`;
      await login(mockFirebaseToken);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div className="glass-panel animated-fade-in" style={styles.loginCard}>
        <div style={styles.header}>
          <h1 className="header-title" style={styles.title}>Word Power</h1>
          <p style={styles.subtitle}>Build your vocabulary, one root at a time</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="e.g. you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
  },
  loginCard: {
    width: '100%',
    maxWidth: '420px',
    padding: '32px',
    textAlign: 'center',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  submitBtn: {
    marginTop: '16px',
    width: '100%',
  },
  errorAlert: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    color: 'var(--color-red)',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px',
    border: '1px solid rgba(255, 77, 77, 0.3)',
    textAlign: 'center',
  },
};
