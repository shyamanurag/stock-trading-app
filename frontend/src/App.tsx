// FRONTEND IMPLEMENTATION (REACT WITH TYPESCRIPT)
// File: frontend/src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StockProvider } from './contexts/StockContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <StockProvider>
                      <PortfolioProvider>
                        <DashboardPage />
                      </PortfolioProvider>
                    </StockProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
          <Toaster position="bottom-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

// File: frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface DecodedToken {
  exp: number;
  user_id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithDemo: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Load user from local storage on initial load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }
      
      try {
        // Set auth header for all future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch current user data
        const response = await api.get('/api/users/me');
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const loginWithDemo = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/demo');
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', { name, email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };
  
  const forgotPassword = async (email: string) => {
    await api.post('/api/auth/forgot-password', { email });
  };
  
  const resetPassword = async (token: string, password: string) => {
    await api.post('/api/auth/reset-password', { token, password });
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithDemo,
        register,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// File: frontend/src/contexts/StockContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number | null;
  dividend: number | null;
  sector: string | null;
  industry: string | null;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
}

export interface Watchlist {
  id: string;
  name: string;
  stocks: WatchlistItem[];
}

interface StockContextType {
  stocks: Record<string, Stock>;
  watchlists: Watchlist[];
  loading: boolean;
  addToWatchlist: (watchlistId: string, symbol: string) => Promise<void>;
  removeFromWatchlist: (watchlistId: string, symbol: string) => Promise<void>;
  createWatchlist: (name: string) => Promise<void>;
  deleteWatchlist: (id: string) => Promise<void>;
  renameWatchlist: (id: string, name: string) => Promise<void>;
  fetchStockData: (symbol: string) => Promise<Stock | null>;
  searchStocks: (query: string) => Promise<Stock[]>;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const useStocks = () => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStocks must be used within a StockProvider');
  }
  return context;
};

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stocks, setStocks] = useState<Record<string, Stock>>({});
  const queryClient = useQueryClient();

  // Fetch watchlists
  const { data: watchlists = [], isLoading: watchlistsLoading } = useQuery({
    queryKey: ['watchlists'],
    queryFn: async () => {
      const response = await api.get('/api/watchlists');
      return response.data;
    },
  });

  // Fetch stock data for all watched stocks
  useEffect(() => {
    const symbols = new Set<string>();
    watchlists.forEach((watchlist: Watchlist) => {
      watchlist.stocks.forEach(stock => {
        symbols.add(stock.symbol);
      });
    });

    if (symbols.size === 0) return;

    const fetchStocksData = async () => {
      const symbolsArray = Array.from(symbols);
      try {
        const response = await api.get(`/api/stocks/batch?symbols=${symbolsArray.join(',')}`);
        setStocks(prevStocks => ({ ...prevStocks, ...response.data }));
      } catch (error) {
        console.error('Failed to fetch stock prices:', error);
      }
    };

    fetchStocksData();
    const interval = setInterval(fetchStocksData, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [watchlists]);

  const fetchStockData = useCallback(async (symbol: string): Promise<Stock | null> => {
    try {
      const response = await api.get(`/api/stocks/quote/${symbol}`);
      const stockData = response.data;
      
      // Update the stocks state
      setStocks(prev => ({ ...prev, [symbol]: stockData }));
      
      return stockData;
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error);
      return null;
    }
  }, []);

  const searchStocks = useCallback(async (query: string): Promise<Stock[]> => {
    try {
      const response = await api.get(`/api/stocks/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Stock search error:', error);
      return [];
    }
  }, []);

  // Add stock to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) => {
      const response = await api.post(`/api/watchlists/${watchlistId}/stocks`, { symbol });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success(`Added ${variables.symbol} to watchlist`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add stock to watchlist');
    },
  });

  // Remove stock from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) => {
      const response = await api.delete(`/api/watchlists/${watchlistId}/stocks/${symbol}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success(`Removed ${variables.symbol} from watchlist`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove stock from watchlist');
    },
  });

  // Create watchlist mutation
  const createWatchlistMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/api/watchlists', { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Watchlist created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create watchlist');
    },
  });

  // Delete watchlist mutation
  const deleteWatchlistMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/watchlists/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Watchlist deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete watchlist');
    },
  });

  // Rename watchlist mutation
  const renameWatchlistMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const response = await api.put(`/api/watchlists/${id}`, { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      toast.success('Watchlist renamed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to rename watchlist');
    },
  });

  const addToWatchlist = useCallback(
    (watchlistId: string, symbol: string) => addToWatchlistMutation.mutateAsync({ watchlistId, symbol }),
    [addToWatchlistMutation]
  );

  const removeFromWatchlist = useCallback(
    (watchlistId: string, symbol: string) => removeFromWatchlistMutation.mutateAsync({ watchlistId, symbol }),
    [removeFromWatchlistMutation]
  );

  const createWatchlist = useCallback(
    (name: string) => createWatchlistMutation.mutateAsync(name),
    [createWatchlistMutation]
  );

  const deleteWatchlist = useCallback(
    (id: string) => deleteWatchlistMutation.mutateAsync(id),
    [deleteWatchlistMutation]
  );

  const renameWatchlist = useCallback(
    (id: string, name: string) => renameWatchlistMutation.mutateAsync({ id, name }),
    [renameWatchlistMutation]
  );

  return (
    <StockContext.Provider
      value={{
        stocks,
        watchlists,
        loading: watchlistsLoading,
        addToWatchlist,
        removeFromWatchlist,
        createWatchlist,
        deleteWatchlist,
        renameWatchlist,
        fetchStockData,
        searchStocks,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

// File: frontend/src/contexts/PortfolioContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useStocks, Stock } from './StockContext';

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  quantity: number;
  price: number;
  type: 'BUY' | 'SELL';
  timestamp: string;
}

export interface Portfolio {
  id: string;
  name: string;
  cashBalance: number;
  positions: Position[];
}

interface PortfolioContextType {
  portfolio: Portfolio | null;
  transactions: Transaction[];
  loading: boolean;
  buyStock: (symbol: string, quantity: number, price: number) => Promise<void>;
  sellStock: (symbol: string, quantity: number, price: number) => Promise<void>;
  getPortfolioValue: () => number;
  getTotalProfitLoss: () => { value: number; percentage: number };
  getPositionValue: (position: Position) => number;
  getPositionProfitLoss: (position: Position) => { value: number; percentage: number };
  getPositionAllocation: (position: Position) => number;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { stocks, fetchStockData } = useStocks();
  const queryClient = useQueryClient();

  // Fetch portfolio data
  const { isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await api.get('/api/portfolio');
      const data = response.data;
      setPortfolio(data);
      return data;
    },
  });

  // Fetch transaction history
  const { isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/api/transactions');
      const data = response.data;
      setTransactions(data);
      return data;
    },
  });

  // Buy stock mutation
  const buyMutation = useMutation({
    mutationFn: async ({ symbol, quantity, price }: { symbol: string; quantity: number; price: number }) => {
      const response = await api.post('/api/transactions/buy', { symbol, quantity, price });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`Bought ${data.transaction.quantity} shares of ${data.transaction.symbol}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to buy stock');
    },
  });

  // Sell stock mutation
  const sellMutation = useMutation({
    mutationFn: async ({ symbol, quantity, price }: { symbol: string; quantity: number; price: number }) => {
      const response = await api.post('/api/transactions/sell', { symbol, quantity, price });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`Sold ${data.transaction.quantity} shares of ${data.transaction.symbol}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to sell stock');
    },
  });

  const buyStock = useCallback(
    async (symbol: string, quantity: number, price: number) => {
      // Ensure we have the latest price data
      let stockData: Stock | null = stocks[symbol];
      
      if (!stockData) {
        stockData = await fetchStockData(symbol);
        if (!stockData) {
          toast.error(`Unable to get current price for ${symbol}`);
          return;
        }
      }
      
      // Use the current market price
      buyMutation.mutateAsync({ symbol, quantity, price: stockData.price });
    },
    [buyMutation, fetchStockData, stocks]
  );

  const sellStock = useCallback(
    async (symbol: string, quantity: number, price: number) => {
      // Ensure we have the latest price data
      let stockData: Stock | null = stocks[symbol];
      
      if (!stockData) {
        stockData = await fetchStockData(symbol);
        if (!stockData) {
          toast.error(`Unable to get current price for ${symbol}`);
          return;
        }
      }
      
      // Use the current market price
      sellMutation.mutateAsync({ symbol, quantity, price: stockData.price });
    },
    [sellMutation, fetchStockData, stocks]
  );

  const getPositionValue = useCallback(
    (position: Position) => {
      const stockPrice = stocks[position.symbol]?.price || 0;
      return stockPrice * position.quantity;
    },
    [stocks]
  );

  const getPositionProfitLoss = useCallback(
    (position: Position) => {
      const stockPrice = stocks[position.symbol]?.price || 0;
      const currentValue = stockPrice * position.quantity;
      const costBasis = position.averageCost * position.quantity;
      
      const value = currentValue - costBasis;
      const percentage = costBasis > 0 ? (value / costBasis) * 100 : 0;
      
      return { value, percentage };
    },
    [stocks]
  );

  const getPortfolioValue = useCallback(() => {
    if (!portfolio) return 0;
    
    const positionsValue = portfolio.positions.reduce((total, position) => {
      return total + getPositionValue(position);
    }, 0);
    
    return positionsValue + portfolio.cashBalance;
  }, [portfolio, getPositionValue]);

  const getTotalProfitLoss = useCallback(() => {
    if (!portfolio) return { value: 0, percentage: 0 };
    
    const totalInvestment = portfolio.positions.reduce((total, position) => {
      return total + (position.averageCost * position.quantity);
    }, 0);
    
    const currentValue = portfolio.positions.reduce((total, position) => {
      return total + getPositionValue(position);
    }, 0);
    
    const profitLossValue = currentValue - totalInvestment;
    const profitLossPercentage = totalInvestment > 0 
      ? (profitLossValue / totalInvestment) * 100 
      : 0;
    
    return {
      value: profitLossValue,
      percentage: profitLossPercentage,
    };
  }, [portfolio, getPositionValue]);

  const getPositionAllocation = useCallback(
    (position: Position) => {
      const portfolioValue = getPortfolioValue();
      if (portfolioValue === 0) return 0;
      
      const positionValue = getPositionValue(position);
      return (positionValue / portfolioValue) * 100;
    },
    [getPortfolioValue, getPositionValue]
  );

  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        transactions,
        loading: portfolioLoading || transactionsLoading,
        buyStock,
        sellStock,
        getPortfolioValue,
        getTotalProfitLoss,
        getPositionValue,
        getPositionProfitLoss,
        getPositionAllocation,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

