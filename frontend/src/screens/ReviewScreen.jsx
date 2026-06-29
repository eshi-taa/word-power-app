import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { handleApiError } from '../api/handleError';
import PerspectiveGrid from '../components/PerspectiveGrid';

export default function ReviewScreen() {
  const [dueGroups, setDueGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDueGroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get('/words/due');
      setDueGroups(response.data);
    } catch (err) {
      console.error('Error fetching due reviews:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDueGroups();
  }, []);

  return (
    <div className="animated-fade-in" style={styles.container}>
      {/* Background Perspective Grid */}
      <PerspectiveGrid />

      {/* Wide Content Wrapper */}
      <div className="wide-content-wrapper">
        {/* Header bar */}
        <header className="header-bar" style={{ pointerEvents: 'auto' }}>
          <button className="btn btn-secondary" style={styles.backBtn} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1 className="header-title">Review Queue</h1>
        </header>

        {/* Main Content */}
        <main style={styles.main}>
          {isLoading ? (
            <div style={styles.loaderContainer}>
              <div style={styles.spinner}></div>
              <p>Loading your reviews...</p>
            </div>
          ) : error ? (
            <div className="glass-panel" style={{ ...styles.errorContainer, pointerEvents: 'auto' }}>
              <p style={styles.errorText}>{error}</p>
              <button className="btn btn-primary" onClick={fetchDueGroups}>
                Retry
              </button>
            </div>
          ) : dueGroups.length === 0 ? (
            <div className="glass-panel" style={{ ...styles.emptyContainer, pointerEvents: 'auto' }}>
              <span style={styles.emptyIcon}>🎉</span>
              <h3 style={styles.emptyTitle}>All caught up!</h3>
              <p style={styles.emptyText}>
                You have no word groups scheduled for Spaced Repetition review today. Keep studying new groups to unlock more.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Link to="/dashboard" className="btn btn-primary" style={styles.actionBtn}>
                  Back to Path
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', pointerEvents: 'auto' }}>
              <p style={styles.infoText}>
                The following root word groups are due for spaced-repetition review based on their Leitner Box intervals.
              </p>
              <div className="groups-grid">
                {dueGroups.map((group) => {
                  const reviewBox = group.progress?.[0]?.reviewBox || 1;
                  const wordCount = group._count?.words || 0;
                  return (
                    <div
                      key={group.id}
                      className="glass-panel word-tile-card"
                      style={styles.card}
                      onClick={() => navigate(`/group/${group.id}`)}
                    >
                      <div style={styles.cardLeft}>
                        <h2 style={styles.rootText}>{group.root}</h2>
                        <p style={styles.meaningText}>means "{group.meaning}"</p>
                      </div>
                      <div style={styles.cardRight}>
                        <span style={styles.wordCount}>{wordCount} words</span>
                        <span style={styles.dueBadge}>Box {reviewBox}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
  infoText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    textAlign: 'left',
    lineHeight: '1.5',
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    textAlign: 'left',
    borderLeft: '4px solid var(--color-amber)',
    boxShadow: '0 0 15px rgba(212, 175, 106, 0.05)',
  },
  rootText: {
    fontSize: '24px',
    fontWeight: '900',
    color: 'var(--text-primary)',
    fontFamily: "'Fraunces', 'Libre Baskerville', Georgia, serif",
  },
  meaningText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
  },
  wordCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-blue)',
  },
  dueBadge: {
    fontSize: '11px',
    fontWeight: '800',
    backgroundColor: 'rgba(212, 175, 106, 0.12)',
    color: 'var(--color-amber)',
    padding: '4px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    color: 'var(--text-secondary)',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: 'var(--color-blue)',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  errorContainer: {
    padding: '32px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
  },
  errorText: {
    color: 'var(--color-red)',
    marginBottom: '16px',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: '40px 24px',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '800',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    maxWidth: '340px',
    margin: '0 auto 24px auto',
  },
  actionBtn: {
    display: 'inline-flex',
    padding: '12px 24px',
    maxWidth: '200px',
  },
};
