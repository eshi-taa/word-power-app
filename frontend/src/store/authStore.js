import { create } from 'zustand';
import client from '../api/client';

const useAuthStore = create((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  isLoading: false,
  isLoggingIn: false,
  error: null,

  // 1. Login with credentials (custom) or legacy token
  login: async (emailOrToken, password) => {
    set({ isLoggingIn: true, error: null });
    try {
      if (password === undefined) {
        // Legacy/Firebase login flow
        const response = await client.post('/auth/firebase', { firebaseToken: emailOrToken });
        const { accessToken, refreshToken, user } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isLoggingIn: false, error: null });
        return user;
      } else {
        // Custom credentials login (first step: requests OTP)
        const response = await client.post('/auth/login', { email: emailOrToken, password });
        set({ isLoggingIn: false });
        return response.data; // { message, email }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      set({ error: errorMessage, isLoggingIn: false });
      throw err;
    }
  },

  // 2. Verify Login OTP (second step: issues tokens)
  verifyLoginOtp: async (email, code) => {
    set({ isLoggingIn: true, error: null });
    try {
      const response = await client.post('/auth/verify-login', { email, code });
      const { accessToken, refreshToken, user } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoggingIn: false, error: null });
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'OTP verification failed';
      set({ error: errorMessage, isLoggingIn: false });
      throw err;
    }
  },

  // Phone number login (first step: requests OTP)
  phoneLogin: async (countryCode, phone) => {
    set({ isLoggingIn: true, error: null });
    try {
      const response = await client.post('/auth/phone-login', { countryCode, phone });
      set({ isLoggingIn: false });
      return response.data; // { message, email }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Phone sign-in failed';
      set({ error: errorMessage, isLoggingIn: false });
      throw err;
    }
  },

  // 3. Signup (first step: requests OTP)
  signup: async (signupData) => {
    set({ isLoggingIn: true, error: null });
    try {
      const response = await client.post('/auth/signup', signupData);
      set({ isLoggingIn: false });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      set({ error: errorMessage, isLoggingIn: false });
      throw err;
    }
  },

  // 4. Verify Signup OTP (second step: issues tokens)
  verifySignup: async (email, code) => {
    set({ isLoggingIn: true, error: null });
    try {
      const response = await client.post('/auth/verify-signup', { email, code });
      const { accessToken, refreshToken, user } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoggingIn: false, error: null });
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Verification failed';
      set({ error: errorMessage, isLoggingIn: false });
      throw err;
    }
  },

  // 5. Resend OTP code with hourly/cooldown limits
  resendOtp: async (email) => {
    try {
      const response = await client.post('/auth/resend-otp', { email });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Resend failed';
      set({ error: errorMessage });
      throw err;
    }
  },

  // 6. Logout and clear session
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null });
  },

  // 7. Verify session on load
  checkAuth: () => {
    const accessToken = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (accessToken && user) {
      set({ user: JSON.parse(user), isLoading: false });
      return true;
    }
    set({ user: null, isLoading: false });
    return false;
  },

  setError: (message) => set({ error: message }),
}));

export default useAuthStore;
export { useAuthStore };
