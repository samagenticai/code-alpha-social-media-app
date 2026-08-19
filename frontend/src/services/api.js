import axios from 'axios';
import { API_URL } from '../config/api';

/**
 * Resolve axios baseURL for the current environment.
 * Rejects accidental localhost API URLs when the app is served from a real host.
 */
const getBaseURL = () => {
  const envUrl = API_URL;
  if (!envUrl) return '/api';

  if (envUrl.startsWith('/')) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalHost && /localhost|127\.0\.0\.1/.test(envUrl)) {
      console.warn(
        '[api] VITE_API_URL points at localhost while the app is not on localhost. Falling back to /api.'
      );
      return '/api';
    }
  }

  return envUrl;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject({ ...error, message });
  }
);

export default api;
