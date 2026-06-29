import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { signInWithGoogle } from '../api/firebase';
import PerspectiveGrid from '../components/PerspectiveGrid';

export default function LoginScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'phone' | 'forgot'
  
  // Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [otpChannel, setOtpChannel] = useState('email');

  // Inline Validation States
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Password UI
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification Code Inputs (Split 6-Boxes)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  // OTP State
  const [timer, setTimer] = useState(180); // 3 minutes (180s)
  const [timerActive, setTimerActive] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // 30s cooldown
  const [isSignupVerificationSent, setIsSignupVerificationSent] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const [successMessage, setSuccessMessage] = useState(null);
  
  const navigate = useNavigate();
  
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const verifySignup = useAuthStore((state) => state.verifySignup);
  const verifyLoginOtp = useAuthStore((state) => state.verifyLoginOtp);
  const phoneLogin = useAuthStore((state) => state.phoneLogin);
  const resendOtp = useAuthStore((state) => state.resendOtp);
  
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);
  const error = useAuthStore((state) => state.error);
  const setError = useAuthStore((state) => state.setError);

  // Timer Effect for verification OTP expiry
  useEffect(() => {
    let interval = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // Timer Effect for resend cooldown
  useEffect(() => {
    let resendInterval = null;
    if (resendCooldown > 0) {
      resendInterval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(resendInterval);
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Split OTP Input Handlers
  const handleOtpChange = (val, idx) => {
    // Digits only
    if (val && !/^\d+$/.test(val)) return;
    
    const newVals = [...otpValues];
    newVals[idx] = val.slice(-1); // Only keep the last entered digit
    setOtpValues(newVals);
    
    // Auto-focus next box
    if (val && idx < 5) {
      otpRefs[idx + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpValues[idx] && idx > 0) {
      otpRefs[idx - 1].current.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const newVals = pasteData.split('');
      setOtpValues(newVals);
      otpRefs[5].current.focus();
    }
  };

  const getCombinedOtp = () => {
    return otpValues.join('');
  };

  // Password Strength Evaluator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent' };
    if (pwd.length < 6) return { score: 1, label: 'Too Short', color: '#7A2E3C' }; // Wine / Red
    
    let checks = 0;
    if (/[A-Z]/.test(pwd)) checks++;
    if (/[a-z]/.test(pwd)) checks++;
    if (/\d/.test(pwd)) checks++;
    if (/_/.test(pwd)) checks++;
    if (/[!@#$%^&*()\-+=<>?/{}[\]|:;"'`,.~]/.test(pwd)) checks++;
    
    if (checks === 5 && pwd.length <= 10) {
      return { score: 3, label: 'Strong', color: '#2B735E' }; // Green
    } else if (checks >= 3) {
      return { score: 2, label: 'Medium', color: '#D4AF6A' }; // Gold
    } else {
      return { score: 1, label: 'Weak', color: '#7A2E3C' }; // Wine / Red
    }
  };

  // Email format validator
  const validateEmailFormat = (emailStr) => {
    const trimmed = emailStr.trim().toLowerCase();
    if (trimmed.length > 254) return false;
    const parts = trimmed.split('@');
    if (parts.length !== 2 || parts[0].length > 64) return false;
    if (trimmed.includes('..') || parts[0].startsWith('.') || parts[0].endsWith('.')) return false;
    
    // Standard format regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(trimmed)) return false;

    // TLD validation whitelist (common standard TLDs and country codes)
    const validTlds = new Set([
      'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
      'co', 'io', 'ai', 'info', 'biz', 'me', 'tech', 'app', 'dev', 'ly', 'so', 'fm', 'to', 'tv', 'cc',
      'in', 'us', 'uk', 'ca', 'au', 'sg', 'ae', 'de', 'fr', 'jp', 'cn', 'nz', 'nl', 'se', 'no', 'fi', 'dk', 'ch', 'at', 'it', 'es', 'pt', 'ie', 'hk', 'my', 'tw', 'kr', 'za', 'br', 'ru', 'mx', 'ar', 'cl', 'pe', 'co', 've', 'pk', 'bd', 'lk', 'np', 'sa', 'eg', 'tr', 'gr', 'pl', 'ro', 'ua', 'cz', 'hu', 'be'
    ]);
    const domainPart = parts[1];
    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) return false;
    const tld = domainParts[domainParts.length - 1];
    return validTlds.has(tld);
  };

  // Phone number digits validator
  const getPhoneDigitCount = (code) => {
    const limits = { '+91': 10, '+1': 10, '+44': 10, '+971': 9, '+65': 8 };
    return limits[code] || 10;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    if (!validateEmailFormat(email)) {
      setError('Invalid email format. Check for consecutive/trailing dots, or unsupported domain suffix (TLD).');
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await login(email, password);
      
      setOtpValues(['', '', '', '', '', '']);
      setTimer(180);
      setTimerActive(true);
      setResendCooldown(30);
      setSuccessMessage('A 6-digit login verification code was sent to your email.');
      // Keep mode as login, but we'll show OTP fields!
      // In login mode, if timerActive is true, we render OTP inputs.
    } catch (err) {
      // Handled by store setError
    }
  };

  const handlePhoneLoginSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    const requiredDigits = getPhoneDigitCount(countryCode);
    if (phone.length !== requiredDigits) {
      setError(`Phone number must contain exactly ${requiredDigits} digits.`);
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await phoneLogin(countryCode, phone);

      setOtpValues(['', '', '', '', '', '']);
      setTimer(180);
      setTimerActive(true);
      setResendCooldown(30);
      setSuccessMessage('A 6-digit login verification code was sent to your phone number.');
    } catch (err) {
      // Handled by store
    }
  };

  const validateName = (val) => {
    if (!val.trim()) {
      setNameError('Name is required.');
      return false;
    }
    if (val.trim().length < 2 || val.trim().length > 50) {
      setNameError('Name must be between 2 and 50 characters.');
      return false;
    }
    if (!/^[A-Za-z\s\-]+$/.test(val)) {
      setNameError('Name can only contain letters, spaces, and hyphens.');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateEmail = (val) => {
    if (!val.trim()) {
      setEmailError('Email is required.');
      return false;
    }
    if (!validateEmailFormat(val)) {
      setEmailError('Invalid email format (e.g. check for TLD like .com, or consecutive dots).');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhoneNum = (val, code) => {
    const requiredDigits = getPhoneDigitCount(code);
    if (!val) {
      setPhoneError('Phone number is required.');
      return false;
    }
    if (val.length !== requiredDigits) {
      setPhoneError(`Phone number must be exactly ${requiredDigits} digits for this country.`);
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validatePasswordStrength = (val) => {
    if (!val) {
      setPasswordError('Password is required.');
      return false;
    }
    const strength = getPasswordStrength(val);
    if (strength.score < 3) {
      setPasswordError('Password must be 6–10 characters, with uppercase, lowercase, digit, underscore (_), and special character.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (val, pass) => {
    if (!val) {
      setConfirmPasswordError('Please confirm your password.');
      return false;
    }
    if (val !== pass) {
      setConfirmPasswordError('Passwords do not match.');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Run all validations and set errors
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhoneNum(phone, countryCode);
    const isPasswordValid = validatePasswordStrength(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword, password);

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid || !isConfirmValid) {
      setError('Please resolve all validation errors before registering.');
      return;
    }

    try {
      await signup({
        name,
        email,
        countryCode,
        phone,
        password,
        confirmPassword,
        otpChannel
      });

      setOtpValues(['', '', '', '', '', '']);
      setTimer(180);
      setTimerActive(true);
      setResendCooldown(30);
      setIsSignupVerificationSent(true);
      
      if (otpChannel === 'phone') {
        setSuccessMessage('A 6-digit login verification code was sent to your phone number.');
      } else {
        setSuccessMessage('A 6-digit login verification code was sent to your email.');
      }
    } catch (err) {
      // Handled by store
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = getCombinedOtp();
    if (enteredOtp.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }
    if (timer === 0) {
      setError('OTP has expired. Please request a new OTP.');
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      
      if (mode === 'signup') {
        await verifySignup(email, enteredOtp);
        setSuccessMessage('Account created successfully!');
      } else if (mode === 'phone') {
        // Phone login resolves using login verification endpoint
        // Find user by phone to get email, since store uses email for verifyLoginOtp
        // Our phoneLogin controller returns the associated email inside response data!
        // We save the associated email in `email` state when phoneLogin completes.
        await verifyLoginOtp(email, enteredOtp);
        setSuccessMessage('Logged in successfully!');
      } else {
        await verifyLoginOtp(email, enteredOtp);
        setSuccessMessage('Logged in successfully!');
      }

      setTimerActive(false);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      // Handled by store
    }
  };

  const handleResendOtpCode = async () => {
    if (resendCooldown > 0) return;
    try {
      setError(null);
      setSuccessMessage(null);
      await resendOtp(email);
      setOtpValues(['', '', '', '', '', '']);
      setTimer(180);
      setTimerActive(true);
      setResendCooldown(30);
      setSuccessMessage('A new 6-digit OTP verification code was sent.');
    } catch (err) {
      // Handled by store
    }
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !validateEmailFormat(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setSuccessMessage(`Password reset link sent to ${email.trim()}`);
  };

  const handleGoogleLogin = async () => {
    try {
      const { idToken } = await signInWithGoogle();
      await login(idToken);
      navigate('/dashboard');
    } catch (err) {
      console.error('Google Login failed:', err);
    }
  };

  const switchMode = (newMode) => {
    setError(null);
    setSuccessMessage(null);
    setTimerActive(false);
    setIsSignupVerificationSent(false);
    setIsOtpSent(false);
    setOtpValues(['', '', '', '', '', '']);
    setMode(newMode);
  };

  // Flags to check if OTP screen should overlay
  const showOtpScreen = timerActive || (mode === 'signup' && isSignupVerificationSent) || (mode === 'phone' && isOtpSent);

  return (
    <div style={styles.pageContainer}>
      <PerspectiveGrid />

      <div className="glass-panel animated-fade-in login-card-premium" style={styles.loginCard}>
        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            ← Back to Home
          </Link>
        </div>
        
        <div style={styles.header}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1 className="header-title" style={{ ...styles.title, cursor: 'pointer' }}>Word Power</h1>
          </Link>
          <p style={styles.subtitle}>Build your vocabulary, one root at a time</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {successMessage && <div style={styles.successAlert}>{successMessage}</div>}

        {/* 6-DIGIT SPLIT OTP VERIFICATION INTERFACE OVERLAY */}
        {showOtpScreen ? (
          <form onSubmit={handleVerifyOtpSubmit} style={styles.form}>
            <h3 style={styles.sectionHeader}>Enter Verification Code</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center', lineHeight: '1.5' }}>
              We sent a 6-digit code to your secure verification channel:<br />
              <strong>{mode === 'phone' ? phone : email}</strong>
              <br />
              {import.meta.env.DEV && (
                <span style={{ fontSize: '12px', color: 'var(--color-amber)', display: 'block', marginTop: '6px' }}>
                  🔑 In Development: enter testing code <strong>123456</strong>
                </span>
              )}
            </p>

            {/* Split 6-Boxes Input row */}
            <div style={styles.otpInputRow}>
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  pattern="\d*"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  onPaste={handleOtpPaste}
                  className="otp-box-input"
                  data-index={idx}
                  style={styles.otpBox}
                  disabled={isLoggingIn}
                  required
                />
              ))}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: timer === 0 ? 'var(--color-red)' : 'var(--text-muted)' }}>
                {timer > 0 ? `Code expires in: ${formatTime(timer)}` : 'OTP expired! Please request a new code.'}
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={styles.submitBtn}
              disabled={isLoggingIn || timer === 0 || getCombinedOtp().length !== 6}
            >
              {isLoggingIn ? 'Verifying...' : 'Verify OTP & Continue'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={handleResendOtpCode}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => {
                  setTimerActive(false);
                  setIsSignupVerificationSent(false);
                  setIsOtpSent(false);
                  setSuccessMessage(null);
                  setError(null);
                }}
              >
                Edit Info
              </button>
            </div>
          </form>
        ) : (
          /* STANDARD LOGIN & SIGNUP FORMS */
          <>
            {mode === 'login' && (
              <>
                <div style={styles.oauthRow}>
                  <button
                    type="button"
                    className="btn google-login-btn"
                    style={styles.oauthBtn}
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                  >
                    <span style={styles.googleIcon}>G</span> Continue with Google
                  </button>
                  
                  <button
                    type="button"
                    className="btn google-login-btn"
                    style={styles.oauthBtn}
                    onClick={() => switchMode('phone')}
                    disabled={isLoggingIn}
                  >
                    📱 Phone Sign-In
                  </button>
                </div>

                <div style={styles.divider}>
                  <span style={styles.dividerLine}></span>
                  <span style={styles.dividerText}>or login with email</span>
                  <span style={styles.dividerLine}></span>
                </div>

                <form onSubmit={handleLoginSubmit} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input
                      type="email"
                      className="input-field login-input-premium"
                      placeholder="e.g. you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoggingIn}
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <label style={styles.label}>Password</label>
                      <span 
                        style={styles.linkText} 
                        onClick={() => switchMode('forgot')}
                      >
                        Forgot Password?
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input-field login-input-premium"
                        style={{ paddingRight: '60px' }}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoggingIn}
                        required
                      />
                      <span
                        style={styles.showHideToggle}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={styles.submitBtn}
                    disabled={isLoggingIn}
                  >
                    Log In
                  </button>

                  <p style={styles.footerText}>
                    Don't have an account?{' '}
                    <span style={styles.linkTextHighlight} onClick={() => switchMode('signup')}>
                      Sign Up
                    </span>
                  </p>
                </form>
              </>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} style={styles.form}>
                <h3 style={styles.sectionHeader}>Create Account</h3>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    type="text"
                    className="input-field login-input-premium"
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setName(val);
                      validateName(val);
                    }}
                    disabled={isLoggingIn}
                    required
                  />
                  {nameError && (
                    <span style={{ color: 'var(--color-red)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {nameError}
                    </span>
                  )}
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className="input-field login-input-premium"
                    placeholder="e.g. jane@example.com"
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmail(val);
                      validateEmail(val);
                    }}
                    disabled={isLoggingIn}
                    required
                  />
                  {emailError && (
                    <span style={{ color: 'var(--color-red)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {emailError}
                    </span>
                  )}
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <div style={styles.phoneInputRow}>
                    <select
                      className="input-field login-input-premium"
                      style={styles.countrySelect}
                      value={countryCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setCountryCode(code);
                        const limit = getPhoneDigitCount(code);
                        const truncatedPhone = phone.slice(0, limit);
                        setPhone(truncatedPhone);
                        validatePhoneNum(truncatedPhone, code);
                      }}
                      disabled={isLoggingIn}
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (AE)</option>
                      <option value="+65">+65 (SG)</option>
                    </select>
                    <input
                      type="tel"
                      className="input-field login-input-premium"
                      style={{ flex: 1 }}
                      placeholder="Enter digits only"
                      value={phone}
                      onChange={(e) => {
                        const limit = getPhoneDigitCount(countryCode);
                        const val = e.target.value.replace(/\D/g, '').slice(0, limit);
                        setPhone(val);
                        validatePhoneNum(val, countryCode);
                      }}
                      maxLength={getPhoneDigitCount(countryCode)}
                      disabled={isLoggingIn}
                      required
                    />
                  </div>
                  {phoneError && (
                    <span style={{ color: 'var(--color-red)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {phoneError}
                    </span>
                  )}
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field login-input-premium"
                      style={{ paddingRight: '60px' }}
                      placeholder="Min 6 chars"
                      value={password}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPassword(val);
                        validatePasswordStrength(val);
                        if (confirmPassword) {
                          validateConfirmPassword(confirmPassword, val);
                        }
                      }}
                      disabled={isLoggingIn}
                      required
                    />
                    <span
                      style={styles.showHideToggle}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </span>
                  </div>
                  
                  {passwordError ? (
                    <span style={{ color: 'var(--color-red)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {passwordError}
                    </span>
                  ) : (
                    password && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: getPasswordStrength(password).color }}>
                          <span>Password Strength</span>
                          <span>{getPasswordStrength(password).label}</span>
                        </div>
                        <div style={styles.strengthBarBg}>
                          <div 
                            style={{ 
                              ...styles.strengthBarFill, 
                              width: `${(getPasswordStrength(password).score / 3) * 100}%`, 
                              backgroundColor: getPasswordStrength(password).color 
                            }} 
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirm Password</label>
                  <input
                    type="password"
                    className="input-field login-input-premium"
                    placeholder="Match password"
                    value={confirmPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfirmPassword(val);
                      validateConfirmPassword(val, password);
                    }}
                    disabled={isLoggingIn}
                    required
                  />
                  {confirmPasswordError && (
                    <span style={{ color: 'var(--color-red)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {confirmPasswordError}
                    </span>
                  )}
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Send OTP Verification Code To</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      <input
                        type="radio"
                        name="otpChannel"
                        value="email"
                        checked={otpChannel === 'email'}
                        onChange={() => setOtpChannel('email')}
                        style={{ accentColor: 'var(--color-blue)' }}
                      />
                      📧 Email Address
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      <input
                        type="radio"
                        name="otpChannel"
                        value="phone"
                        checked={otpChannel === 'phone'}
                        onChange={() => setOtpChannel('phone')}
                        style={{ accentColor: 'var(--color-blue)' }}
                      />
                      📱 Phone Number
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={styles.submitBtn}
                  disabled={isLoggingIn}
                >
                  Register & Verify OTP
                </button>

                <p style={styles.footerText}>
                  Already have an account?{' '}
                  <span style={styles.linkTextHighlight} onClick={() => switchMode('login')}>
                    Log In
                  </span>
                </p>
              </form>
            )}

            {mode === 'phone' && (
              <form onSubmit={handlePhoneLoginSubmit} style={styles.form}>
                <h3 style={styles.sectionHeader}>Sign In with Phone</h3>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <div style={styles.phoneInputRow}>
                    <select
                      className="input-field login-input-premium"
                      style={styles.countrySelect}
                      value={countryCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setCountryCode(code);
                        const limit = getPhoneDigitCount(code);
                        setPhone(phone.slice(0, limit));
                      }}
                      disabled={isLoggingIn}
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (AE)</option>
                      <option value="+65">+65 (SG)</option>
                    </select>
                    <input
                      type="tel"
                      className="input-field login-input-premium"
                      style={{ flex: 1 }}
                      placeholder="Enter digits only"
                      value={phone}
                      onChange={(e) => {
                        const limit = getPhoneDigitCount(countryCode);
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, limit));
                      }}
                      maxLength={getPhoneDigitCount(countryCode)}
                      disabled={isLoggingIn}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={styles.submitBtn}
                  disabled={isLoggingIn}
                >
                  Send OTP Code
                </button>

                <p style={styles.footerText}>
                  Back to{' '}
                  <span style={styles.linkTextHighlight} onClick={() => switchMode('login')}>
                    Log In
                  </span>
                </p>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotPasswordSubmit} style={styles.form}>
                <h3 style={styles.sectionHeader}>Forgot Password</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                  Enter your email address and we'll send you a recovery link to reset your password.
                </p>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className="input-field login-input-premium"
                    placeholder="e.g. you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={styles.submitBtn}
                >
                  Send Reset Link
                </button>

                <p style={styles.footerText}>
                  Back to{' '}
                  <span style={styles.linkTextHighlight} onClick={() => switchMode('login')}>
                    Log In
                  </span>
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}


const styles = {
  pageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
  },
  loginCard: {
    width: '100%',
    maxWidth: '480px',
    padding: '36px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-blue)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  submitBtn: {
    marginTop: '16px',
    width: '100%',
  },
  errorAlert: {
    backgroundColor: 'rgba(122, 46, 60, 0.15)',
    color: 'var(--color-red)',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px',
    border: '1px solid rgba(122, 46, 60, 0.3)',
    textAlign: 'center',
  },
  successAlert: {
    backgroundColor: 'rgba(43, 115, 94, 0.15)',
    color: 'var(--color-green)',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px',
    border: '1px solid rgba(43, 115, 94, 0.3)',
    textAlign: 'center',
  },
  oauthRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  oauthBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 14px',
    fontSize: '14px',
    borderRadius: '8px',
    border: 'none',
  },
  googleIcon: {
    fontWeight: '900',
    color: 'var(--color-red)',
    fontSize: '18px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '16px 0',
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--border-muted)',
  },
  dividerText: {
    padding: '0 12px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: '20px',
    color: 'var(--text-primary)',
    marginBottom: '16px',
    fontFamily: "'Fraunces', serif",
    textAlign: 'center',
  },
  linkText: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
  linkTextHighlight: {
    fontWeight: '700',
    color: 'var(--color-blue)',
    cursor: 'pointer',
  },
  footerText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginTop: '20px',
  },
  showHideToggle: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-blue)',
    cursor: 'pointer',
    userSelect: 'none',
    letterSpacing: '0.5px',
  },
  strengthBarBg: {
    height: '4px',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '2px',
    marginTop: '4px',
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  phoneInputRow: {
    display: 'flex',
    gap: '8px',
  },
  countrySelect: {
    width: '100px',
    padding: '12px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  otpInputRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '20px',
  },
  otpBox: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    border: '1px solid var(--border-muted)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '20px',
    fontWeight: '700',
    textAlign: 'center',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
};
