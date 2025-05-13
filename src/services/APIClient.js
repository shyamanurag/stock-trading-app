import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.stocktrading.example.com/v1';
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: DEFAULT_HEADERS,
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration and refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });
        
        const { token } = response.data;
        localStorage.setItem('auth_token', token);
        
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login if refresh fails
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Error handling utility
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  let errorMessage = defaultMessage;

  if (error.response) {
    // The request was made and the server responded with an error status
    const serverError = error.response.data.error || error.response.data.message;
    if (serverError) {
      errorMessage = serverError;
    } else {
      errorMessage = `Error: ${error.response.status}`;
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage = 'No response from server. Please check your internet connection.';
  } else {
    // Something happened in setting up the request
    errorMessage = error.message || defaultMessage;
  }

  return errorMessage;
};

// Request timeout utility
export const withTimeout = (promise, timeout = 30000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

// Format query parameters
export const formatQueryParams = (params) => {
  const cleanParams = {};
  
  // Remove null/undefined/empty string values
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      cleanParams[key] = params[key];
    }
  });
  
  return cleanParams;
};

export default apiClient;
