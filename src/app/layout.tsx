// File: src/app/layout.tsx
import { Inter } from 'next/font/google';
import { Providers } from '@/providers/providers';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Paper Trader - Virtual Stock Trading',
  description: 'Practice stock trading with virtual money in a realistic environment',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}

// File: src/app/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import LandingPage from '@/components/landing/LandingPage';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard');
  }
  
  return <LandingPage />;
}

// File: src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Dashboard from '@/components/dashboard/Dashboard';
import { getPortfolioData } from '@/lib/portfolio';
import { getWatchlists } from '@/lib/watchlist';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  const portfolio = await getPortfolioData(session.user.id);
  const watchlists = await getWatchlists(session.user.id);
  
  return <Dashboard initialPortfolio={portfolio} initialWatchlists={watchlists} />;
}

// File: src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Handle demo account login
        if (credentials.email === 'demo@papertrader.app' && 
            credentials.password === 'demo1234') {
          const demoUser = await prisma.user.findUnique({
            where: { email: 'demo@papertrader.app' },
          });
          
          if (!demoUser) {
            // Create demo user if it doesn't exist
            return await prisma.user.create({
              data: {
                email: 'demo@papertrader.app',
                name: 'Demo User',
                // Initial portfolio setup would be handled elsewhere
              }
            });
          }
          
          return demoUser;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          return null;
        }

        return user;
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
};

// File: src/providers/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StockProvider } from '@/context/StockContext';
import { PortfolioProvider } from '@/context/PortfolioContext';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <StockProvider>
            <PortfolioProvider>
              {children}
            </PortfolioProvider>
          </StockProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

// File: src/context/StockContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  // Add other stock properties
};

type WatchlistItem = {
  id: string;
  symbol: string;
};

type Watchlist = {
  id: string;
  name: string;
  stocks: WatchlistItem[];
};

interface StockContextType {
  stocks: Record<string, Stock>;
  watchlists: Watchlist[];
  loading: boolean;
  addToWatchlist: (watchlistId: string, symbol: string) => Promise<void>;
  removeFromWatchlist: (watchlistId: string, symbol: string) => Promise<void>;
  createWatchlist: (name: string) => Promise<void>;
  deleteWatchlist: (id: string) => Promise<void>;
  fetchStockPrice: (symbol: string) => Promise<Stock | null>;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [stocks, setStocks] = useState<Record<string, Stock>>({});
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);

  // Fetch watchlists
  const { data: watchlistData, isLoading: watchlistsLoading } = useQuery({
    queryKey: ['watchlists'],
    queryFn: async () => {
      const response = await fetch('/api/watchlists');
      if (!response.ok) throw new Error('Failed to fetch watchlists');
      return response.json();
    },
  });

  useEffect(() => {
    if (watchlistData) {
      setWatchlists(watchlistData);
    }
  }, [watchlistData]);

  // Fetch stock data for all watched stocks
  useEffect(() => {
    const symbols = new Set<string>();
    watchlists.forEach(watchlist => {
      watchlist.stocks.forEach(stock => {
        symbols.add(stock.symbol);
      });
    });

    if (symbols.size === 0) return;

    const fetchPrices = async () => {
      const symbolsArray = Array.from(symbols);
      try {
        const response = await fetch(`/api/stocks/prices?symbols=${symbolsArray.join(',')}`);
        if (response.ok) {
          const data = await response.json();
          setStocks(prevStocks => ({ ...prevStocks, ...data }));
        }
      } catch (error) {
        console.error('Failed to fetch stock prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [watchlists]);

  const fetchStockPrice = useCallback(async (symbol: string): Promise<Stock | null> => {
    try {
      const response = await fetch(`/api/stocks/price?symbol=${symbol}`);
      if (!response.ok) throw new Error('Failed to fetch stock price');
      const data = await response.json();
      
      // Update the stocks state
      setStocks(prev => ({ ...prev, [symbol]: data }));
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      return null;
    }
  }, []);

  const addToWatchlist = useCallback(async (watchlistId: string, symbol: string) => {
    try {
      const response = await fetch('/api/watchlists/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlistId, symbol }),
      });
      
      if (!response.ok) throw new Error('Failed to add stock to watchlist');
      
      // Update local state
      setWatchlists(prev => 
        prev.map(watchlist => 
          watchlist.id === watchlistId
            ? {
                ...watchlist,
                stocks: [...watchlist.stocks, { id: `${watchlistId}-${symbol}`, symbol }]
              }
            : watchlist
        )
      );

      // Fetch stock data if not already cached
      if (!stocks[symbol]) {
        await fetchStockPrice(symbol);
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  }, [stocks, fetchStockPrice]);

  const removeFromWatchlist = useCallback(async (watchlistId: string, symbol: string) => {
    try {
      const response = await fetch('/api/watchlists/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlistId, symbol }),
      });
      
      if (!response.ok) throw new Error('Failed to remove stock from watchlist');
      
      // Update local state
      setWatchlists(prev => 
        prev.map(watchlist => 
          watchlist.id === watchlistId
            ? {
                ...watchlist,
                stocks: watchlist.stocks.filter(s => s.symbol !== symbol)
              }
            : watchlist
        )
      );
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  }, []);

  const createWatchlist = useCallback(async (name: string) => {
    try {
      const response = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) throw new Error('Failed to create watchlist');
      
      const newWatchlist = await response.json();
      setWatchlists(prev => [...prev, newWatchlist]);
    } catch (error) {
      console.error('Failed to create watchlist:', error);
    }
  }, []);

  const deleteWatchlist = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/watchlists/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete watchlist');
      
      setWatchlists(prev => prev.filter(watchlist => watchlist.id !== id));
    } catch (error) {
      console.error('Failed to delete watchlist:', error);
    }
  }, []);

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
        fetchStockPrice,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export const useStocks = () => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStocks must be used within a StockProvider');
  }
  return context;
};

