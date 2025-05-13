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

// Market Data API service
class MarketDataService {
  // Get real-time quote for a symbol
  async getQuote(symbol) {
    try {
      const response = await apiClient.get(`/market/quote/${symbol}`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching quote', error);
      return null;
    }
  }
  
  // Get historical price data for a symbol
  async getHistoricalPrices(symbol, timeframe = '1M', interval = '1d') {
    try {
      const response = await apiClient.get(`/market/history/${symbol}`, {
        params: { timeframe, interval }
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching historical prices', error);
      return [];
    }
  }
  
  // Get option chain for a symbol
  async getOptionChain(symbol, expirationDate = null) {
    try {
      const params = expirationDate ? { expiration: expirationDate } : {};
      const response = await apiClient.get(`/options/chain/${symbol}`, { params });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching option chain', error);
      return { calls: [], puts: [] };
    }
  }
  
  // Get implied volatility data
  async getImpliedVolatility(symbol, timeframe = '3M') {
    try {
      const response = await apiClient.get(`/options/iv/${symbol}`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching implied volatility data', error);
      return [];
    }
  }
  
  // Get volatility surface data
  async getVolatilitySurface(symbol) {
    try {
      const response = await apiClient.get(`/options/iv-surface/${symbol}`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching volatility surface', error);
      return [];
    }
  }
  
  // Get option greeks for specific contracts
  async getOptionGreeks(symbol, optionType, strike, expiration) {
    try {
      const response = await apiClient.get(`/options/greeks/${symbol}`, {
        params: { 
          type: optionType, 
          strike, 
          expiration 
        }
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching option greeks', error);
      return null;
    }
  }
  
  // Calculate theoretical option prices and greeks
  async calculateOptionMetrics(params) {
    try {
      const response = await apiClient.post('/options/calculate', params);
      return response.data;
    } catch (error) {
      this.handleError('Error calculating option metrics', error);
      return null;
    }
  }
  
  // Get market movers (top gainers, losers, most active)
  async getMarketMovers(category = 'gainers', count = 10) {
    try {
      const response = await apiClient.get('/market/movers', {
        params: { category, count }
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching market movers', error);
      return [];
    }
  }
  
  // Get market indices data
  async getMarketIndices() {
    try {
      const response = await apiClient.get('/market/indices');
      return response.data;
    } catch (error) {
      this.handleError('Error fetching market indices', error);
      return [];
    }
  }
  
  // Get market sectors performance
  async getSectorPerformance(timeframe = '1D') {
    try {
      const response = await apiClient.get('/market/sectors', {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching sector performance', error);
      return [];
    }
  }
  
  // Get economic calendar events
  async getEconomicCalendar(startDate, endDate) {
    try {
      const response = await apiClient.get('/market/economic-calendar', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching economic calendar', error);
      return [];
    }
  }
  
  // Get company earnings calendar
  async getEarningsCalendar(startDate, endDate) {
    try {
      const response = await apiClient.get('/market/earnings-calendar', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching earnings calendar', error);
      return [];
    }
  }
  
  // Get company profile and fundamentals
  async getCompanyProfile(symbol) {
    try {
      const response = await apiClient.get(`/market/company/${symbol}`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching company profile', error);
      return null;
    }
  }
  
  // Search for stocks, ETFs, etc.
  async searchSecurities(query) {
    try {
      const response = await apiClient.get('/market/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      this.handleError('Error searching securities', error);
      return [];
    }
  }
  
  // Get real-time market data updates via WebSocket
  setupWebSocket(symbols, callback) {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required for real-time data');
      }
      
      const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/market?token=${token}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        ws.send(JSON.stringify({ 
          action: 'subscribe', 
          symbols: Array.isArray(symbols) ? symbols : [symbols]
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('Error parsing WebSocket message', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
      
      return {
        subscribe: (newSymbols) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              action: 'subscribe', 
              symbols: Array.isArray(newSymbols) ? newSymbols : [newSymbols] 
            }));
          }
        },
        unsubscribe: (symbols) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              action: 'unsubscribe', 
              symbols: Array.isArray(symbols) ? symbols : [symbols] 
            }));
          }
        },
        close: () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        }
      };
    } catch (error) {
      this.handleError('Error setting up WebSocket connection', error);
      return null;
    }
  }
  
  // Error handling
  handleError(message, error) {
    console.error(message, error);
    
    // You can implement more sophisticated error handling here
    // For example, logging to a service or showing notifications
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Create singleton instance
const marketDataService = new MarketDataService();

export default marketDataService;