// File: frontend/src/components/dashboard/Dashboard.tsx
import React, { useState } from 'react';
import { useStocks } from '../../contexts/StockContext';
import { usePortfolio } from '../../contexts/PortfolioContext';
import PortfolioSummary from './PortfolioSummary';
import PositionsList from './PositionsList';
import WatchlistsPanel from './WatchlistsPanel';
import StockSearch from './StockSearch';
import TransactionHistory from './TransactionHistory';

export default function Dashboard() {
  const { loading: stocksLoading } = useStocks();
  const { loading: portfolioLoading, portfolio, getPortfolioValue, getTotalProfitLoss } = usePortfolio();
  const [activeTab, setActiveTab] = useState('portfolio');

  const loading = stocksLoading || portfolioLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const portfolioValue = getPortfolioValue();
  const { value: profitLoss, percentage: profitLossPercentage } = getTotalProfitLoss();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Paper Trading Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PortfolioSummary 
            cashBalance={portfolio?.cashBalance || 0}
            portfolioValue={portfolioValue}
            profitLoss={profitLoss}
            profitLossPercentage={profitLossPercentage}
          />
          
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex mb-4 border-b border-gray-200 dark:border-gray-700">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'portfolio'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('portfolio')}
              >
                Portfolio
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'watchlists'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('watchlists')}
              >
                Watchlists
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'transactions'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('transactions')}
              >
                Transactions
              </button>
            </div>
            
            {activeTab === 'portfolio' && (
              <PositionsList positions={portfolio?.positions || []} />
            )}
            
            {activeTab === 'watchlists' && (
              <WatchlistsPanel />
            )}
            
            {activeTab === 'transactions' && (
              <TransactionHistory />
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Search Stocks</h2>
            <StockSearch />
          </div>
        </div>
      </div>
    </div>
  );
}

