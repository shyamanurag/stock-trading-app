'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  BarChart3, 
  ChevronDown, 
  Download, 
  PieChart, 
  RefreshCw, 
  Search,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  X
} from 'lucide-react';
import Link from 'next/link';
import { tradingApiService } from '@/services/trading-api.service';
import webSocketService from '@/services/websocket.service';

// Mock data for portfolio
const mockPortfolioData = {
  id: "portfolio_1",
  userId: "user_01234",
  totalValue: 578930.50,
  totalInvestment: 523450.75,
  totalPL: 55479.75,
  totalPLPercent: 10.60,
  dayPL: 2345.75,
  dayPLPercent: 0.41,
  lastUpdateTime: new Date().toISOString(),
  holdings: [
    {
      id: "holding_1",
      portfolioId: "portfolio_1",
      symbol: "TCS",
      exchange: "NSE",
      quantity: 25,
      avgPrice: 3450.75,
      currentPrice: 3560.50,
      value: 89012.50,
      investment: 86268.75,
      pl: 2743.75,
      plPercent: 3.18,
      dayChange: 125.25,
      dayChangePercent: 0.52,
      product: "CNC",
      lastUpdateTime: new Date().toISOString()
    },
    {
      id: "holding_2",
      portfolioId: "portfolio_1",
      symbol: "RELIANCE",
      exchange: "NSE",
      quantity: 40,
      avgPrice: 2345.50,
      currentPrice: 2456.75,
      value: 98270.00,
      investment: 93820.00,
      pl: 4450.00,
      plPercent: 4.74,
      dayChange: 460.00,
      dayChangePercent: 0.47,
      product: "CNC",
      lastUpdateTime: new Date().toISOString()
    },
    {
      id: "holding_3",
      portfolioId: "portfolio_1",
      symbol: "INFY",
      exchange: "NSE",
      quantity: 60,
      avgPrice: 1520.25,
      currentPrice: 1452.35,
      value: 87141.00,
      investment: 91215.00,
      pl: -4074.00,
      plPercent: -4.47,
      dayChange: -765.00,
      dayChangePercent: -0.87,
      product: "CNC",
      lastUpdateTime: new Date().toISOString()
    },
    {
      id: "holding_4",
      portfolioId: "portfolio_1",
      symbol: "HDFC",
      exchange: "NSE",
      quantity: 15,
      avgPrice: 2580.60,
      currentPrice: 2745.25,
      value: 41178.75,
      investment: 38709.00,
      pl: 2469.75,
      plPercent: 6.38,
      dayChange: 292.50,
      dayChangePercent: 0.71,
      product: "CNC",
      lastUpdateTime: new Date().toISOString()
    },
    {
      id: "holding_5",
      portfolioId: "portfolio_1",
      symbol: "WIPRO",
      exchange: "NSE",
      quantity: 100,
      avgPrice: 450.20,
      currentPrice: 432.75,
      value: 43275.00,
      investment: 45020.00,
      pl: -1745.00,
      plPercent: -3.88,
      dayChange: -325.00,
      dayChangePercent: -0.74,
      product: "CNC",
      lastUpdateTime: new Date().toISOString()
    }
  ]
};

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>(mockPortfolioData);
  const [isLoading, setIsLoading] = useState(false);
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hideValue, setHideValue] = useState(false);

  useEffect(() => {
    // Fetch portfolio data
    fetchPortfolioData();

    // Connect to WebSocket for real-time updates
    setupWebSocket();

    return () => {
      // Cleanup WebSocket connections
      webSocketService.disconnect();
    };
  }, []);

  // Fetch portfolio data from API
  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, uncomment this:
      // const response = await tradingApiService.getPortfolio();
      // if (response.success) {
      //   setPortfolio(response.data);
      // } else {
      //   setError(response.error || 'Failed to fetch portfolio data');
      // }
      
      // Using mock data for now
      setPortfolio(mockPortfolioData);
      setIsLoading(false);
    } catch (err: any) {
      setError('Failed to fetch portfolio data: ' + err.message);
      setIsLoading(false);
    }
  };

  // Setup WebSocket for real-time price updates
  const setupWebSocket = () => {
    // Connect to WebSocket server
    webSocketService.connect().then(() => {
      // Subscribe to market data updates for all holdings
      if (portfolio?.holdings) {
        portfolio.holdings.forEach((holding: any) => {
          webSocketService.subscribe({
            topic: 'quote',
            symbol: holding.symbol,
            exchange: holding.exchange
          });
        });
      }

      // Set up event handler for quote updates
      webSocketService.on('quote', (message) => {
        if (message.data) {
          updateHoldingPrices(message.data);
        }
      });
    }).catch(err => {
      console.error('Failed to connect to WebSocket:', err);
    });
  };

  // Update holding prices when receiving real-time updates
  const updateHoldingPrices = (quoteData: any) => {
    const { symbol, lastPrice, change, changePercent } = quoteData;
    
    setPortfolio((prevPortfolio: any) => {
      if (!prevPortfolio?.holdings) return prevPortfolio;
      
      // Find the holding with matching symbol
      const holdingIndex = prevPortfolio.holdings.findIndex((h: any) => h.symbol === symbol);
      if (holdingIndex === -1) return prevPortfolio;
      
      const holdings = [...prevPortfolio.holdings];
      const holding = holdings[holdingIndex];
      
      // Calculate new values
      const quantity = holding.quantity;
      const avgPrice = holding.avgPrice;
      const oldPrice = holding.currentPrice;
      const oldValue = holding.value;
      const investment = quantity * avgPrice;
      const newValue = quantity * lastPrice;
      const newPL = newValue - investment;
      const newPLPercent = (newPL / investment) * 100;
      
      // Calculate day change
      const priceDiff = lastPrice - oldPrice;
      const dayChange = quantity * priceDiff;
      
      // Update the holding
      holdings[holdingIndex] = {
        ...holding,
        currentPrice: lastPrice,
        value: newValue,
        pl: newPL,
        plPercent: newPLPercent,
        dayChange: dayChange,
        dayChangePercent: changePercent,
        lastUpdateTime: new Date().toISOString()
      };
      
      // Recalculate portfolio totals
      const totalValue = holdings.reduce((sum: number, h: any) => sum + h.value, 0);
      const totalInvestment = holdings.reduce((sum: number, h: any) => sum + h.investment, 0);
      const totalPL = totalValue - totalInvestment;
      const totalPLPercent = (totalPL / totalInvestment) * 100;
      const dayPL = holdings.reduce((sum: number, h: any) => sum + h.dayChange, 0);
      const dayPLPercent = (dayPL / totalValue) * 100;
      
      return {
        ...prevPortfolio,
        holdings,
        totalValue,
        totalInvestment,
        totalPL,
        totalPLPercent,
        dayPL,
        dayPLPercent,
        lastUpdateTime: new Date().toISOString()
      };
    });
  };

  // Filter holdings
  const getFilteredHoldings = () => {
    if (!portfolio?.holdings) return [];
    
    let filteredHoldings = [...portfolio.holdings];
    
    // Apply search filter
    if (searchTerm) {
      filteredHoldings = filteredHoldings.filter(holding => 
        holding.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filterBy === 'profit') {
      filteredHoldings = filteredHoldings.filter(holding => holding.pl > 0);
    } else if (filterBy === 'loss') {
      filteredHoldings = filteredHoldings.filter(holding => holding.pl < 0);
    }
    
    // Apply sorting
    filteredHoldings.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'value':
          comparison = a.value - b.value;
          break;
        case 'pl':
          comparison = a.pl - b.pl;
          break;
        case 'plPercent':
          comparison = a.plPercent - b.plPercent;
          break;
        case 'dayChange':
          comparison = a.dayChange - b.dayChange;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filteredHoldings;
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Handle sort change
  const handleSortChange = (columnName: string) => {
    if (sortBy === columnName) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to descending order
      setSortBy(columnName);
      setSortOrder('desc');
    }
  };

  // Mask sensitive values when hideValue is true
  const maskValue = (value: string) => {
    return hideValue ? '••••••' : value;
  };

  // Render sort indicator
  const renderSortIndicator = (columnName: string) => {
    if (sortBy !== columnName) return null;
    
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-3 w-3 ml-1" /> : 
      <ArrowDown className="h-3 w-3 ml-1" />;
  };

  if (!portfolio) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex justify-center items-center" style={{ height: '400px' }}>
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Failed to load portfolio data'}</p>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              onClick={fetchPortfolioData}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredHoldings = getFilteredHoldings();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <div className="flex items-center space-x-2">
          <button 
            className="flex items-center text-gray-500 hover:text-gray-700"
            onClick={() => setHideValue(!hideValue)}
          >
            {hideValue ? (
              <>
                <EyeOff className="h-5 w-5 mr-1" />
                <span className="text-sm">Show Value</span>
              </>
            ) : (
              <>
                <Eye className="h-5 w-5 mr-1" />
                <span className="text-sm">Hide Value</span>
              </>
            )}
          </button>
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
            onClick={fetchPortfolioData}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
          <button 
            className="ml-auto text-red-500 hover:text-red-700"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Current Value</h3>
            <p className="text-2xl font-bold">{maskValue(formatCurrency(portfolio.totalValue))}</p>
            <div className={`flex items-center text-sm mt-1 ${portfolio.dayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolio.dayPL >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              <span>{maskValue(formatCurrency(portfolio.dayPL))} ({formatPercentage(portfolio.dayPLPercent)}) Today</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Invested Amount</h3>
            <p className="text-2xl font-bold">{maskValue(formatCurrency(portfolio.totalInvestment))}</p>
            <div className="text-sm mt-1 text-gray-500">
              {portfolio.holdings.length} Stocks
            </div>
          </div>
          
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Overall P&L</h3>
            <p className={`text-2xl font-bold ${portfolio.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {maskValue(formatCurrency(portfolio.totalPL))}
            </p>
            <div className={`text-sm mt-1 ${portfolio.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(portfolio.totalPLPercent)}
            </div>
          </div>
          
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Last Updated</h3>
              <p className="text-sm">{new Date(portfolio.lastUpdateTime).toLocaleString()}</p>
            </div>
            <div className="flex space-x-2">
              <button className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center">
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              <button className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center">
                <PieChart className="h-4 w-4 mr-1" />
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-lg font-semibold">Holdings</h2>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search stocks..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filter */}
            <div className="relative">
              <select
                className="pl-4 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Holdings</option>
                <option value="profit">Profit Only</option>
                <option value="loss">Loss Only</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                <th 
                  className="py-3 px-4 text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange('symbol')}
                >
                  <div className="flex items-center">
                    <span>Stock</span>
                    {renderSortIndicator('symbol')}
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Avg. Price</th>
                <th className="py-3 px-4 text-right">LTP</th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange('value')}
                >
                  <div className="flex items-center justify-end">
                    <span>Current Value</span>
                    {renderSortIndicator('value')}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange('pl')}
                >
                  <div className="flex items-center justify-end">
                    <span>P&L</span>
                    {renderSortIndicator('pl')}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange('dayChange')}
                >
                  <div className="flex items-center justify-end">
                    <span>Day's Change</span>
                    {renderSortIndicator('dayChange')}
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">
                    {searchTerm ? 'No holdings match your search' : 'Your portfolio is empty'}
                  </td>
                </tr>
              ) : (
                filteredHoldings.map((holding: any) => (
                  <tr key={holding.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <Link href={`/dashboard/stock/${holding.symbol}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                          {holding.symbol}
                        </Link>
                        <p className="text-xs text-gray-500">{holding.exchange}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {holding.quantity}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(holding.avgPrice)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(holding.currentPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {maskValue(formatCurrency(holding.value))}
                    </td>
                    <td className={`py-3 px-4 text-right ${holding.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <div>
                        <p>{maskValue(formatCurrency(holding.pl))}</p>
                        <p className="text-xs">{formatPercentage(holding.plPercent)}</p>
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-right ${holding.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <div>
                        <p>{maskValue(formatCurrency(holding.dayChange))}</p>
                        <p className="text-xs">{formatPercentage(holding.dayChangePercent)}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link 
                        href={`/dashboard/stock/${holding.symbol}`} 
                        className="text-gray-400 hover:text-indigo-600 inline-block"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
