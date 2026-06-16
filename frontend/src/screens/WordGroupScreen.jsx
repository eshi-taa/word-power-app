import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { handleApiError } from '../api/handleError';

export default function WordGroupScreen({ groupId, root, setScreen }) {
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudying, setIsStudying] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState(null);

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
  }, [groupId]);

  // Local browser TTS speaking utility
  const speakLocal = (text, phonetic) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      
      // Attempt to pick a natural-sounding English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))) 
        || voices.find(v => v.lang.startsWith('en'));
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      // Ultimate fallback: text alert
      alert(`Pronunciation Guide: "${text}" is pronounced [${phonetic}]`);
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
      if (confirm(`You have finished studying the "${root}" root group! Would you like to take the quiz now?`)) {
        setScreen('Quiz');
      } else {
        setScreen('Home');
      }
    } catch (err) {
      console.error('Error marking studied:', err);
      alert(handleApiError(err));
    } finally {
      setIsStudying(false);
    }
  };

  const isAlreadyStudied = group?.progress?.[0]?.studied || false;

  return (
    <div className="animated-fade-in" style={styles.container}>
      {/* Header */}
      <header className="header-bar">
        <button className="btn btn-secondary" style={styles.backBtn} onClick={() => setScreen('Home')}>
          ← Back
        </button>
        {group && (
          <h1 className="header-title" style={styles.headerTitle}>
            {group.root} — {group.meaning}
          </h1>
        )}
      </header>

      {/* Main Content */}
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
          <div style={styles.list}>
            {group?.words?.map((word) => (
              <div key={word.id} className="glass-panel" style={styles.wordCard}>
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
                <button
                  className="btn btn-secondary"
                  style={styles.speakerBtn}
                  onClick={() => handlePlayAudio(word.id, word.word, word.phonetic)}
                  disabled={isPlayingAudio}
                >
                  🔊
                </button>
              </div>
            ))}

            {/* Bottom study actions */}
            <div style={styles.footer}>
              {isAlreadyStudied ? (
                <button 
                  className="btn btn-primary" 
                  style={styles.actionBtn}
                  onClick={() => setScreen('Quiz')}
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
    textAlign: 'right',
  },
  main: {
    paddingBottom: '60px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  wordCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left',
    gap: '16px',
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
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  phoneticText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  definitionText: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '12px',
  },
  exampleContainer: {
    borderLeft: '2px solid var(--color-blue)',
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
  speakerBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    padding: 0,
    fontSize: '16px',
    flexShrink: 0,
  },
  footer: {
    marginTop: '24px',
    display: 'flex',
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
