import apiClient from './APIClient';
import { formatQueryParams } from './APIClient';

// BacktestService handles strategy backtesting and performance analysis
class BacktestService {
  // Run a backtest on a strategy
  async runBacktest(strategy, params = {}) {
    try {
      const response = await apiClient.post('/backtest/run', {
        strategy,
        params: formatQueryParams(params)
      });
      return response.data;
    } catch (error) {
      this.handleError('Error running backtest', error);
      return null;
    }
  }
  
  // Get a previously run backtest by ID
  async getBacktest(backtestId) {
    try {
      const response = await apiClient.get(`/backtest/${backtestId}`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching backtest', error);
      return null;
    }
  }
  
  // List all backtests for a user
  async getBacktests(filters = {}) {
    try {
      const response = await apiClient.get('/backtest', { 
        params: formatQueryParams(filters)
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching backtests', error);
      return [];
    }
  }
  
  // Delete a backtest
  async deleteBacktest(backtestId) {
    try {
      await apiClient.delete(`/backtest/${backtestId}`);
      return true;
    } catch (error) {
      this.handleError('Error deleting backtest', error);
      return false;
    }
  }
  
  // Get detailed metrics for a backtest
  async getBacktestMetrics(backtestId) {
    try {
      const response = await apiClient.get(`/backtest/${backtestId}/metrics`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching backtest metrics', error);
      return null;
    }
  }
  
  // Get trade history from a backtest
  async getBacktestTrades(backtestId, params = {}) {
    try {
      const response = await apiClient.get(`/backtest/${backtestId}/trades`, {
        params: formatQueryParams(params)
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching backtest trades', error);
      return [];
    }
  }
  
  // Get equity curve data from a backtest
  async getEquityCurve(backtestId) {
    try {
      const response = await apiClient.get(`/backtest/${backtestId}/equity-curve`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching equity curve', error);
      return [];
    }
  }
  
  // Get drawdown analysis from a backtest
  async getDrawdownAnalysis(backtestId) {
    try {
      const response = await apiClient.get(`/backtest/${backtestId}/drawdown`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching drawdown analysis', error);
      return null;
    }
  }
  
  // Get monthly returns from a backtest
  async getMonthlyReturns(backtestId) {
    try {
      const response = await apiClient.get(`/backtest/${backtestId}/monthly-returns`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching monthly returns', error);
      return {};
    }
  }
  
  // Run Monte Carlo simulation on a backtest
  async runMonteCarloSimulation(backtestId, params = {}) {
    try {
      const response = await apiClient.post(`/backtest/${backtestId}/monte-carlo`, 
        formatQueryParams(params)
      );
      return response.data;
    } catch (error) {
      this.handleError('Error running Monte Carlo simulation', error);
      return null;
    }
  }
  
  // Compare multiple backtests
  async compareBacktests(backtestIds) {
    try {
      const response = await apiClient.post('/backtest/compare', { backtestIds });
      return response.data;
    } catch (error) {
      this.handleError('Error comparing backtests', error);
      return null;
    }
  }
  
  // Optimize strategy parameters
  async optimizeStrategy(strategy, paramRanges, optimizationGoal = 'sharpeRatio') {
    try {
      const response = await apiClient.post('/backtest/optimize', {
        strategy,
        paramRanges,
        optimizationGoal
      });
      return response.data;
    } catch (error) {
      this.handleError('Error optimizing strategy', error);
      return null;
    }
  }
  
  // Get optimization results
  async getOptimizationResults(optimizationId) {
    try {
      const response = await apiClient.get(`/backtest/optimize/${optimizationId}`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching optimization results', error);
      return null;
    }
  }
  
  // Get historical market data for backtesting
  async getHistoricalData(symbol, startDate, endDate, interval = '1d') {
    try {
      const response = await apiClient.get('/backtest/historical-data', {
        params: formatQueryParams({
          symbol,
          startDate,
          endDate,
          interval
        })
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching historical data', error);
      return [];
    }
  }
  
  // Get historical option chain data
  async getHistoricalOptionChain(symbol, date) {
    try {
      const response = await apiClient.get('/backtest/historical-options', {
        params: formatQueryParams({
          symbol,
          date
        })
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching historical option chain', error);
      return { calls: [], puts: [] };
    }
  }
  
  // Get historical implied volatility data
  async getHistoricalIV(symbol, startDate, endDate) {
    try {
      const response = await apiClient.get('/backtest/historical-iv', {
        params: formatQueryParams({
          symbol,
          startDate,
          endDate
        })
      });
      return response.data;
    } catch (error) {
      this.handleError('Error fetching historical IV data', error);
      return [];
    }
  }
  
  // Export backtest results to different formats
  async exportBacktestResults(backtestId, format = 'json') {
    try {
      const response = await apiClient.get(`/backtest/${backtestId}/export`, {
        params: { format },
        responseType: format === 'pdf' || format === 'xlsx' ? 'blob' : 'json'
      });
      
      return response.data;
    } catch (error) {
      this.handleError('Error exporting backtest results', error);
      return null;
    }
  }
  
  // Get walk-forward analysis
  async runWalkForwardAnalysis(strategy, params = {}) {
    try {
      const response = await apiClient.post('/backtest/walk-forward', {
        strategy,
        params: formatQueryParams(params)
      });
      return response.data;
    } catch (error) {
      this.handleError('Error running walk-forward analysis', error);
      return null;
    }
  }
  
  // Get walk-forward results
  async getWalkForwardResults(analysisId) {
    try {
      const response = await apiClient.get(`/backtest/walk-forward/${analysisId}`);
      return response.data;
    } catch (error) {
      this.handleError('Error fetching walk-forward results', error);
      return null;
    }
  }
  
  // Error handling
  handleError(message, error) {
    console.error(message, error);
    
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Create singleton instance
const backtestService = new BacktestService();

export default backtestService;