// GO BACKEND IMPLEMENTATION
// File: backend/main.go

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/yourapp/config"
	"github.com/yourapp/controllers"
	"github.com/yourapp/middleware"
	"github.com/yourapp/repositories"
	"github.com/yourapp/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize dependencies
	appConfig := config.NewConfig()
	db := config.SetupDatabase(appConfig)
	
	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	portfolioRepo := repositories.NewPortfolioRepository(db)
	watchlistRepo := repositories.NewWatchlistRepository(db)
	transactionRepo := repositories.NewTransactionRepository(db)
	
	// Initialize services
	authService := services.NewAuthService(userRepo, portfolioRepo, appConfig)
	userService := services.NewUserService(userRepo)
	stockService := services.NewStockService(appConfig)
	portfolioService := services.NewPortfolioService(portfolioRepo, transactionRepo, stockService)
	watchlistService := services.NewWatchlistService(watchlistRepo)
	transactionService := services.NewTransactionService(transactionRepo, portfolioRepo, stockService)
	
	// Initialize controllers
	authController := controllers.NewAuthController(authService)
	userController := controllers.NewUserController(userService)
	stockController := controllers.NewStockController(stockService)
	portfolioController := controllers.NewPortfolioController(portfolioService)
	watchlistController := controllers.NewWatchlistController(watchlistService)
	transactionController := controllers.NewTransactionController(transactionService)
	
	// Setup router
	router := gin.Default()
	
	// Apply middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://yourdomain.com"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	
	// Rate limiting middleware
	router.Use(middleware.RateLimiter())
	
	// Add basic security headers
	router.Use(middleware.SecurityHeaders())
	
	// Setup routes
	api := router.Group("/api")
	
	// Auth routes
	auth := api.Group("/auth")
	{
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
		auth.POST("/demo", authController.DemoLogin)
		auth.POST("/refresh", authController.RefreshToken)
		auth.POST("/forgot-password", authController.ForgotPassword)
		auth.POST("/reset-password", authController.ResetPassword)
		auth.POST("/logout", middleware.AuthRequired(), authController.Logout)
	}
	
	// User routes
	users := api.Group("/users")
	users.Use(middleware.AuthRequired())
	{
		users.GET("/me", userController.GetCurrentUser)
		users.PUT("/me", userController.UpdateCurrentUser)
		users.PUT("/me/password", userController.UpdatePassword)
	}
	
	// Stock routes
	stocks := api.Group("/stocks")
	{
		stocks.GET("/search", stockController.SearchStocks)
		stocks.GET("/quote/:symbol", stockController.GetStockQuote)
		stocks.GET("/batch", stockController.GetBatchQuotes)
		
		// Protected routes
		stocksAuth := stocks.Group("/")
		stocksAuth.Use(middleware.AuthRequired())
		{
			stocksAuth.GET("/history/:symbol", stockController.GetHistoricalData)
		}
	}
	
	// Portfolio routes
	portfolio := api.Group("/portfolio")
	portfolio.Use(middleware.AuthRequired())
	{
		portfolio.GET("", portfolioController.GetPortfolio)
		portfolio.GET("/performance", portfolioController.GetPerformance)
		portfolio.GET("/allocation", portfolioController.GetAllocation)
	}
	
	// Watchlist routes
	watchlists := api.Group("/watchlists")
	watchlists.Use(middleware.AuthRequired())
	{
		watchlists.GET("", watchlistController.GetAllWatchlists)
		watchlists.POST("", watchlistController.CreateWatchlist)
		watchlists.GET("/:id", watchlistController.GetWatchlist)
		watchlists.PUT("/:id", watchlistController.UpdateWatchlist)
		watchlists.DELETE("/:id", watchlistController.DeleteWatchlist)
		
		// Watchlist stocks
		watchlists.POST("/:id/stocks", watchlistController.AddStockToWatchlist)
		watchlists.DELETE("/:id/stocks/:symbol", watchlistController.RemoveStockFromWatchlist)
	}
	
	// Transaction routes
	transactions := api.Group("/transactions")
	transactions.Use(middleware.AuthRequired())
	{
		transactions.GET("", transactionController.GetAllTransactions)
		transactions.POST("/buy", transactionController.BuyStock)
		transactions.POST("/sell", transactionController.SellStock)
	}
	
	// Start server with graceful shutdown
	srv := &http.Server{
		Addr:    ":" + appConfig.ServerPort,
		Handler: router,
	}
	
	// Graceful shutdown
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Listen: %s\n", err)
		}
	}()
	
	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}
	
	log.Println("Server exiting")
}

