import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import PerspectiveGrid from '../components/PerspectiveGrid';
import SpotlightNavbar from '../components/SpotlightNavbar';

export default function LandingScreen() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="animated-fade-in" style={styles.container}>
      {/* Absolute Perspective Grid Background */}
      <PerspectiveGrid />

      {/* Content wrapper with higher z-index to overlay background grid */}
      <div className="landing-content-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', marginBottom: '10px' }} className="animate-reveal">
          <h1 className="header-title" style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-1.5px' }}>Word Power</h1>
        </div>

        {/* Navigation Spotlight Header */}
        <SpotlightNavbar 
          className="animate-reveal"
          style={{ animationDelay: '0.1s' }}
          items={[
            { label: "Home", href: "/" },
            { label: "How It Works", href: "#how-it-works" },
            { label: "Why Us", href: "#why-us" },
            { label: user ? "Dashboard" : "Log In", href: user ? "/dashboard" : "/login" }
          ]}
        />

        {/* Hero Section */}
        <section id="home" className="animate-reveal" style={{ animationDelay: '0.2s', margin: '32px 0 40px 0' }}>
          <div className="glass-panel landing-hero-card">
            {/* Ghosted root fragment backdrop */}
            <div style={styles.heroGhostText}>VERT / ALTER / EGO</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={styles.heroTitle}>Learn vocabulary the way it actually sticks.</h2>
              <p style={styles.heroSubtitle}>
                Master high-frequency root words and semantic families using a science-backed, active-recall study path.
              </p>
              <div style={styles.ctaContainer}>
                <Link to={user ? "/dashboard" : "/login"} className="btn btn-primary" style={styles.ctaBtn}>
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="animate-reveal" style={{ animationDelay: '0.3s', marginBottom: '40px' }}>
          <h3 style={styles.sectionTitle}>How it works</h3>
          <div className="landing-grid">
            <div className="glass-panel landing-step-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={styles.stepNum}>1</div>
              <div style={styles.stepContent}>
                <h4 style={styles.stepTitle}>Learn Roots</h4>
                <p style={styles.stepDesc}>Study words grouped by semantic roots (e.g. <strong>EGO</strong> means "self", <strong>VERT</strong> means "turn").</p>
              </div>
            </div>

            <div className="glass-panel landing-step-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={styles.stepNum}>2</div>
              <div style={styles.stepContent}>
                <h4 style={styles.stepTitle}>Take Quizzes</h4>
                <p style={styles.stepDesc}>Test your knowledge with contextual quizzes. Get immediate score results and streak metrics.</p>
              </div>
            </div>

            <div className="glass-panel landing-step-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={styles.stepNum}>3</div>
              <div style={styles.stepContent}>
                <h4 style={styles.stepTitle}>Spaced Review</h4>
                <p style={styles.stepDesc}>The built-in Spaced Repetition algorithm schedules review tasks so you revise words right before you forget them.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Section */}
        <section id="why-us" className="animate-reveal" style={{ animationDelay: '0.4s', marginBottom: '40px' }}>
          <div className="glass-panel landing-why-card">
            <h3 style={styles.whyTitle}>Why Word Power?</h3>
            <p style={styles.whyText}>
              Traditional vocabulary building is boring and alphabetical. We believe in association-based learning. By grouping vocabulary under parent roots, you learn the underlying logic of words, letting you deduce meanings of unfamiliar words naturally.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="animate-reveal" style={{ animationDelay: '0.5s', marginTop: '60px', ...styles.footer }}>
          <p>&copy; {new Date().getFullYear()} Word Power. Built with passion for final year placements preparation.</p>
        </footer>
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
  heroTitle: {
    fontSize: '56px',
    fontWeight: '800',
    fontFamily: "'Fraunces', serif",
    lineHeight: '1.2',
    marginBottom: '16px',
    background: 'linear-gradient(135deg, #C9A24B 20%, #EDE8DC 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    display: 'inline-block',
  },
  heroGhostText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '8vw',
    fontWeight: '900',
    fontFamily: "'Fraunces', serif",
    fontStyle: 'italic',
    color: 'rgba(201, 162, 75, 0.025)',
    pointerEvents: 'none',
    zIndex: 0,
    userSelect: 'none',
    letterSpacing: '12px',
    whiteSpace: 'nowrap',
  },
  heroSubtitle: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    maxWidth: '520px',
    margin: '0 auto 24px auto',
  },
  ctaContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  ctaBtn: {
    padding: '14px 36px',
    fontSize: '16px',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  stepNum: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(201, 162, 75, 0.12)',
    color: 'var(--color-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '800',
    flexShrink: 0,
    marginBottom: '16px',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: '17px',
    fontWeight: '800',
    marginBottom: '8px',
    color: 'var(--text-primary)',
    letterSpacing: '0.04em',
  },
  stepDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  whyTitle: {
    fontSize: '19px',
    fontWeight: '800',
    marginBottom: '12px',
    color: 'var(--text-primary)',
    fontFamily: "'Fraunces', 'Libre Baskerville', Georgia, serif",
  },
  whyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  footer: {
    paddingTop: '20px',
    borderTop: '1px solid var(--border-muted)',
    color: 'var(--text-muted)',
    fontSize: '13px',
    textAlign: 'center',
  },
};