// File: src/context/PortfolioContext.tsx
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useStocks } from './StockContext';

type Position = {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
};

type Transaction = {
  id: string;
  symbol: string;
  quantity: number;
  price: number;
  type: 'BUY' | 'SELL';
  timestamp: string;
};

type Portfolio = {
  id: string;
  name: string;
  cashBalance: number;
  positions: Position[];
};

interface PortfolioContextType {
  portfolio: Portfolio | null;
  transactions: Transaction[];
  loading: boolean;
  buyStock: (symbol: string, quantity: number, price: number) => Promise<void>;
  sellStock: (symbol: string, quantity: number, price: number) => Promise<void>;
  getPortfolioValue: () => number;
  getTotalProfitLoss: () => { value: number; percentage: number };
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { stocks, fetchStockPrice } = useStocks();
  const queryClient = useQueryClient();

  // Fetch portfolio data
  const { isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio');
      if (!response.ok) throw new Error('Failed to fetch portfolio');
      const data = await response.json();
      setPortfolio(data);
      return data;
    },
  });

  // Fetch transaction history
  const { isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
      return data;
    },
  });

  // Buy stock mutation
  const buyMutation = useMutation({
    mutationFn: async ({ symbol, quantity, price }: { symbol: string; quantity: number; price: number }) => {
      const response = await fetch('/api/transactions/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, quantity, price }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to buy stock');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update portfolio with new position
      setPortfolio(prev => {
        if (!prev) return prev;
        
        const existingPosition = prev.positions.find(p => p.symbol === data.transaction.symbol);
        
        let updatedPositions;
        if (existingPosition) {
          // Update existing position
          updatedPositions = prev.positions.map(p => 
            p.symbol === data.transaction.symbol
              ? {
                  ...p,
                  quantity: p.quantity + data.transaction.quantity,
                  averageCost: data.position.averageCost,
                }
              : p
          );
        } else {
          // Add new position
          updatedPositions = [
            ...prev.positions,
            {
              id: data.position.id,
              symbol: data.transaction.symbol,
              quantity: data.transaction.quantity,
              averageCost: data.transaction.price,
            }
          ];
        }
        
        return {
          ...prev,
          cashBalance: data.updatedBalance,
          positions: updatedPositions,
        };
      });
      
      // Add new transaction to history
      setTransactions(prev => [data.transaction, ...prev]);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      toast.success(`Bought ${data.transaction.quantity} shares of ${data.transaction.symbol}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to buy stock');
    },
  });

  // Sell stock mutation
  const sellMutation = useMutation({
    mutationFn: async ({ symbol, quantity, price }: { symbol: string; quantity: number; price: number }) => {
      const response = await fetch('/api/transactions/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, quantity, price }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sell stock');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update portfolio with adjusted position
      setPortfolio(prev => {
        if (!prev) return prev;
        
        let updatedPositions;
        if (data.remainingQuantity === 0) {
          // Remove position if fully sold
          updatedPositions = prev.positions.filter(p => p.symbol !== data.transaction.symbol);
        } else {
          // Update position quantity
          updatedPositions = prev.positions.map(p => 
            p.symbol === data.transaction.symbol
              ? { ...p, quantity: data.remainingQuantity }
              : p
          );
        }
        
        return {
          ...prev,
          cashBalance: data.updatedBalance,
          positions: updatedPositions,
        };
      });
      
      // Add new transaction to history
      setTransactions(prev => [data.transaction, ...prev]);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      toast.success(`Sold ${data.transaction.quantity} shares of ${data.transaction.symbol}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sell stock');
    },
  });

  const buyStock = useCallback(async (symbol: string, quantity: number, price: number) => {
    // Ensure we have the latest price
    const stockData = await fetchStockPrice(symbol);
    if (!stockData) {
      toast.error(`Unable to get current price for ${symbol}`);
      return;
    }
    
    // Use the current market price
    buyMutation.mutate({ symbol, quantity, price: stockData.price });
  }, [buyMutation, fetchStockPrice]);

  const sellStock = useCallback(async (symbol: string, quantity: number, price: number) => {
    // Ensure we have the latest price
    const stockData = await fetchStockPrice(symbol);
    if (!stockData) {
      toast.error(`Unable to get current price for ${symbol}`);
      return;
    }
    
    // Use the current market price
    sellMutation.mutate({ symbol, quantity, price: stockData.price });
  }, [sellMutation, fetchStockPrice]);

  const getPortfolioValue = useCallback(() => {
    if (!portfolio) return 0;
    
    const positionsValue = portfolio.positions.reduce((total, position) => {
      const stockPrice = stocks[position.symbol]?.price || 0;
      return total + (stockPrice * position.quantity);
    }, 0);
    
    return positionsValue + portfolio.cashBalance;
  }, [portfolio, stocks]);

  const getTotalProfitLoss = useCallback(() => {
    if (!portfolio) return { value: 0, percentage: 0 };
    
    const totalInvestment = portfolio.positions.reduce((total, position) => {
      return total + (position.averageCost * position.quantity);
    }, 0);
    
    const currentValue = portfolio.positions.reduce((total, position) => {
      const stockPrice = stocks[position.symbol]?.price || 0;
      return total + (stockPrice * position.quantity);
    }, 0);
    
    const profitLossValue = currentValue - totalInvestment;
    const profitLossPercentage = totalInvestment > 0 
      ? (profitLossValue / totalInvestment) * 100 
      : 0;
    
    return {
      value: profitLossValue,
      percentage: profitLossPercentage,
    };
  }, [portfolio, stocks]);

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
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

// File: src/components/dashboard/Dashboard.tsx
'use client';

import { useState } from 'react';
import { useStocks } from '@/context/StockContext';
import { usePortfolio } from '@/context/PortfolioContext';
import PortfolioSummary from './PortfolioSummary';
import PositionsList from './PositionsList';
import WatchlistsPanel from './WatchlistsPanel';
import StockSearch from './StockSearch';
import TransactionHistory from './TransactionHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardProps {
  initialPortfolio: any;
  initialWatchlists: any;
}

