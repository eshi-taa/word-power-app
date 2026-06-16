import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { handleApiError } from '../api/handleError';

export default function QuizScreen({ groupId, setScreen }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Results State
  const [quizFinished, setQuizFinished] = useState(false);
  const [result, setResult] = useState(null); // { score, passed, total }

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
    } catch (err) {
      console.error('Error loading quiz:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizQuestions();
  }, [groupId]);

  const handleSubmitAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!currentAnswer.trim()) {
      alert('Please enter your answer before continuing.');
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
        groupId,
        answers: finalAnswers
      });
      setResult(response.data);
      setQuizFinished(true);
    } catch (err) {
      console.error('Error submitting quiz answers:', err);
      alert(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // 1. Loading State
  if (isLoading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Preparing your quiz...</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div style={styles.centerContainer}>
        <div className="glass-panel" style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button className="btn btn-primary" onClick={fetchQuizQuestions}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 3. Quiz Results Screen
  if (quizFinished && result) {
    return (
      <div className="animated-fade-in" style={styles.centerContainer}>
        <div className="glass-panel" style={styles.resultsCard}>
          {result.passed ? (
            <div style={styles.resultDetails}>
              <div style={styles.emoji}>🏆🎉</div>
              <h2 style={styles.resultHeader}>Congratulations!</h2>
              <p style={styles.resultSub}>You passed the quiz and unlocked the next root group!</p>
              <h1 style={styles.scoreText}>{result.score} / {result.total}</h1>
              <button 
                className="btn btn-success"
                style={styles.actionBtn}
                onClick={() => setScreen('Home')}
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
      </div>
    );
  }

  // 4. Main Quiz Interface
  return (
    <div className="animated-fade-in" style={styles.container}>
      {/* Header */}
      <header className="header-bar">
        <button className="btn btn-secondary" style={styles.closeBtn} onClick={() => setScreen('Home')}>
          ✕ Close
        </button>
        <span style={styles.progressText}>Question {currentIndex + 1} of {questions.length}</span>
      </header>

      {/* Progress Bar */}
      <div style={styles.progressBarBg}>
        <div style={{ ...styles.progressBarActive, width: `${progressPercent}%` }} />
      </div>

      {/* Question Card */}
      <main style={styles.quizContent}>
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
      </main>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  },
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: '24px',
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
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: 'var(--color-blue)',
    transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  quizContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
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
    fontFamily: 'Outfit, sans-serif',
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
    fontFamily: 'Outfit, sans-serif',
    color: 'var(--color-blue)',
    marginBottom: '32px',
  },
  actionBtn: {
    width: '100%',
    padding: '14px',
  },
};
