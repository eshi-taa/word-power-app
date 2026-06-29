import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import PerspectiveGrid from '../components/PerspectiveGrid';

export default function ReferScreen() {
  const user = useAuthStore((state) => state.user);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Create simple referral code using the first 8 characters of their userId
  const refCode = user?.id ? user.id.slice(0, 8).toUpperCase() : 'STUDENT';
  const refLink = `${window.location.origin}/login?ref=${refCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
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
          <h1 className="header-title">Refer & Earn</h1>
        </header>

        {/* Main section */}
        <main style={styles.main}>
          <div style={styles.content}>
            <div className="glass-panel" style={styles.card}>
              <span style={styles.giftEmoji}>🎁</span>
              <h2 style={styles.cardTitle}>Share the gift of learning</h2>
              <p style={styles.cardDesc}>
                Invite your colleagues to study root vocabulary together. Share your unique code to build group study streams.
              </p>

              {/* Code display */}
              <div style={styles.codeContainer}>
                <span style={styles.codeLabel}>Your Code</span>
                <h3 style={styles.codeVal}>{refCode}</h3>
              </div>

              {/* Link copy component */}
              <div style={styles.linkGroup}>
                <input
                  type="text"
                  readOnly
                  className="input-field"
                  value={refLink}
                  style={styles.linkInput}
                />
                <button className="btn btn-primary" style={styles.copyBtn} onClick={handleCopy}>
                  {copied ? 'Copied! ✓' : 'Copy'}
                </button>
              </div>
            </div>
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
    width: '100%',
    maxWidth: '680px', // Center and restrict width
    margin: '24px auto 0 auto',
    pointerEvents: 'auto',
  },
  card: {
    padding: '32px 24px',
    textAlign: 'center',
  },
  giftEmoji: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: '800',
    marginBottom: '12px',
    fontFamily: "'Fraunces', 'Libre Baskerville', Georgia, serif",
  },
  cardDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    maxWidth: '360px',
    margin: '0 auto 24px auto',
  },
  codeContainer: {
    backgroundColor: 'rgba(201, 162, 75, 0.08)',
    border: '1px dashed var(--color-blue)',
    borderRadius: '8px',
    padding: '16px',
    margin: '0 auto 24px auto',
    maxWidth: '200px',
  },
  codeLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-blue)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '4px',
  },
  codeVal: {
    fontSize: '24px',
    fontWeight: '900',
    color: 'var(--text-primary)',
    letterSpacing: '2px',
  },
  linkGroup: {
    display: 'flex',
    gap: '8px',
    width: '100%',
  },
  linkInput: {
    flex: 1,
    fontSize: '13px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--border-muted)',
    color: 'var(--text-secondary)',
  },
  copyBtn: {
    padding: '12px 20px',
    flexShrink: 0,
    fontSize: '14px',
    minWidth: '80px',
  },
};
