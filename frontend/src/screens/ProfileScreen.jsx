import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { handleApiError } from '../api/handleError';
import PerspectiveGrid from '../components/PerspectiveGrid';

export default function ProfileScreen() {
  const [stats, setStats] = useState({
    streak: 0,
    wordsMastered: 0,
    groupsStudied: 0,
    totalWordsPossible: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get('/words/groups');
      const chapters = response.data;

      let streak = 0;
      let wordsMastered = 0;
      let groupsStudied = 0;
      let totalWordsPossible = 0;

      chapters.forEach((chapter) => {
        chapter.mainWords?.forEach((mw) => {
          const prog = mw.progress?.[0];
          const count = mw.roots?.reduce((acc, r) => acc + (r.derivedWords?.length || 0), 0) || 0;
          totalWordsPossible += count;

          if (prog) {
            streak = Math.max(streak, prog.streak || 0);
            if (prog.studied) {
              groupsStudied += 1;
            }
            if (prog.quizUnlocked) {
              wordsMastered += count;
            }
          }
        });
      });

      setStats({
        streak,
        wordsMastered,
        groupsStudied,
        totalWordsPossible
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
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
          <h1 className="header-title">My Profile</h1>
        </header>

        {/* Main section */}
        <main style={styles.main}>
          {isLoading ? (
            <div style={styles.loaderContainer}>
              <div style={styles.spinner}></div>
              <p>Loading your profile...</p>
            </div>
          ) : error ? (
            <div className="glass-panel" style={{ ...styles.errorContainer, pointerEvents: 'auto' }}>
              <p style={styles.errorText}>{error}</p>
              <button className="btn btn-primary" onClick={fetchStats}>
                Retry
              </button>
            </div>
          ) : (
            <div style={styles.content}>
              {/* Stats Cards Grid */}
              <div style={styles.statsGrid}>
                <div className="glass-panel" style={styles.statCard}>
                  <span style={styles.statEmoji}>🔥</span>
                  <h3 style={styles.statVal}>{stats.streak}</h3>
                  <p style={styles.statLabel}>Day Streak</p>
                </div>

                <div className="glass-panel" style={styles.statCard}>
                  <span style={styles.statEmoji}>🧠</span>
                  <h3 style={styles.statVal}>{stats.wordsMastered}</h3>
                  <p style={styles.statLabel}>Words Mastered</p>
                </div>

                <div className="glass-panel" style={styles.statCard}>
                  <span style={styles.statEmoji}>📚</span>
                  <h3 style={styles.statVal}>{stats.groupsStudied}</h3>
                  <p style={styles.statLabel}>Roots Studied</p>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="glass-panel" style={styles.performanceCard}>
                <h3 style={styles.panelTitle}>Learning Metrics</h3>
                
                <div style={styles.metricRow}>
                  <span style={styles.metricName}>Mastery Rate</span>
                  <span style={styles.metricValue}>
                    {stats.totalWordsPossible > 0 
                      ? `${Math.round((stats.wordsMastered / stats.totalWordsPossible) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div style={styles.progressBarBg}>
                  <div 
                    style={{
                      ...styles.progressBarFill, 
                      width: `${stats.totalWordsPossible > 0 ? (stats.wordsMastered / stats.totalWordsPossible) * 100 : 0}%` 
                    }}
                  ></div>
                </div>

                <div style={{ ...styles.metricRow, marginTop: '24px' }}>
                  <span style={styles.metricName}>Mock Accuracy</span>
                  <span style={styles.metricValue}>85%</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: '85%', backgroundColor: 'var(--color-green)' }}></div>
                </div>
              </div>

              {/* Navigation links */}
              <div style={styles.actionsList}>
                <Link to="/settings" className="btn btn-secondary" style={styles.actionBtn}>
                  Account Settings ⚙️
                </Link>
                <Link to="/refer" className="btn btn-secondary" style={styles.actionBtn}>
                  Refer Friends 🎁
                </Link>
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    maxWidth: '720px', // Restrict width so it stays clean and centered
    margin: '24px auto 0 auto',
    pointerEvents: 'auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 8px',
  },
  statEmoji: {
    fontSize: '28px',
    marginBottom: '8px',
  },
  statVal: {
    fontSize: '28px',
    fontWeight: '900',
    color: 'var(--text-primary)',
    marginBottom: '2px',
    fontFamily: "'Fraunces', serif",
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  performanceCard: {
    textAlign: 'left',
    padding: '28px',
  },
  panelTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  metricName: {
    color: 'var(--text-primary)',
  },
  metricValue: {
    color: 'var(--color-blue)',
  },
  progressBarBg: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '4px',
    backgroundColor: 'var(--color-blue)',
    transition: 'width 0.5s ease-out',
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '12px',
  },
  actionBtn: {
    padding: '14px 20px',
    justifyContent: 'flex-start',
    fontWeight: '700',
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
};