// File: backend/middleware/auth.go
package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/yourapp/config"
)

type JWTClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims := &JWTClaims{}

		// Parse the JWT token
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			// Validate the signing algorithm
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			
			// Return the secret key
			return []byte(config.GetConfig().JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user ID in context
		c.Set("userId", claims.UserID)
		c.Set("userEmail", claims.Email)
		
		c.Next()
	}
}

// File: backend/controllers/transaction_controller.go
package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourapp/models"
	"github.com/yourapp/services"
)

type TransactionController struct {
	transactionService *services.TransactionService
}

func NewTransactionController(transactionService *services.TransactionService) *TransactionController {
	return &TransactionController{
		transactionService: transactionService,
	}
}

func (tc *TransactionController) GetAllTransactions(c *gin.Context) {
	userId := c.GetString("userId")
	
	transactions, err := tc.transactionService.GetUserTransactions(userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, transactions)
}

func (tc *TransactionController) BuyStock(c *gin.Context) {
	userId := c.GetString("userId")
	
	var request models.TransactionRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validate request
	if request.Symbol == "" || request.Quantity <= 0 || request.Price <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction parameters"})
		return
	}
	
	result, err := tc.transactionService.BuyStock(userId, request.Symbol, request.Quantity, request.Price)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, result)
}

