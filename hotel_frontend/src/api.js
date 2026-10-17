/**
 * Axios instance configured for our Django backend.
 * All API calls go through this instance.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  withCredentials: true, // Send cookies for session auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get CSRF token from cookie (Django sets it)
function getCsrfToken() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith('csrftoken=')) {
      return cookie.substring('csrftoken='.length);
    }
  }
  return '';
}

// Add CSRF token to every request
api.interceptors.request.use((config) => {
  const token = getCsrfToken();
  if (token) {
    config.headers['X-CSRFToken'] = token;
  }
  return config;
});

export default api;
