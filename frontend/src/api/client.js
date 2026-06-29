import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

// Create Axios instance
const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request Interceptor: Attach JWT token if it exists in localStorage
client.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle token refresh on 401 error
client.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if response is 401 Unauthorized and has not been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call token refresh endpoint using raw axios to avoid infinite loops
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        
        if (response.data && response.data.accessToken) {
          const newAccessToken = response.data.accessToken;
          localStorage.setItem('accessToken', newAccessToken);

          // Retry original request with the new access token
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return client(originalRequest);
        }
      } catch (refreshError) {
        console.error('Refresh token failed, clearing session:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Trigger page reload to redirect to login if session expires
        window.location.reload();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