func (tc *TransactionController) SellStock(c *gin.Context) {
	userId := c.GetString("userId")
	
	var request models.TransactionRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validate request
	if request.Symbol == "" || request.Quantity <= 0 || request.Price <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction parameters"})
		return
	}
	
	result, err := tc.transactionService.SellStock(userId, request.Symbol, request.Quantity, request.Price)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, result)
}

// File: backend/models/transaction.go
package models

import (
	"time"
)

type Transaction struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	UserID    string    `json:"userId" gorm:"index"`
	Symbol    string    `json:"symbol"`
	Quantity  float64   `json:"quantity"`
	Price     float64   `json:"price"`
	Type      string    `json:"type"` // BUY or SELL
	Timestamp time.Time `json:"timestamp"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type TransactionRequest struct {
	Symbol   string  `json:"symbol"`
	Quantity float64 `json:"quantity"`
	Price    float64 `json:"price"`
}

type TransactionResponse struct {
	Transaction    Transaction `json:"transaction"`
	UpdatedBalance float64     `json:"updatedBalance"`
	Position       Position    `json:"position,omitempty"`
	RemainingQuantity float64  `json:"remainingQuantity,omitempty"`
}

// File: backend/services/stock_service.go
package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/yourapp/config"
	"github.com/yourapp/models"
)

type StockService struct {
	config *config.Config
	cache  map[string]*cachedStock
}

type cachedStock struct {
	stock      models.Stock
	expiration time.Time
}

func NewStockService(config *config.Config) *StockService {
	return &StockService{
		config: config,
		cache:  make(map[string]*cachedStock),
	}
}

func (s *StockService) SearchStocks(query string) ([]models.Stock, error) {
	// API endpoint for your stock market data provider
	apiURL := fmt.Sprintf("%s/search?q=%s&token=%s", 
		s.config.StockAPIBaseURL, 
		query,
		s.config.StockAPIKey)

	response, err := http.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	var searchResult struct {
		Results []models.Stock `json:"results"`
	}
	
	if err := json.Unmarshal(body, &searchResult); err != nil {
		return nil, err
	}

	return searchResult.Results, nil
}

func (s *StockService) GetStockQuote(symbol string) (*models.Stock, error) {
	// Check cache first
	if cached, exists := s.cache[symbol]; exists && time.Now().Before(cached.expiration) {
		return &cached.stock, nil
	}

	// API endpoint for your stock market data provider
	apiURL := fmt.Sprintf("%s/quote/%s?token=%s", 
		s.config.StockAPIBaseURL, 
		symbol,
		s.config.StockAPIKey)

	response, err := http.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	var stock models.Stock
	if err := json.Unmarshal(body, &stock); err != nil {
		return nil, err
	}

	// Update cache with 60-second expiration
	s.cache[symbol] = &cachedStock{
		stock:      stock,
		expiration: time.Now().Add(60 * time.Second),
	}

	return &stock, nil
}

func (s *StockService) GetBatchQuotes(symbols []string) (map[string]models.Stock, error) {
	// API endpoint for your stock market data provider
	symbolsStr := strings.Join(symbols, ",")
	apiURL := fmt.Sprintf("%s/quote/batch?symbols=%s&token=%s", 
		s.config.StockAPIBaseURL, 
		symbolsStr,
		s.config.StockAPIKey)

	response, err := http.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]models.Stock
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	// Update cache
	now := time.Now()
	expiration := now.Add(60 * time.Second)
	for symbol, stock := range result {
		s.cache[symbol] = &cachedStock{
			stock:      stock,
			expiration: expiration,
		}
	}

	return result, nil
}

func (s *StockService) GetHistoricalData(symbol string, period string) ([]models.HistoricalData, error) {
	// API endpoint for your stock market data provider
	apiURL := fmt.Sprintf("%s/history/%s?period=%s&token=%s", 
		s.config.StockAPIBaseURL, 
		symbol,
		period,
		s.config.StockAPIKey)

	response, err := http.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Data []models.HistoricalData `json:"data"`
	}
	
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return result.Data, nil
}

// MOCK DATA IMPLEMENTATION
// File: backend/services/mock_data_service.go
package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math/rand"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/yourapp/models"
)

type MockDataService struct {
	stocks      []models.Stock
	users       []models.User
	portfolios  []models.Portfolio
	positions   []models.Position
	transactions []models.Transaction
	watchlists  []models.Watchlist
}

func NewMockDataService() *MockDataService {
	service := &MockDataService{}
	
	// Seed random number generator
	rand.Seed(time.Now().UnixNano())
	
	// Load mock data
	service.loadMockData()
	
	return service
}

func (s *MockDataService) loadMockData() {
	// Load stocks data
	stocksData, err := ioutil.ReadFile(filepath.Join("data", "stocks.json"))
	if err == nil {
		json.Unmarshal(stocksData, &s.stocks)
	} else {
		// Generate some default stocks if file doesn't exist
		s.generateDefaultStocks()
	}
	
	// Load users data
	usersData, err := ioutil.ReadFile(filepath.Join("data", "users.json"))
	if err == nil {
		json.Unmarshal(usersData, &s.users)
	} else {
		// Generate some default users if file doesn't exist
		s.generateDefaultUsers()
	}
	
	// Load portfolios data
	portfoliosData, err := ioutil.ReadFile(filepath.Join("data", "portfolios.json"))
	if err == nil {
		json.Unmarshal(portfoliosData, &s.portfolios)
	} else {
		// Generate some default portfolios if file doesn't exist
		s.generateDefaultPortfolios()
	}
	
	// Load positions data
	positionsData, err := ioutil.ReadFile(filepath.Join("data", "positions.json"))
	if err == nil {
		json.Unmarshal(positionsData, &s.positions)
	} else {
		// Generate some default positions if file doesn't exist
		s.generateDefaultPositions()
	}
	
	// Load transactions data
	transactionsData, err := ioutil.ReadFile(filepath.Join("data", "transactions.json"))
	if err == nil {
		json.Unmarshal(transactionsData, &s.transactions)
	} else {
		// Generate some default transactions if file doesn't exist
		s.generateDefaultTransactions()
	}
	
	// Load watchlists data
	watchlistsData, err := ioutil.ReadFile(filepath.Join("data", "watchlists.json"))
	if err == nil {
		json.Unmarshal(watchlistsData, &s.watchlists)
	} else {
		// Generate some default watchlists if file doesn't exist
		s.generateDefaultWatchlists()
	}
}

func (s *MockDataService) generateDefaultStocks() {
	// S&P 500 top companies
	topCompanies := []struct {
		Symbol string
		Name   string
		Sector string
	}{
		{"AAPL", "Apple Inc.", "Technology"},
		{"MSFT", "Microsoft Corporation", "Technology"},
		{"AMZN", "Amazon.com Inc.", "Consumer Cyclical"},
		{"NVDA", "NVIDIA Corporation", "Technology"},
		{"GOOGL", "Alphabet Inc.", "Communication Services"},
		{"GOOG", "Alphabet Inc.", "Communication Services"},
		{"META", "Meta Platforms Inc.", "Communication Services"},
		{"BRK.B", "Berkshire Hathaway Inc.", "Financial Services"},
		{"TSLA", "Tesla Inc.", "Consumer Cyclical"},
		{"UNH", "UnitedHealth Group Incorporated", "Healthcare"},
		{"XOM", "Exxon Mobil Corporation", "Energy"},
		{"JNJ", "Johnson & Johnson", "Healthcare"},
		{"JPM", "JPMorgan Chase & Co.", "Financial Services"},
		{"V", "Visa Inc.", "Financial Services"},
		{"PG", "Procter & Gamble Company", "Consumer Defensive"},
		{"MA", "Mastercard Incorporated", "Financial Services"},
		{"AVGO", "Broadcom Inc.", "Technology"},
		{"CVX", "Chevron Corporation", "Energy"},
		{"HD", "Home Depot Inc.", "Consumer Cyclical"},
		{"MRK", "Merck & Co. Inc.", "Healthcare"},
	}
	
	for _, company := range topCompanies {
		// Generate random price between $50 and $500
		price := 50.0 + rand.Float64()*450.0
		
		// Generate random change between -5% and +5%
		changePercent := -5.0 + rand.Float64()*10.0
		change := price * (changePercent / 100.0)
		
		stock := models.Stock{
			Symbol:       company.Symbol,
			Name:         company.Name,
			Price:        price,
			Change:       change,
			ChangePercent: changePercent,
			Volume:       float64(rand.Intn(10000000) + 1000000),
			MarketCap:    float64(rand.Intn(2000) + 100) * 1000000000.0,
			PERatio:      float64(rand.Intn(40) + 10),
			Dividend:     rand.Float64() * 3.0,
			Sector:       company.Sector,
			PreviousClose: price - change,
			Open:         price - change + (rand.Float64() * change / 2.0),
			DayHigh:      price + (rand.Float64() * price * 0.02),
			DayLow:       price - (rand.Float64() * price * 0.02),
			YearHigh:     price * (1 + rand.Float64()*0.2),
			YearLow:      price * (1 - rand.Float64()*0.2),
		}
		
		s.stocks = append(s.stocks, stock)
	}
	
	// Save to file
	stocksData, _ := json.MarshalIndent(s.stocks, "", "  ")
	os.MkdirAll("data", os.ModePerm)
	ioutil.WriteFile(filepath.Join("data", "stocks.json"), stocksData, 0644)
}

func (s *MockDataService) generateDefaultUsers() {
	// Create a demo user
	demoUser := models.User{
		ID:        uuid.New().String(),
		Name:      "Demo User",
		Email:     "demo@papertrader.app",
		Password:  "$2a$10$demopasswordhashgoeshere", // This would be properly hashed in real implementation
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	s.users = append(s.users, demoUser)
	
	// Save to file
	usersData, _ := json.MarshalIndent(s.users, "", "  ")
	os.MkdirAll("data", os.ModePerm)
	ioutil.WriteFile(filepath.Join("data", "users.json"), usersData, 0644)
}

func (s *MockDataService) generateDefaultPortfolios() {
	// Create a portfolio for each user
	for _, user := range s.users {
		portfolio := models.Portfolio{
			ID:          uuid.New().String(),
			UserID:      user.ID,
			Name:        "My Portfolio",
			CashBalance: 10000.0, // Start with $10,000
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		
		s.portfolios = append(s.portfolios, portfolio)
	}
	
	// Save to file
	portfoliosData, _ := json.MarshalIndent(s.portfolios, "", "  ")
	os.MkdirAll("data", os.ModePerm)
	ioutil.WriteFile(filepath.Join("data", "portfolios.json"), portfoliosData, 0644)
}

func (s *MockDataService) generateDefaultPositions() {
	// Create positions for each portfolio
	for _, portfolio := range s.portfolios {
		// Get 3-5 random stocks
		numStocks := rand.Intn(3) + 3
		
		// Shuffle stocks
		shuffledStocks := make([]models.Stock, len(s.stocks))
		copy(shuffledStocks, s.stocks)
		rand.Shuffle(len(shuffledStocks), func(i, j int) {
			shuffledStocks[i], shuffledStocks[j] = shuffledStocks[j], shuffledStocks[i]
		})
		
		// Take the first numStocks
		for i := 0; i < numStocks && i < len(shuffledStocks); i++ {
			stock := shuffledStocks[i]
			
			// Random quantity between 1 and 20
			quantity := float64(rand.Intn(20) + 1)
			
			// Average cost slightly different from current price
			priceDiff := stock.Price * (rand.Float64()*0.1 - 0.05) // +/- 5%
			averageCost := stock.Price + priceDiff
			
			position := models.Position{
				ID:          uuid.New().String(),
				PortfolioID: portfolio.ID,
				Symbol:      stock.Symbol,
				Quantity:    quantity,
				AverageCost: averageCost,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}
			
			s.positions = append(s.positions, position)
		}
	}
	
	// Save to file
	positionsData, _ := json.MarshalIndent(s.positions, "", "  ")
	os.MkdirAll("data", os.ModePerm)
	ioutil.WriteFile(filepath.Join("data", "positions.json"), positionsData, 0644)
}

func (s *MockDataService) generateDefaultTransactions() {
	// Create transactions for each position
	for _, position := range s.positions {
		// Find associated portfolio
		var portfolio models.Portfolio
		for _, p := range s.portfolios {
			if p.ID == position.PortfolioID {
				portfolio = p
				break
			}
		}
		
		// Create a BUY transaction for this position
		transaction := models.Transaction{
			ID:        uuid.New().String(),
			UserID:    portfolio.UserID,
			Symbol:    position.Symbol,
			Quantity:  position.Quantity,
			Price:     position.AverageCost,
			Type:      "BUY",
			Timestamp: time.Now().Add(-time.Duration(rand.Intn(30)) * 24 * time.Hour), // Random time in the last 30 days
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		
		s.transactions = append(s.transactions, transaction)
		
		// 30% chance of having a second transaction for this position
		if rand.Float64() < 0.3 {
			// Find stock to get current price
			var stockPrice float64
			for _, stock := range s.stocks {
				if stock.Symbol == position.Symbol {
					stockPrice = stock.Price
					break
				}
			}
			
			// Random quantity up to 50% of current position
			quantity := position.Quantity * (rand.Float64() * 0.5)
			
			// If it's a BUY, the transaction happened in the past
			// If it's a SELL, the transaction is more recent
			transactionType := "BUY"
			if rand.Float64() < 0.5 {
				transactionType = "SELL"
			}
			
			secondTransaction := models.Transaction{
				ID:        uuid.New().String(),
				UserID:    portfolio.UserID,
				Symbol:    position.Symbol,
				Quantity:  quantity,
				Price:     stockPrice + (rand.Float64()*stockPrice*0.05 - stockPrice*0.025), // +/- 2.5% from current price
				Type:      transactionType,
				Timestamp: time.Now().Add(-time.Duration(rand.Intn(15)) * 24 * time.Hour), // Random time in the last 15 days
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			
			s.transactions = append(s.transactions, secondTransaction)
		}
	}
	
	// Save to file
	transactionsData, _ := json.MarshalIndent(s.transactions, "", "  ")
	os.MkdirAll("data", os.ModePerm)
	ioutil.WriteFile(filepath.Join("data", "transactions.json"), transactionsData, 0644)
}

func (s *MockDataService) generateDefaultWatchlists() {
	// Create watchlists for each user
	for _, user := range s.users {
		// Create "My Watchlist"
		watchlist := models.Watchlist{
			ID:        uuid.New().String(),
			UserID:    user.ID,
			Name:      "My Watchlist",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Stocks:    []models.WatchlistItem{},
		}
		
		// Add 5-8 random stocks
		numStocks := rand.Intn(4) + 5
		
		// Shuffle stocks
		shuffledStocks := make([]models.Stock, len(s.stocks))
		copy(shuffledStocks, s.stocks)
		rand.Shuffle(len(shuffledStocks), func(i, j int) {
			shuffledStocks[i], shuffledStocks[j] = shuffledStocks[j], shuffledStocks[i]
		})
		
		// Take the first numStocks
		for i := 0; i < numStocks && i < len(shuffledStocks); i++ {
			watchlistItem := models.WatchlistItem{
				ID:          uuid.New().String(),
				WatchlistID: watchlist.ID,
				Symbol:      shuffledStocks[i].Symbol,
				CreatedAt:   time.Now(),
			}
			
			watchlist.Stocks = append(watchlist.Stocks, watchlistItem)
		}
		
		s.watchlists = append(s.watchlists, watchlist)
		
		// 50% chance to create a second watchlist
		if rand.Float64() < 0.5 {
			sector := ""
			for _, stock := range s.stocks {
				if stock.Sector != "" {
					sector = stock.Sector
					break
				}
			}
			
			if sector == "" {
				sector = "Technology"
			}
			
			watchlist2 := models.Watchlist{
				ID:        uuid.New().String(),
				UserID:    user.ID,
				Name:      fmt.Sprintf("%s Stocks", sector),
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
				Stocks:    []models.WatchlistItem{},
			}
			
			// Add stocks from this sector
			for _, stock := range s.stocks {
				if stock.Sector == sector {
					watchlistItem := models.WatchlistItem{
						ID:          uuid.New().String(),
						WatchlistID: watchlist2.ID,
						Symbol:      stock.Symbol,
						CreatedAt:   time.Now(),
					}
					
					watchlist2.Stocks = append(watchlist2.Stocks, watchlistItem)
				}
			}
			
			s.watchlists = append(s.watchlists, watchlist2)
		}
	}
	
	// Save to file
	watch
