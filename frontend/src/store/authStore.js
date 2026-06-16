import { create } from 'zustand';
import client from '../api/client';

const useAuthStore = create((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  isLoading: false,
  error: null,

  // 1. Login with Firebase/Mock Token
  login: async (firebaseToken) => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.post('/auth/firebase', { firebaseToken });
      const { accessToken, refreshToken, user } = response.data;

      // Save credentials in browser storage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, isLoading: false, error: null });
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  // 2. Logout and clear session
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null });
  },

  // 3. Verify session on load
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

  // 4. Manual error setter
  setError: (message) => set({ error: message }),
}));

export default useAuthStore;
export { useAuthStore };