export default function Dashboard({ initialPortfolio, initialWatchlists }: DashboardProps) {
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="watchlists">Watchlists</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="portfolio">
                <PositionsList positions={portfolio?.positions || []} />
              </TabsContent>
              
              <TabsContent value="watchlists">
                <WatchlistsPanel />
              </TabsContent>
              
              <TabsContent value="transactions">
                <TransactionHistory />
              </TabsContent>
            </Tabs>
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

// File: src/components/dashboard/StockSearch.tsx
'use client';

import { useState } from 'react';
import { useStocks } from '@/context/StockContext';
import { usePortfolio } from '@/context/PortfolioContext';
import StockCard from './StockCard';
import TradingPanel from './TradingPanel';

export default function StockSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const { stocks, fetchStockPrice } = useStocks();
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/stocks/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data);
      
      // Prefetch prices for search results
      data.forEach((result: any) => {
        fetchStockPrice(result.symbol);
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol === selectedStock ? null : symbol);
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by symbol or company name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-block animate-spin h-4 w-4 border-t-2 border-white rounded-full"></span>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {searchResults.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Search Results</h3>
          <div className="space-y-3">
            {searchResults.map((result) => (
              <StockCard
                key={result.symbol}
                symbol={result.symbol}
                name={result.name}
                price={stocks[result.symbol]?.price || 0}
                change={stocks[result.symbol]?.change || 0}
                changePercent={stocks[result.symbol]?.changePercent || 0}
                onClick={() => handleStockSelect(result.symbol)}
                isSelected={selectedStock === result.symbol}
              />
            ))}
          </div>
        </div>
      )}

      {selectedStock && (
        <div className="mt-4">
          <TradingPanel 
            symbol={selectedStock} 
            price={stocks[selectedStock]?.price || 0} 
          />
        </div>
      )}
    </div>
  );
}

