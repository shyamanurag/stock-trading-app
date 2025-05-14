'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  ChevronDown, 
  Clock, 
  DollarSign, 
  Info, 
  EyeOff, 
  Eye, 
  RefreshCw,
  BarChart3,
  Share2,
  PlusCircle,
  Bell,
  Bookmark,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { tradingApiService } from '@/services/trading-api.service';
import webSocketService from '@/services/websocket.service';

// Mock data for the stock
const mockStockData = {
  RELIANCE: {
    name: 'Reliance Industries Ltd.',
    symbol: 'RELIANCE',
    exchange: 'NSE',
    lastPrice: 2456.75,
    open: 2444.50,
    high: 2460.00,
    low: 2432.25,
    previousClose: 2445.25,
    change: 11.50,
    changePercent: 0.47,
    volume: 1245780,
    avgPrice: 2446.32,
    bid: 2456.50,
    ask: 2457.00,
    bidQty: 500,
    askQty: 750,
    lowerCircuit: 2200.75,
    upperCircuit: 2690.00,
    yearHigh: 2780.50,
    yearLow: 1980.25,
    marketCap: '1,665,432 Cr',
    pe: 28.5,
    eps: 86.20,
    dividend: 6.50,
    sector: 'Oil & Gas',
    marketStatus: 'Open'
  }
};

// Mock historical data for chart
const mockChartData = [
  { date: '2023-01-01', open: 2400, high: 2450, low: 2390, close: 2440, volume: 1200000 },
  { date: '2023-01-02', open: 2440, high: 2480, low: 2430, close: 2460, volume: 1500000 },
  { date: '2023-01-03', open: 2460, high: 2490, low: 2450, close: 2470, volume: 1300000 },
  { date: '2023-01-04', open: 2470, high: 2480, low: 2440, close: 2450, volume: 1100000 },
  { date: '2023-01-05', open: 2450, high: 2470, low: 2430, close: 2465, volume: 1400000 },
  // Add more data points here...
];

interface OrderFormData {
  symbol: string;
  symbolName: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  quantity: number;
  price: number | null;
  triggerPrice: number | null;
  product: 'CNC' | 'MIS' | 'NRML';
}

