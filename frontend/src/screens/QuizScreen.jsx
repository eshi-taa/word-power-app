import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { handleApiError } from '../api/handleError';
import PerspectiveGrid from '../components/PerspectiveGrid';

export default function QuizScreen() {
  const { groupId } = useParams(); // Matches mainWordId from the route
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Results & History State
  const [quizFinished, setQuizFinished] = useState(false);
  const [result, setResult] = useState(null); // { score, passed, total, details: [{ type, question, userAnswer, correctAnswer, isCorrect, explanation }] }
  const [history, setHistory] = useState([]);
  const [expandedAttemptId, setExpandedAttemptId] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  const fetchQuizQuestions = async () => {
    setIsLoading(true);
    setError(null);
    setQuizFinished(false);
    setResult(null);
    setCurrentIndex(0);
    setAnswers([]);
    setCurrentAnswer('');

    try {
      const response = await client.get(`/quiz/${groupId}`);
      setQuestions(response.data.questions);
      await fetchHistory();
    } catch (err) {
      console.error('Error loading quiz:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await client.get(`/quiz/${groupId}/history`);
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to load quiz history:', err);
    }
  };

  useEffect(() => {
    fetchQuizQuestions();
  }, [groupId]);

  const handleSubmitAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!currentAnswer.trim()) {
      setAlertMessage('Please enter your answer before continuing.');
      return;
    }

    const updatedAnswers = [...answers, currentAnswer.trim()];
    setAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All answers collected, submit to backend
      await submitQuizAnswers(updatedAnswers);
    }
  };

  const submitQuizAnswers = async (finalAnswers) => {
    setIsSubmitting(true);
    try {
      const response = await client.post('/quiz/submit', {
        mainWordId: groupId,
        answers: finalAnswers
      });
      setResult(response.data);
      setQuizFinished(true);
      await fetchHistory();
    } catch (err) {
      console.error('Error submitting quiz answers:', err);
      setAlertMessage(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAttemptExpand = (attemptId) => {
    setExpandedAttemptId(expandedAttemptId === attemptId ? null : attemptId);
  };

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Formatting timestamp helper
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div style={styles.centerContainer}>
        <PerspectiveGrid />
        <div style={{ ...styles.loaderContainer, position: 'relative', zIndex: 2 }}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Preparing your quiz...</p>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div style={styles.centerContainer}>
        <PerspectiveGrid />
        <div className="glass-panel" style={{ ...styles.errorContainer, position: 'relative', zIndex: 2 }}>
          <p style={styles.errorText}>{error}</p>
          <button className="btn btn-primary" onClick={fetchQuizQuestions}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 3. Quiz Results Screen with detailed feedback and history timeline
  if (quizFinished && result) {
    return (
      <div className="animated-fade-in" style={styles.scrollContainer}>
        <PerspectiveGrid />
        
        <div style={styles.wideContent}>
          {/* Hero Card */}
          <div className="glass-panel" style={{ ...styles.resultsCard, margin: '0 auto 32px auto', position: 'relative', zIndex: 2 }}>
            {result.passed ? (
              <div style={styles.resultDetails}>
                <div style={styles.emoji}>🏆🎉</div>
                <h2 style={styles.resultHeader}>Congratulations!</h2>
                <p style={styles.resultSub}>You passed the quiz and unlocked the next etymology topic!</p>
                <h1 style={styles.scoreText}>{result.score} / {result.total}</h1>
                <button 
                  className="btn btn-success"
                  style={styles.actionBtn}
                  onClick={() => navigate('/dashboard')}
                >
                  Back to Home
                </button>
              </div>
            ) : (
              <div style={styles.resultDetails}>
                <div style={styles.emoji}>📚💪</div>
                <h2 style={styles.resultHeader}>Keep Practicing!</h2>
                <p style={styles.resultSub}>You need at least 2 correct answers to pass. Don't worry, you can try again!</p>
                <h1 style={styles.scoreText} className="text-amber">{result.score} / {result.total}</h1>
                <button 
                  className="btn btn-amber"
                  style={styles.actionBtn}
                  onClick={fetchQuizQuestions}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Graded Answers Detailed Feedback */}
          {result.details && result.details.length > 0 && (
            <div className="glass-panel" style={{ marginBottom: '32px', textAlign: 'left', position: 'relative', zIndex: 2 }}>
              <h3 className="section-title" style={{ marginTop: 0, marginBottom: '20px' }}>Review Answers</h3>
              <div style={styles.feedbackList}>
                {result.details.map((detail, index) => (
                  <div key={index} style={styles.feedbackItem}>
                    <div style={styles.feedbackHeaderRow}>
                      <span style={{ fontWeight: '700', fontSize: '15px' }}>
                        Question {index + 1}: {detail.type === 'fill_blank' ? 'Fill in the blank' : detail.type === 'definition' ? 'Definition match' : 'Context usage'}
                      </span>
                      <span style={{ 
                        color: detail.isCorrect ? 'var(--color-green)' : 'var(--color-red)', 
                        fontWeight: '800',
                        fontSize: '13px'
                      }}>
                        {detail.isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
                      </span>
                    </div>
                    <p style={styles.feedbackQuestion}>{detail.question}</p>
                    <div style={styles.feedbackAnswersContainer}>
                      <div>
                        <span style={styles.feedbackLabel}>Your Answer: </span>
                        <span style={{ 
                          color: detail.isCorrect ? 'var(--color-green)' : 'var(--color-red)',
                          fontWeight: '700'
                        }}>
                          {detail.userAnswer || '(blank)'}
                        </span>
                      </div>
                      {!detail.isCorrect && (
                        <div>
                          <span style={styles.feedbackLabel}>Correct Answer: </span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
                            {detail.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={styles.feedbackExplanation}>
                      💡 <strong>Explanation:</strong> {detail.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Attempts History timeline */}
          <div className="glass-panel" style={{ textAlign: 'left', position: 'relative', zIndex: 2, marginBottom: '40px' }}>
            <h3 className="section-title" style={{ marginTop: 0, marginBottom: '20px' }}>Past Attempts</h3>
            {history.length <= 1 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No previous quiz history found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map((attempt) => {
                  const isExpanded = expandedAttemptId === attempt.id;
                  const attemptDetails = attempt.details;

                  return (
                    <div key={attempt.id} style={styles.historyRow}>
                      <div 
                        style={styles.historyHeader} 
                        onClick={() => toggleAttemptExpand(attempt.id)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700' }}>
                            Attempt on {formatDate(attempt.takenAt)}
                          </span>
                          <span style={{ fontSize: '12px', color: attempt.passed ? 'var(--color-green)' : 'var(--color-amber)', fontWeight: '700' }}>
                            {attempt.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--color-blue)' }}>
                            {attempt.score}/3
                          </span>
                          <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '12px' }}>
                            ▶
                          </span>
                        </div>
                      </div>

                      {/* Expandable Graded Questions details */}
                      {isExpanded && attemptDetails && Array.isArray(attemptDetails) && (
                        <div style={styles.historyExpandedBody}>
                          {attemptDetails.map((det, dIdx) => (
                            <div key={dIdx} style={styles.historyDetailCard}>
                              <div style={styles.feedbackHeaderRow}>
                                <span style={{ fontWeight: '700', fontSize: '13px' }}>Q{dIdx+1}: {det.question}</span>
                                <span style={{ color: det.isCorrect ? 'var(--color-green)' : 'var(--color-red)', fontWeight: '700', fontSize: '11px' }}>
                                  {det.isCorrect ? '✓' : '✗'}
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', marginTop: '6px' }}>
                                <span style={styles.feedbackLabel}>Answer:</span> {det.userAnswer || '(blank)'}
                                {!det.isCorrect && (
                                  <> | <span style={styles.feedbackLabel}>Correct:</span> {det.correctAnswer}</>
                                )}
                              </div>
                              {det.explanation && (
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                                  Explanation: {det.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. Main Quiz Interface
  return (
    <div className="animated-fade-in" style={styles.container}>
      {/* Background Perspective Grid */}
      <PerspectiveGrid />

      {/* Wide Content Wrapper */}
      <div className="wide-content-wrapper">
        {/* Header */}
        <header className="header-bar" style={{ pointerEvents: 'auto' }}>
          <button className="btn btn-secondary" style={styles.closeBtn} onClick={() => navigate('/dashboard')}>
            ✕ Close
          </button>
          <span style={styles.progressText}>Question {currentIndex + 1} of {questions.length}</span>
        </header>

        {/* Progress Bar */}
        <div style={{ ...styles.progressBarBg, pointerEvents: 'auto' }}>
          <div style={{ ...styles.progressBarActive, width: `${progressPercent}%` }} />
        </div>

        {/* Question Card */}
        <main style={styles.main}>
          <div style={styles.content}>
            {currentQuestion && (
              <div className="glass-panel" style={styles.questionCard}>
                <span style={styles.questionType}>
                  {currentQuestion.type === 'fill_blank' && '📝 Fill in the blank'}
                  {currentQuestion.type === 'definition' && '📖 Definition match'}
                  {currentQuestion.type === 'context' && '✍️ Context usage'}
                </span>
                <h2 style={styles.questionText}>{currentQuestion.question}</h2>
                {currentQuestion.type === 'fill_blank' && currentQuestion.hint && (
                  <p style={styles.hintText}>💡 Hint: starts with "{currentQuestion.hint}"</p>
                )}
              </div>
            )}

            {/* Answer Form */}
            <form onSubmit={handleSubmitAnswer} style={styles.form}>
              <input
                type="text"
                className="input-field"
                placeholder="Type your answer here..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                required
              />

              <button
                type="submit"
                className="btn btn-primary"
                style={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Grading...' : currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Submit Answer'}
              </button>
            </form>
          </div>
        </main>
      </div>
      
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
  scrollContainer: {
    width: '100%',
    minHeight: '100vh',
    position: 'relative',
    overflowY: 'auto',
    padding: '40px 16px',
  },
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: '24px',
    position: 'relative',
  },
  wideContent: {
    width: '100%',
    maxWidth: '680px',
    margin: '0 auto',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
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
    maxWidth: '400px',
    width: '100%',
  },
  errorText: {
    color: 'var(--color-red)',
    marginBottom: '16px',
    fontWeight: '600',
  },
  closeBtn: {
    padding: '8px 14px',
    fontSize: '14px',
  },
  progressText: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '32px',
    position: 'relative',
    zIndex: 2,
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: 'var(--color-blue)',
    transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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
    maxWidth: '680px',
    margin: '0 auto',
    pointerEvents: 'auto',
  },
  questionCard: {
    textAlign: 'left',
    minHeight: '180px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  questionType: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-blue)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '12px',
    display: 'inline-block',
  },
  questionText: {
    fontSize: '20px',
    fontWeight: '700',
    lineHeight: '1.5',
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
  hintText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
  },
  resultsCard: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px 32px',
  },
  resultDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  emoji: {
    fontSize: '56px',
    marginBottom: '16px',
  },
  resultHeader: {
    fontSize: '24px',
    fontWeight: '800',
    fontFamily: "'Fraunces', 'Libre Baskerville', Georgia, serif",
    marginBottom: '8px',
  },
  resultSub: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  scoreText: {
    fontSize: '48px',
    fontWeight: '900',
    fontFamily: "'Fraunces', 'Libre Baskerville', Georgia, serif",
    color: 'var(--color-blue)',
    marginBottom: '32px',
  },
  actionBtn: {
    width: '100%',
    padding: '14px',
  },
  feedbackList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  feedbackItem: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    padding: '16px 20px',
  },
  feedbackHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  feedbackQuestion: {
    fontSize: '15px',
    color: 'var(--text-primary)',
    marginBottom: '12px',
    fontWeight: '500',
  },
  feedbackAnswersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    marginBottom: '12px',
  },
  feedbackLabel: {
    color: 'var(--text-secondary)',
  },
  feedbackExplanation: {
    background: 'rgba(201, 162, 75, 0.05)',
    borderLeft: '3px solid var(--color-blue)',
    padding: '10px 14px',
    borderRadius: '0 8px 8px 0',
    fontSize: '13px',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
  },
  historyRow: {
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.01)',
    transition: 'background 0.2s',
  },
  historyExpandedBody: {
    padding: '14px 18px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    background: 'rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  historyDetailCard: {
    borderBottom: '1px dashed rgba(255, 255, 255, 0.05)',
    paddingBottom: '8px',
  },
};
