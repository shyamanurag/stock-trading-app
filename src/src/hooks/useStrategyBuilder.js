import apiClient from './APIClient';

// Strategy Management Service handles all operations related to options strategies
class StrategyManagementService {
  // Create a new strategy
  async createStrategy(strategyData) {
    try {
      const response = await apiClient.post('/strategies', strategyData);
      return response.data;
    } catch (error) {
      this.handleError('Error creating strategy', error);
      return null;
    }
  }
  
  // Get a strategy by ID
  async getStrategy(strategyId) {
    try {
      const response = await apiClient.get(`/strategies/${strategyId}`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching strategy', error);
      return null;
    }
  }
  
  // Update an existing strategy
  async updateStrategy(strategyId, strategyData) {
    try {
      const response = await apiClient.put(`/strategies/${strategyId}`, strategyData);
      return response.data;
    } catch (error) {
      this.handleError('Error updating strategy', error);
      return null;
    }
  }
  
  // Delete a strategy
  async deleteStrategy(strategyId) {
    try {
      await apiClient.delete(`/strategies/${strategyId}`);
      return true;
    } catch (error) {
      this.handleError('Error deleting strategy', error);
      return false;
    }
  }
  
  // List all user strategies
  async getStrategies(filters = {}) {
    try {
      const response = await apiClient.get('/strategies', { params: filters });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching strategies', error);
      return [];
    }
  }
  
  // List strategy templates
  async getStrategyTemplates() {
    try {
      const response = await apiClient.get('/strategies/templates');
      return response.data;
    } catch (error) {
      this.handleError('Error fetching strategy templates', error);
      return [];
    }
  }
  
  // Create a strategy from a template
  async createFromTemplate(templateId, customizations = {}) {
    try {
      const response = await apiClient.post(`/strategies/templates/${templateId}`, customizations);
      return response.data;
    } catch (error) {
      this.handleError('Error creating strategy from template', error);
      return null;
    }
  }
  
  // Analyze a strategy without saving it
  async analyzeStrategy(strategyData) {
    try {
      const response = await apiClient.post('/strategies/analyze', strategyData);
      return response.data;
    } catch (error) {
      this.handleError('Error analyzing strategy', error);
      return null;
    }
  }
  
  // Calculate option strategy metrics (P/L, Greeks, etc.)
  async calculateStrategyMetrics(strategyData, params = {}) {
    try {
      const response = await apiClient.post('/strategies/calculate', {
        strategy: strategyData,
        params
      });
      return response.data;
    } catch (error) {
      this.handleError('Error calculating strategy metrics', error);
      return null;
    }
  }
  
  // Run scenario analysis on a strategy
  async runScenarioAnalysis(strategyId, scenarios) {
    try {
      const response = await apiClient.post(`/strategies/${strategyId}/scenarios`, { scenarios });
      return response.data;
    } catch (error) {
      this.handleError('Error running scenario analysis', error);
      return null;
    }
  }
  
  // Backtest a strategy
  async backtestStrategy(strategyId, backtestParams) {
    try {
      const response = await apiClient.post(`/strategies/${strategyId}/backtest`, backtestParams);
      return response.data;
    } catch (error) {
      this.handleError('Error running backtest', error);
      return null;
    }
  }
  
  // Get strategy performance metrics
  async getStrategyPerformance(strategyId, timeframe = '1M') {
    try {
      const response = await apiClient.get(`/strategies/${strategyId}/performance`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching strategy performance', error);
      return null;
    }
  }
  
  // Get open positions for a strategy
  async getStrategyPositions(strategyId) {
    try {
      const response = await apiClient.get(`/strategies/${strategyId}/positions`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching strategy positions', error);
      return [];
    }
  }
  
  // Get historical trades for a strategy
  async getStrategyTrades(strategyId, params = {}) {
    try {
      const response = await apiClient.get(`/strategies/${strategyId}/trades`, { params });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching strategy trades', error);
      return [];
    }
  }
  
  // Execute a trade for a strategy
  async executeTrade(strategyId, tradeData) {
    try {
      const response = await apiClient.post(`/strategies/${strategyId}/trades`, tradeData);
      return response.data;
    } catch (error) {
      this.handleError('Error executing trade', error);
      return null;
    }
  }
  
  // Share a strategy with other users
  async shareStrategy(strategyId, shareSettings) {
    try {
      const response = await apiClient.post(`/strategies/${strategyId}/share`, shareSettings);
      return response.data;
    } catch (error) {
      this.handleError('Error sharing strategy', error);
      return null;
    }
  }
  
  // Get public strategies shared by other users
  async getPublicStrategies(filters = {}) {
    try {
      const response = await apiClient.get('/strategies/public', { params: filters });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching public strategies', error);
      return [];
    }
  }
  
  // Clone a public strategy
  async cloneStrategy(strategyId, customizations = {}) {
    try {
      const response = await apiClient.post(`/strategies/${strategyId}/clone`, customizations);
      return response.data;
    } catch (error) {
      this.handleError('Error cloning strategy', error);
      return null;
    }
  }
  
  // Export a strategy to different formats (PDF, CSV, etc.)
  async exportStrategy(strategyId, format = 'json') {
    try {
      const response = await apiClient.get(`/strategies/${strategyId}/export`, {
        params: { format },
        responseType: format === 'pdf' ? 'blob' : 'json'
      });
      
      return response.data;
    } catch (error) {
      this.handleError('Error exporting strategy', error);
      return null;
    }
  }
  
  // Get strategy risk metrics
  async getStrategyRiskMetrics(strategyId) {
    try {
      const response = await apiClient.get(`/strategies/${strategyId}/risk`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching risk metrics', error);
      return null;
    }
  }
  
  // Set up alerts for a strategy
  async setupStrategyAlerts(strategyId, alertsConfig) {
    try {
      const response = await apiClient.post(`/strategies/${strategyId}/alerts`, alertsConfig);
      return response.data;
    } catch (error) {
      this.handleError('Error setting up alerts', error);
      return null;
    }
  }
  
  // Get strategy alerts
  async getStrategyAlerts(strategyId) {
    try {
      const response = await apiClient.get(`/strategies/${strategyId}/alerts`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching alerts', error);
      return [];
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
const strategyManagementService = new StrategyManagementService();

export default strategyManagementService;