export default function StockDetailPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol;
  const [stockData, setStockData] = useState<any>(mockStockData[symbol] || null);
  const [isLoading, setIsLoading] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState('1D');
  const [orderFormData, setOrderFormData] = useState<OrderFormData>({
    symbol: symbol,
    symbolName: stockData?.name || '',
    type: 'BUY',
    orderType: 'MARKET',
    quantity: 1,
    price: stockData?.lastPrice || null,
    triggerPrice: null,
    product: 'CNC',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch stock data
    fetchStockData();

    // Connect to WebSocket for real-time updates
    setupWebSocket();

    return () => {
      // Cleanup WebSocket connections
      webSocketService.disconnect();
    };
  }, [symbol]);

  // Fetch stock data from API
  const fetchStockData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, uncomment this:
      // const response = await tradingApiService.getQuote(symbol, 'NSE');
      // if (response.success) {
      //   setStockData(response.data);
      //   
      //   // Update order form price
      //   setOrderFormData(prev => ({
      //     ...prev,
      //     symbolName: response.data.name,
      //     price: response.data.lastPrice
      //   }));
      // } else {
      //   setError(response.error || 'Failed to fetch stock data');
      // }
      
      // Using mock data for now
      if (mockStockData[symbol]) {
        setStockData(mockStockData[symbol]);
        
        // Update order form data
        setOrderFormData(prev => ({
          ...prev,
          symbolName: mockStockData[symbol].name,
          price: mockStockData[symbol].lastPrice
        }));
      } else {
        setError(`No data found for symbol: ${symbol}`);
      }
      setIsLoading(false);
    } catch (err: any) {
      setError('Failed to fetch stock data: ' + err.message);
      setIsLoading(false);
    }
  };

  // Setup WebSocket for real-time price updates
  const setupWebSocket = () => {
    // Connect to WebSocket server
    webSocketService.connect().then(() => {
      // Subscribe to market data updates
      webSocketService.subscribe({
        topic: 'quote',
        symbol,
        exchange: 'NSE'
      });

      // Set up event handler for quote updates
      webSocketService.on('quote', (message) => {
        if (message.data && message.data.symbol === symbol) {
          updateStockData(message.data);
        }
      });
    }).catch(err => {
      console.error('Failed to connect to WebSocket:', err);
    });
  };

  // Update stock data when receiving real-time updates
  const updateStockData = (quoteData: any) => {
    setStockData(prev => ({
      ...prev,
      lastPrice: quoteData.lastPrice,
      change: quoteData.change,
      changePercent: quoteData.changePercent,
      volume: quoteData.volume,
      bid: quoteData.bid,
      ask: quoteData.ask,
      bidQty: quoteData.bidQty,
      askQty: quoteData.askQty,
      high: quoteData.high > prev.high ? quoteData.high : prev.high,
      low: quoteData.low < prev.low ? quoteData.low : prev.low,
    }));

    // Update order form price
    setOrderFormData(prev => ({
      ...prev,
      price: quoteData.lastPrice
    }));
  };

  // Handle order form changes
  const handleOrderFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrderFormData({
      ...orderFormData,
      [name]: name === 'quantity' ? parseInt(value) : 
              (name === 'price' || name === 'triggerPrice') ? parseFloat(value) : value,
    });
  };

  // Handle order type change (BUY/SELL)
  const handleOrderTypeChange = (type: 'BUY' | 'SELL') => {
    setOrderFormData({
      ...orderFormData,
      type,
    });
  };

  // Handle order submission
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In a real implementation, uncomment this:
      // const response = await tradingApiService.placeOrder({
      //   symbol: orderFormData.symbol,
      //   exchange: 'NSE',
      //   quantity: orderFormData.quantity,
      //   price: orderFormData.orderType !== 'MARKET' ? orderFormData.price : undefined,
      //   triggerPrice: (orderFormData.orderType === 'SL' || orderFormData.orderType === 'SL-M') ? orderFormData.triggerPrice : undefined,
      //   type: orderFormData.type,
      //   orderType: orderFormData.orderType,
      //   product: orderFormData.product
      // });
      
      // if (response.success) {
      //   alert(`Order placed successfully: ${orderFormData.type} ${orderFormData.quantity} ${orderFormData.symbol}`);
      // } else {
      //   setError(response.error || 'Failed to place order');
      // }
      
      // Mock success for now
      alert(`Order placed: ${orderFormData.type} ${orderFormData.quantity} ${orderFormData.symbol} @ ${orderFormData.orderType === 'MARKET' ? 'MARKET' : orderFormData.price}`);
    } catch (err: any) {
      setError('Failed to place order: ' + err.message);
    }
  };

  if (!stockData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex justify-center items-center" style={{ height: '400px' }}>
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || `No data found for symbol: ${symbol}`}</p>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              onClick={fetchStockData}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {/* Stock Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold mr-2">{stockData.symbol}</h1>
              <span className="text-sm px-2 py-1 bg-gray-100 rounded">{stockData.exchange}</span>
            </div>
            <p className="text-gray-500">{stockData.name}</p>
            <div className="flex items-center mt-2">
              <span className="text-3xl font-semibold mr-2">₹{stockData.lastPrice.toFixed(2)}</span>
              <div className={`flex items-center ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stockData.change >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                <span>{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded">
              <Bookmark className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded" onClick={fetchStockData}>
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500 mb-1">Open</div>
            <div className="font-medium">₹{stockData.open.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500 mb-1">Previous Close</div>
            <div className="font-medium">₹{stockData.previousClose.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500 mb-1">Day High</div>
            <div className="font-medium">₹{stockData.high.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500 mb-1">Day Low</div>
            <div className="font-medium">₹{stockData.low.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Price Chart</h2>
              <div className="flex items-center">
                <div className="flex border border-gray-200 rounded-md overflow-hidden">
                  {['1D', '1W', '1M', '3M', 'YTD', '1Y', '5Y'].map((timeframe) => (
                    <button
                      key={timeframe}
                      className={`px-3 py-1 text-xs ${
                        chartTimeframe === timeframe 
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setChartTimeframe(timeframe)}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="h-80 bg-gray-100 rounded flex items-center justify-center">
                <div className="text-gray-400 flex flex-col items-center">
                  <BarChart3 className="h-10 w-10 mb-2" />
                  <p>Chart Placeholder</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Stock Details</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">52 Week High</p>
                  <p className="font-medium">₹{stockData.yearHigh.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">52 Week Low</p>
                  <p className="font-medium">₹{stockData.yearLow.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Market Cap</p>
                  <p className="font-medium">₹{stockData.marketCap}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">P/E Ratio</p>
                  <p className="font-medium">{stockData.pe}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">EPS</p>
                  <p className="font-medium">₹{stockData.eps}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dividend</p>
                  <p className="font-medium">₹{stockData.dividend}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Volume</p>
                  <p className="font-medium">{stockData.volume.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg. Price</p>
                  <p className="font-medium">₹{stockData.avgPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sector</p>
                  <p className="font-medium">{stockData.sector}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-2">Market Depth</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2 text-sm font-medium text-green-600">Bids</div>
                    <div className="bg-green-50 rounded overflow-hidden">
                      <div className="grid grid-cols-2 py-1 px-2 text-xs font-medium bg-green-100">
                        <div>Price</div>
                        <div className="text-right">Quantity</div>
                      </div>
                      <div className="divide-y divide-green-100">
                        <div className="grid grid-cols-2 py-1 px-2 text-sm">
                          <div>₹{stockData.bid.toFixed(2)}</div>
                          <div className="text-right">{stockData.bidQty}</div>
                        </div>
                        <div className="grid grid-cols-2 py-1 px-2 text-sm">
                          <div>₹{(stockData.bid - 0.25).toFixed(2)}</div>
                          <div className="text-right">320</div>
                        </div>
                        <div className="grid grid-cols-2 py-1 px-2 text-sm">
                          <div>₹{(stockData.bid - 0.50).toFixed(2)}</div>
                          <div className="text-right">550</div>
                        </div>
                        <div className="grid grid-cols-2 py-1 px-2 text-sm">
                          <div>₹{(stockData.bid - 0.75).toFixed(2)}</div>
                          <div className="text-right">780</div>
                        </div>
                        <div className="grid grid-cols-2 py-1 px-2 text-sm">
                          <div>₹{(stockData.bid - 1.00).toFixed(2)}</div>
                          <div className="text-right">1200</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-medium text-red-600">Asks</div>
                    <div className="bg-red-50 rounded overflow-hidden">
                      <div className="grid grid-cols-2 py-1 px-2 text-xs font-medium bg-red-100">
                        <div>Price</div>
                        <div className="text-right">Quantity</div>
                      </div>
                      <div className="divide-y divide-red-100">
                        <div className="grid grid-cols-2 py-1 px-2 text-sm">
                          <div>₹{stockData.ask.toFixed(2)}</div>
                          <div className="text-right">{stockData.askQty}</div>
                        </div>
                        <div className="grid grid-cols-2 py-1 px-2 text-sm">
                          <div>₹{(stockData.ask + 0.25).toFixed(2)}</div>
                          <div className="text-right">450</div>
                        </div>
                        <div className="grid grid-cols-2 py-1 px-2 text-sm">
                          <div>₹{(stockData.ask + 0.50).toFixed(2)}</div>
                          <div className="text-right">680</div>
                        </div>
                        <div className="grid grid-cols-2 py-1 px-2 text-sm">
                          <div>₹{(stockData.ask + 0.75).toFixed(2)}</div>
                          <div className="text-right">520</div>
                        </div>
                        <div className="grid grid-cols-2 py-1 px-2 text-sm">
                          <div>₹{(stockData.ask + 1.00).toFixed(2)}</div>
                          <div className="text-right">900</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Order Form */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Place Order</h2>
            </div>
            <div className="p-4">
              {error && (
                <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md flex items-center text-sm">
                  <Info className="h-4 w-4 mr-2" />
                  <span>{error}</span>
                </div>
              )}
              
              <form onSubmit={handleOrderSubmit}>
                {/* Buy/Sell Toggle */}
                <div className="flex mb-4">
                  <button
                    type="button"
                    className={`flex-1 py-2 font-medium rounded-l-md focus:outline-none ${
                      orderFormData.type === 'BUY' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => handleOrderTypeChange('BUY')}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 font-medium rounded-r-md focus:outline-none ${
                      orderFormData.type === 'SELL' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => handleOrderTypeChange('SELL')}
                  >
                    SELL
                  </button>
                </div>

                {/* Order Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                  <select
                    name="orderType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={orderFormData.orderType}
                    onChange={handleOrderFormChange}
                  >
                    <option value="MARKET">MARKET</option>
                    <option value="LIMIT">LIMIT</option>
                    <option value="SL">STOP-LOSS</option>
                    <option value="SL-M">STOP-LOSS MARKET</option>
                  </select>
                </div>

                {/* Product Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select
                    name="product"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={orderFormData.product}
                    onChange={handleOrderFormChange}
                  >
                    <option value="CNC">CNC (Delivery)</option>
                    <option value="MIS">MIS (Intraday)</option>
                    <option value="NRML">NRML (Futures/Options)</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={orderFormData.quantity}
                    onChange={handleOrderFormChange}
                  />
                </div>

                {/* Price (for LIMIT and SL orders) */}
                {(orderFormData.orderType === 'LIMIT' || orderFormData.orderType === 'SL') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      name="price"
                      step="0.05"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={orderFormData.price || ''}
                      onChange={handleOrderFormChange}
                    />
                  </div>
                )}

                {/* Trigger Price (for SL and SL-M orders) */}
                {(orderFormData.orderType === 'SL' || orderFormData.orderType === 'SL-M') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Price</label>
                    <input
                      type="number"
                      name="triggerPrice"
                      step="0.05"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={orderFormData.triggerPrice || ''}
                      onChange={handleOrderFormChange}
                    />
                  </div>
                )}

                {/* Order Value */}
                <div className="mb-6 bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Order Value:</span>
                    <span className="font-medium">
                      ₹ {(orderFormData.quantity * (orderFormData.price || stockData.lastPrice)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Estimated Charges:</span>
                    <span className="font-medium">
                      ₹ {(0.0005 * orderFormData.quantity * (orderFormData.price || stockData.lastPrice)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    orderFormData.type === 'BUY'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {orderFormData.type === 'BUY' ? 'Buy' : 'Sell'} {symbol}
                </button>
              </form>

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Stock Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Market Status:</span>
                    <span className={`font-medium ${stockData.marketStatus === 'Open' ? 'text-green-600' : 'text-red-600'}`}>
                      {stockData.marketStatus}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Circuit Limits:</span>
                    <span className="font-medium">
                      ₹{stockData.lowerCircuit.toFixed(2)} - ₹{stockData.upperCircuit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Add to Watchlist</h3>
                  <button className="text-indigo-600 hover:text-indigo-700 flex items-center text-sm">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
