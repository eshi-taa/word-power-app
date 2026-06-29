import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { handleApiError } from '../api/handleError';

export default function StreakScreen({ setScreen }) {
  const [groups, setGroups] = useState([]);
  const [progressList, setProgressList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStreakAndProgress = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groupsResponse, progressResponse] = await Promise.all([
        client.get('/words/groups'),
        client.get('/words/progress')
      ]);
      setGroups(groupsResponse.data);
      setProgressList(progressResponse.data);
    } catch (err) {
      console.error('Error fetching progress and streak data:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStreakAndProgress();
  }, []);

  // 1. Calculate total streak
  const totalStreak = progressList.reduce((acc, p) => acc + p.streak, 0);

  // 2. Calculate total mastered words by iterating mainWords inside chapters
  const totalMasteredWords = groups.reduce((acc, chapter) => {
    const chapMastered = chapter.mainWords?.reduce((sum, mw) => {
      const progress = progressList.find(p => p.mainWordId === mw.id);
      if (progress && progress.quizUnlocked) {
        const count = mw.roots?.reduce((rSum, r) => rSum + (r.derivedWords?.length || 0), 0) || 0;
        return sum + count;
      }
      return sum;
    }, 0) || 0;
    return acc + chapMastered;
  }, 0);

  const getGroupStatus = (mainWordId) => {
    const progress = progressList.find(p => p.mainWordId === mainWordId);
    if (!progress || !progress.studied) {
      return { label: 'Not started', badgeBg: 'rgba(255, 255, 255, 0.05)', textColor: 'var(--text-muted)' };
    }
    if (progress.studied && !progress.quizUnlocked) {
      return { label: 'Studied', badgeBg: 'rgba(255, 159, 67, 0.15)', textColor: 'var(--color-amber)' };
    }
    if (progress.quizUnlocked) {
      return { label: 'Quiz passed', badgeBg: 'rgba(76, 175, 80, 0.15)', textColor: 'var(--color-green)' };
    }
    return { label: 'Not started', badgeBg: 'rgba(255, 255, 255, 0.05)', textColor: 'var(--text-muted)' };
  };

  const allMainWords = groups.flatMap(c => c.mainWords || []);

  return (
    <div className="animated-fade-in" style={styles.container}>
      {/* Header */}
      <header className="header-bar">
        <button className="btn btn-secondary" style={styles.backBtn} onClick={() => setScreen('Home')}>
          ← Back
        </button>
        <h1 className="header-title" style={styles.headerTitle}>Your Progress</h1>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {isLoading ? (
          <div style={styles.loaderContainer}>
            <div style={styles.spinner}></div>
            <p>Loading progress dashboard...</p>
          </div>
        ) : error ? (
          <div className="glass-panel" style={styles.errorContainer}>
            <p style={styles.errorText}>{error}</p>
            <button className="btn btn-primary" onClick={fetchStreakAndProgress}>
              Retry
            </button>
          </div>
        ) : (
          <div style={styles.dashboard}>
            {/* Hero Streak Card */}
            <div className="glass-panel" style={styles.heroSection}>
              <div style={styles.fireRing}>🔥</div>
              <h1 style={styles.streakNumber}>{totalStreak} days</h1>
              <p style={styles.streakLabel}>Current Study Streak</p>
            </div>

            {/* Root Groups Progress List */}
            <div style={styles.listSection}>
              <h3 style={styles.sectionTitle}>Vocabulary Progress</h3>
              <div style={styles.list}>
                {allMainWords.map((mw) => {
                  const status = getGroupStatus(mw.id);
                  const progress = progressList.find(p => p.mainWordId === mw.id);
                  const streak = progress ? progress.streak : 0;
                  return (
                    <div key={mw.id} className="glass-panel" style={styles.listItem}>
                      <div style={styles.itemLeft}>
                        <h4 style={styles.rootText}>{mw.word}</h4>
                        <p style={styles.meaningText}>{mw.meaning}</p>
                      </div>
                      <div style={styles.itemRight}>
                        <span style={{ ...styles.statusBadge, backgroundColor: status.badgeBg, color: status.textColor }}>
                          {status.label}
                        </span>
                        {streak > 0 && (
                          <span style={styles.itemStreak}>🔥 {streak}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mastered Counter Footer */}
            <div className="glass-panel" style={styles.footerCard}>
              <h1 style={styles.masteredCount}>{totalMasteredWords}</h1>
              <p style={styles.masteredLabel}>Words Mastered</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  },
  backBtn: {
    padding: '8px 14px',
    fontSize: '14px',
  },
  headerTitle: {
    fontSize: '20px',
  },
  main: {
    paddingBottom: '40px',
  },
  dashboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 24px',
  },
  fireRing: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 159, 67, 0.15)',
    border: '2px solid rgba(255, 159, 67, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    marginBottom: '16px',
    boxShadow: 'var(--glow-amber)',
  },
  streakNumber: {
    fontSize: '32px',
    fontWeight: '900',
    fontFamily: 'Outfit, sans-serif',
    marginBottom: '4px',
  },
  streakLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  listSection: {
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '16px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
  },
  itemLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  rootText: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    fontFamily: 'Outfit, sans-serif',
  },
  meaningText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  itemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusBadge: {
    fontSize: '12px',
    fontWeight: '700',
    padding: '6px 12px',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  itemStreak: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--color-amber)',
  },
  footerCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px 24px',
  },
  masteredCount: {
    fontSize: '28px',
    fontWeight: '900',
    color: 'var(--color-blue)',
    fontFamily: 'Outfit, sans-serif',
  },
  masteredLabel: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
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
  },
  errorText: {
    color: 'var(--color-red)',
    marginBottom: '16px',
    fontWeight: '600',
  },
};
