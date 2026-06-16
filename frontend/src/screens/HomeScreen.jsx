import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { handleApiError } from '../api/handleError';
import useAuthStore from '../store/authStore';

export default function HomeScreen({ setScreen, setParams }) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const logout = useAuthStore((state) => state.logout);

  const fetchGroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get('/words/groups');
      setGroups(response.data);
    } catch (err) {
      console.error('Error fetching word groups:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Calculate total streak
  const totalStreak = groups.reduce((acc, g) => acc + (g.progress?.[0]?.streak || 0), 0);

  const handleGroupClick = (groupId, root) => {
    setParams({ groupId, root });
    setScreen('WordGroup');
  };

  return (
    <div className="animated-fade-in" style={styles.container}>
      {/* Header bar */}
      <header className="header-bar">
        <h1 className="header-title" style={{ cursor: 'pointer' }} onClick={fetchGroups}>Word Power</h1>
        <div style={styles.headerRight}>
          <button 
            className="btn btn-secondary" 
            style={styles.streakBtn}
            onClick={() => setScreen('Streak')}
          >
            🔥 <span style={{ color: 'var(--color-amber)', marginLeft: '4px' }}>{totalStreak}</span>
          </button>
          <button className="btn btn-secondary" style={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={styles.main}>
        {isLoading ? (
          <div style={styles.loaderContainer}>
            <div style={styles.spinner}></div>
            <p>Loading your study path...</p>
          </div>
        ) : error ? (
          <div className="glass-panel" style={styles.errorContainer}>
            <p style={styles.errorText}>{error}</p>
            <button className="btn btn-primary" onClick={fetchGroups}>
              Retry
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {groups.map((group) => {
              const isStudied = group.progress?.[0]?.studied || false;
              const wordCount = group._count?.words || 0;
              return (
                <div
                  key={group.id}
                  className="glass-panel"
                  style={styles.card}
                  onClick={() => handleGroupClick(group.id, group.root)}
                >
                  <div style={styles.cardLeft}>
                    <h2 style={styles.rootText}>{group.root}</h2>
                    <p style={styles.meaningText}>means "{group.meaning}"</p>
                  </div>
                  <div style={styles.cardRight}>
                    <span style={styles.wordCount}>{wordCount} words</span>
                    {isStudied && (
                      <span style={styles.badge}>✓ Completed</span>
                    )}
                  </div>
                </div>
              );
            })}
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
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  streakBtn: {
    padding: '8px 14px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '15px',
  },
  logoutBtn: {
    padding: '8px 14px',
    fontSize: '14px',
  },
  main: {
    paddingBottom: '40px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    textAlign: 'left',
  },
  rootText: {
    fontSize: '24px',
    fontWeight: '900',
    color: 'var(--text-primary)',
    fontFamily: 'Outfit, sans-serif',
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
  badge: {
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    color: 'var(--color-green)',
    padding: '4px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
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
