import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { handleApiError } from '../api/handleError';
import PerspectiveGrid from '../components/PerspectiveGrid';

export default function WordGroupScreen() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudying, setIsStudying] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const WORDS_PER_PAGE = 6;

  const fetchGroupDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get(`/words/groups/${groupId}`);
      setGroup(response.data);
    } catch (err) {
      console.error('Error fetching group details:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
    setCurrentPage(1); // Reset to page 1 on group switch
  }, [groupId]);

  // Local browser TTS speaking utility
  const speakLocal = (text, phonetic) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      // Prepend commas to create a silent pause that wakes up the audio hardware before speaking
      const utterance = new SpeechSynthesisUtterance(', , ' + text);
      utterance.rate = 0.8;
      utterance.lang = 'en-GB';
      
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en-GB') && v.name.toLowerCase().includes('female'))
        || voices.find(v => v.lang.startsWith('en-GB'))
        || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
        || voices.find(v => v.lang.startsWith('en'));
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      
      // Delay speech synthesis by 300ms to allow browser cancel to fully process 
      // and audio drivers/hardware context to wake up cleanly
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 300);
    } else {
      setAlertMessage(`Pronunciation Guide: "${text}" is pronounced [${phonetic}]`);
      setIsPlayingAudio(false);
    }
  };

  // Play pronunciation guide using standard HTML5 Audio with browser speech fallback
  const handlePlayAudio = async (wordId, wordText, phonetic) => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);

    try {
      const response = await client.get(`/words/audio/${wordId}`);
      const { audioUrl } = response.data;

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch((audioErr) => {
          console.error('Audio playback failed, falling back to local speech:', audioErr);
          speakLocal(wordText, phonetic);
        });
        audio.onended = () => setIsPlayingAudio(false);
      } else {
        speakLocal(wordText, phonetic);
      }
    } catch (err) {
      console.error('Error playing audio, falling back to local speech:', err);
      speakLocal(wordText, phonetic);
    }
  };

  const handleMarkStudied = async () => {
    setIsStudying(true);
    try {
      await client.post('/words/groups/studied', { groupId });
      setShowCompletionModal(true);
    } catch (err) {
      console.error('Error marking studied:', err);
      setAlertMessage(handleApiError(err));
    } finally {
      setIsStudying(false);
    }
  };

  const isAlreadyStudied = group?.progress?.[0]?.studied || false;

  // Pagination calculations
  const totalWords = group?.words?.length || 0;
  const totalPages = Math.ceil(totalWords / WORDS_PER_PAGE);
  const displayedWords = group?.words 
    ? group.words.slice((currentPage - 1) * WORDS_PER_PAGE, currentPage * WORDS_PER_PAGE)
    : [];

  return (
    <div className="animated-fade-in" style={styles.container}>
      {/* Background grid texture */}
      <PerspectiveGrid />

      {/* Main Wide layout wrapper */}
      <div className="wide-content-wrapper">
        {/* Header */}
        <header className="header-bar" style={{ borderBottom: '1px solid var(--border-muted)', pointerEvents: 'auto' }}>
          <button className="btn btn-secondary" style={styles.backBtn} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
        </header>

        {/* Visual study progress tracker */}
        {group && (
          <div style={{ margin: '12px 0 24px 0', pointerEvents: 'auto', animationDelay: '0.15s' }} className="animate-reveal">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
              <span>Group Completion</span>
              <span>{isAlreadyStudied ? '100%' : '0%'} Completed</span>
            </div>
            <div style={styles.progressBarBg}>
              <div 
                style={{
                  ...styles.progressBarFill, 
                  width: isAlreadyStudied ? '100%' : '0%',
                  backgroundColor: isAlreadyStudied ? 'var(--color-green)' : 'var(--color-blue)'
                }} 
              />
            </div>
          </div>
        )}

        {/* Root Word Display */}
        {group && (
          <div style={{ textAlign: 'center', marginBottom: '32px', pointerEvents: 'auto' }} className="animate-reveal">
            <h1 className="header-title" style={{ fontSize: '36px', fontStyle: 'italic', display: 'inline-block' }}>
              {group.root} — {group.meaning}
            </h1>
          </div>
        )}

        {/* Content Section */}
        <main style={styles.main}>
          {isLoading ? (
            <div style={styles.loaderContainer}>
              <div style={styles.spinner}></div>
              <p>Loading vocabulary words...</p>
            </div>
          ) : error ? (
            <div className="glass-panel" style={styles.errorContainer}>
              <p style={styles.errorText}>{error}</p>
              <button className="btn btn-primary" onClick={fetchGroupDetails}>
                Retry
              </button>
            </div>
          ) : (
            <div style={styles.content}>
              {/* Words 3-column Grid */}
              <div className="words-grid">
                {displayedWords.map((word) => (
                  <div key={word.id} className="glass-panel word-tile-card">
                    <div style={styles.cardLeft}>
                      <div style={styles.wordHeader}>
                        <h3 style={styles.wordText}>{word.word}</h3>
                        <span style={styles.phoneticText}>[{word.phonetic}]</span>
                      </div>
                      <p style={styles.definitionText}>{word.definition}</p>
                      <div style={styles.exampleContainer}>
                        <span style={styles.exampleLabel}>Example:</span>
                        <p style={styles.exampleText}>"{word.example}"</p>
                      </div>
                    </div>
                    {/* Speaker trigger button docked at the bottom right */}
                    <div style={styles.cardBottomRow}>
                      <button
                        className="btn btn-secondary"
                        style={styles.speakerBtn}
                        onClick={() => handlePlayAudio(word.id, word.word, word.phonetic)}
                        disabled={isPlayingAudio}
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="pagination-container" style={{ pointerEvents: 'auto' }}>
                  <button
                    className="btn btn-secondary pagination-btn"
                    onClick={() => {
                      setCurrentPage(p => Math.max(p - 1, 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                  >
                    ← Prev
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary pagination-btn"
                    onClick={() => {
                      setCurrentPage(p => Math.min(p + 1, totalPages));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Bottom study actions */}
              <div style={{ ...styles.footer, pointerEvents: 'auto', marginTop: '36px' }}>
                {isAlreadyStudied ? (
                  <button 
                    className="btn btn-primary" 
                    style={styles.actionBtn}
                    onClick={() => navigate(`/quiz/${groupId}`)}
                  >
                    Take Quiz 📝
                  </button>
                ) : (
                  <button
                    className="btn btn-success"
                    style={styles.actionBtn}
                    onClick={handleMarkStudied}
                    disabled={isStudying}
                  >
                    {isStudying ? 'Saving Progress...' : "I've studied this group"}
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Premium Study Completion Modal */}
      {showCompletionModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card-premium">
            <h2 className="modal-title">Rite of Study Complete</h2>
            <p className="modal-text">
              You have finished studying the <span style={{ color: 'var(--color-blue)', fontWeight: 'bold' }}>"{group?.root || ''}"</span> root group!
            </p>
            <p className="modal-subtext">
              Would you like to sit the examination (take the quiz) now, or return to your study desk?
            </p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowCompletionModal(false);
                  navigate('/dashboard');
                }}
              >
                Return to Desk
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowCompletionModal(false);
                  navigate(`/quiz/${groupId}`);
                }}
              >
                Take Quiz Now
              </button>
            </div>
          </div>
        </div>
      )}
      {alertMessage && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card-premium">
            <h2 className="modal-title">Notice</h2>
            <p className="modal-text">{alertMessage}</p>
            <div className="modal-actions">
              <button 
                className="btn btn-primary" 
                onClick={() => setAlertMessage(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
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
  headerTitle: {
    fontSize: '22px',
    textAlign: 'right',
  },
  main: {
    paddingBottom: '60px',
    position: 'relative',
    zIndex: 2,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    marginTop: '24px',
  },
  cardLeft: {
    flex: 1,
  },
  wordHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '8px',
  },
  wordText: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    fontFamily: "'Fraunces', 'Libre Baskerville', Georgia, serif",
  },
  phoneticText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  definitionText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '12px',
  },
  exampleContainer: {
    borderLeft: '2px solid var(--color-red)',
    paddingLeft: '8px',
  },
  exampleLabel: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--color-blue)',
    textTransform: 'uppercase',
    marginBottom: '2px',
  },
  exampleText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  cardBottomRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '16px',
    width: '100%',
  },
  speakerBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    padding: 0,
    fontSize: '15px',
    flexShrink: 0,
  },
  footer: {
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    justifyContent: 'center',
  },
  actionBtn: {
    width: '100%',
    padding: '16px',
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
  },
  errorText: {
    color: 'var(--color-red)',
    marginBottom: '16px',
    fontWeight: '600',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.4s ease-out',
  },
};
