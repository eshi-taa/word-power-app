import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { handleApiError } from '../api/handleError';
import useAuthStore from '../store/authStore';
import PerspectiveGrid from '../components/PerspectiveGrid';

export default function HomeScreen() {
  const [groups, setGroups] = useState([]);
  const [dueGroups, setDueGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groupsRes, dueRes] = await Promise.all([
        client.get('/words/groups'),
        client.get('/words/due')
      ]);
      setGroups(groupsRes.data);
      setDueGroups(dueRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate total streak
  const totalStreak = groups.reduce((acc, g) => acc + (g.progress?.[0]?.streak || 0), 0);

  // Find the next group to study (first unlocked, incomplete group)
  const nextGroupToStudy = groups.find((g, idx) => {
    const isUnlocked = idx === 0 || (groups[idx - 1]?.progress?.[0]?.quizUnlocked || false);
    const isStudied = g.progress?.[0]?.studied || false;
    return isUnlocked && !isStudied;
  });

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

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
          <h1 className="header-title" style={{ cursor: 'pointer' }} onClick={fetchDashboardData}>Word Power</h1>
          <div style={styles.headerRight}>
            <button className="btn btn-secondary" style={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* 1. Mini Streak Board strip */}
        {!isLoading && !error && (
          <div className="streak-strip-container animate-reveal" style={{ animationDelay: '0.05s', marginBottom: '28px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Weekly Routine:</span>
            <div className="streak-squares-grid">
              {[1, 2, 3, 4, 5, 6, 7].map((day, i) => {
                // Mock activity mapping: activate squares based on current streak
                const isActive = i < Math.min(7, totalStreak);
                return (
                  <div 
                    key={i} 
                    className={`streak-square ${isActive ? 'active' : ''}`}
                    title={`Day ${day} ${isActive ? '(Studied)' : '(No Activity)'}`}
                  />
                );
              })}
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🔥 <strong>{totalStreak} Day Streak</strong>
            </span>
          </div>
        )}

        {/* Main content */}
        <main style={styles.main}>
          {isLoading ? (
            <div style={styles.loaderContainer}>
              <div style={styles.spinner}></div>
              <p>Loading your study path...</p>
            </div>
          ) : error ? (
            <div className="glass-panel" style={{ ...styles.errorContainer, pointerEvents: 'auto' }}>
              <p style={styles.errorText}>{error}</p>
              <button className="btn btn-primary" onClick={fetchDashboardData}>
                Retry
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* 2. Review Queue Pending Banner OR smart "Continue learning" CTA */}
              {dueGroups.length > 0 ? (
                <div 
                  className="glass-panel animated-fade-in" 
                  style={{ ...styles.card, ...styles.dueBanner, pointerEvents: 'auto' }}
                  onClick={() => navigate('/review')}
                >
                  <div style={styles.cardLeft}>
                    <h3 style={{ ...styles.rootText, fontSize: '18px', color: 'var(--color-amber)', fontFamily: 'inherit' }}>
                      🔥 Reviews Pending
                    </h3>
                    <p style={styles.meaningText}>
                      You have {dueGroups.length} group{dueGroups.length > 1 ? 's' : ''} scheduled for Leitner review.
                    </p>
                  </div>
                  <button className="btn btn-amber" style={styles.reviewBtn}>
                    Review Now
                  </button>
                </div>
              ) : nextGroupToStudy ? (
                <div 
                  className="glass-panel animated-fade-in" 
                  style={{ ...styles.card, ...styles.continueBanner, pointerEvents: 'auto' }}
                  onClick={() => navigate(`/group/${nextGroupToStudy.id}`)}
                >
                  <div style={styles.cardLeft}>
                    <h3 style={{ ...styles.rootText, fontSize: '18px', color: 'var(--color-blue)', fontFamily: 'inherit' }}>
                      📚 Continue Learning
                    </h3>
                    <p style={styles.meaningText}>
                      Next up: study the root group <strong>{nextGroupToStudy.root}</strong> (means <em>"{nextGroupToStudy.meaning}"</em>).
                    </p>
                  </div>
                  <button className="btn btn-primary" style={styles.reviewBtn}>
                    Study Now
                  </button>
                </div>
              ) : null}

              {/* 3. Entire Learning Path with frosted locks */}
              <div style={{ pointerEvents: 'auto' }}>
                <h3 className="section-title">Vocabulary Path</h3>
                <div className="groups-grid">
                  {groups.map((group, index) => {
                    const isStudied = group.progress?.[0]?.studied || false;
                    const wordCount = group._count?.words || 0;
                    const reviewBox = group.progress?.[0]?.reviewBox || 1;
                    
                    // Sequential unlocking logic
                    const isUnlocked = index === 0 || (groups[index - 1]?.progress?.[0]?.quizUnlocked || false);
                    
                    return (
                      <div
                        key={group.id}
                        className={`glass-panel word-tile-card animate-reveal ${!isUnlocked ? 'locked-card-veiled' : isStudied ? 'completed' : 'unlocked-incomplete'}`}
                        style={{
                          ...styles.card,
                          animationDelay: `${index * 0.05}s`
                        }}
                        onClick={() => isUnlocked && handleGroupClick(group.id)}
                      >
                        {/* Thin outline lock badge in top-right */}
                        {!isUnlocked && (
                          <div style={styles.lockBadge} title="Locked">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#80776A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                          </div>
                        )}

                        <div style={{ ...styles.cardLeft, opacity: isUnlocked ? 1 : 0.4 }}>
                          <h2 style={styles.rootText}>
                            {group.root}
                          </h2>
                          <p style={styles.meaningText}>
                            {isUnlocked ? (
                              <>means <em>"{group.meaning}"</em></>
                            ) : (
                              <span style={styles.lockedSubtitle}>
                                Unlocks after {groups[index - 1]?.root}
                              </span>
                            )}
                          </p>
                          
                          {/* Per-card Progress bar */}
                          {isUnlocked && (
                            <div className="card-progress-bar-bg">
                              <div 
                                className={`card-progress-bar-fill ${isStudied ? 'completed' : ''}`}
                                style={{ width: `${isStudied ? 100 : 0}%` }}
                              />
                            </div>
                          )}
                        </div>

                        <div style={{ ...styles.cardRight, opacity: isUnlocked ? 1 : 0.4 }}>
                          <span style={styles.wordCount}>{wordCount} words</span>
                          
                          {/* Leitner Box Dots progress track */}
                          {isUnlocked && isStudied && (
                            <div className="leitner-dots-container" title={`Leitner Box ${reviewBox}`}>
                              {[1, 2, 3, 4, 5].map((boxNum) => (
                                <div 
                                  key={boxNum} 
                                  className={`leitner-dot ${boxNum <= reviewBox ? (reviewBox === 5 ? 'completed' : 'filled') : ''}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoutBtn: {
    padding: '8px 14px',
    fontSize: '14px',
  },
  main: {
    paddingBottom: '40px',
    position: 'relative',
    zIndex: 2,
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    textAlign: 'left',
    position: 'relative',
    height: '100%',
    minHeight: '110px',
    padding: '24px',
  },
  rootText: {
    fontSize: '28px', /* Enlarged slightly */
    fontWeight: '900',
    color: 'var(--text-primary)',
    fontFamily: "'Fraunces', 'Libre Baskerville', Georgia, serif",
  },
  meaningText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  lockedSubtitle: {
    textTransform: 'uppercase',
    fontSize: '11px',
    letterSpacing: '0.8px',
    color: 'var(--text-muted)',
    fontWeight: '700',
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  cardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
    marginLeft: '12px',
  },
  wordCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-blue)',
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
  dueBanner: {
    padding: '28px', /* Opened up padding */
    borderLeft: '4px solid var(--color-amber)',
    width: '100%',
  },
  continueBanner: {
    padding: '28px', /* Opened up padding */
    borderLeft: '4px solid var(--color-blue)',
    width: '100%',
  },
  reviewBtn: {
    padding: '12px 24px',
    fontSize: '14px',
    marginLeft: '16px',
  },
  lockBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 11,
  },
};