// File: src/components/dashboard/TradingPanel.tsx
'use client';

import { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';

interface TradingPanelProps {
  symbol: string;
  price: number;
}

export default function TradingPanel({ symbol, price }: TradingPanelProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const { portfolio, buyStock, sellStock } = usePortfolio();
  
  // Find if user already has a position in this stock
  const existingPosition = portfolio?.positions.find(p => p.symbol === symbol);
  const maxSellQuantity = existingPosition?.quantity || 0;
  
  const totalCost = price * quantity;
  const canAfford = (portfolio?.cashBalance || 0) >= totalCost;
  const canSell = existingPosition && quantity <= maxSellQuantity;
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (action === 'BUY') {
      if (!canAfford) return;
      await buyStock(symbol, quantity, price);
    } else {
      if (!canSell) return;
      await sellStock(symbol, quantity, price);
    }
  };
  
  return (
    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Trade {symbol}</h3>
      
      <div className="flex space-x-2 mb-4">
        <button
          className={`flex-1 py-2 rounded-md ${
            action === 'BUY'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setAction('BUY')}
        >
          Buy
        </button>
        <button
          className={`flex-1 py-2 rounded-md ${
            action === 'SELL'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setAction('SELL')}
          disabled={!existingPosition}
        >
          Sell
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">
            Current Price
          </label>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-300 dark:border-gray-600">
            ${price.toFixed(2)}
          </div>
        </div>
        
        <div className="mb-3">
          <label htmlFor="quantity" className="block text-sm font-medium mb-1">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            max={action === 'SELL' ? maxSellQuantity : undefined}
            value={quantity}
            onChange={handleQuantityChange}
            className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
          {action === 'SELL' && existingPosition && (
            <p className="text-xs mt-1">
              You currently own {existingPosition.quantity} shares
            </p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Total {action === 'BUY' ? 'Cost' : 'Value'}
          </label>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-300 dark:border-gray-600 font-semibold">
            ${totalCost.toFixed(2)}
          </div>
          {action === 'BUY' && (
            <p className="text-xs mt-1">
              Cash balance: ${portfolio?.cashBalance.toFixed(2)}
            </p>
          )}
        </div>
        
        <button
          type="submit"
          className={`w-full py-2 rounded-md ${
            action === 'BUY'
              ? canAfford
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-400 cursor-not-allowed'
              : canSell
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-400 cursor-not-allowed'
          } text-white font-medium`}
          disabled={action === 'BUY' ? !canAfford : !canSell}
        >
          {action === 'BUY' ? 'Buy' : 'Sell'} {quantity} {symbol}
        </button>
      </form>
    </div>
  );
}

// File: prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(cuid())
  name           String?
  email          String?   @unique
  emailVerified  DateTime?
  image          String?
  hashedPassword String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  accounts       Account[]
  sessions       Session[]
  portfolio      Portfolio?
  watchlists     Watchlist[]
  transactions   Transaction[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Portfolio {
  id           String     @id @default(cuid())
  userId       String     @unique
  name         String     @default("My Portfolio")
  cashBalance  Float      @default(10000)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  positions    Position[]
}

model Position {
  id           String    @id @default(cuid())
  portfolioId  String
  symbol       String
  quantity     Float
  averageCost  Float
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  portfolio    Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@unique([portfolioId, symbol])
}

model Transaction {
  id          String   @id @default(cuid())
  userId      String
  symbol      String
  quantity    Float
  price       Float
  type        String   // BUY or SELL
  timestamp   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Watchlist {
  id          String         @id @default(cuid())
  userId      String
  name        String
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  stocks      WatchlistItem[]

  @@unique([userId, name])
}

model WatchlistItem {
  id          String    @id @default(cuid())
  watchlistId String
  symbol      String
  createdAt   DateTime  @default(now())
  
  watchlist   Watchlist @relation(fields: [watchlistId], references: [id], onDelete: Cascade)

  @@unique([watchlistId, symbol])
}
