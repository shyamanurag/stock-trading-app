'use client';

import React, { useState } from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  BarChart3, 
  ChevronDown, 
  Clock, 
  DollarSign, 
  Info, 
  Maximize2, 
  Minimize2, 
  Plus, 
  RefreshCw,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';

// Mock Data
const marketIndices = [
  { name: 'NIFTY 50', value: '18,245.32', change: '+49.57', changePercent: '+0.27%', trend: 'up' },
  { name: 'SENSEX', value: '61,345.75', change: '+198.25', changePercent: '+0.32%', trend: 'up' },
  { name: 'NIFTY BANK', value: '42,567.80', change: '-65.45', changePercent: '-0.15%', trend: 'down' },
  { name: 'NIFTY IT', value: '32,156.40', change: '+77.75', changePercent: '+0.24%', trend: 'up' },
];

const watchlistStocks = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', ltp: '2456.75', change: '+11.50', changePercent: '+0.47%', trend: 'up' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', ltp: '3552.80', change: '-28.45', changePercent: '-0.79%', trend: 'down' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', ltp: '1675.20', change: '+8.65', changePercent: '+0.52%', trend: 'up' },
  { symbol: 'INFY', name: 'Infosys Ltd.', ltp: '1452.35', change: '-12.75', changePercent: '-0.87%', trend: 'down' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', ltp: '945.50', change: '+5.30', changePercent: '+0.56%', trend: 'up' },
];

const portfolioSummary = {
  currentValue: '₹ 5,78,930.50',
  investmentValue: '₹ 5,23,450.75',
  todaysPnL: '+₹ 2,345.75',
  todaysPnLPercent: '+0.41%',
  overallPnL: '+₹ 55,479.75',
  overallPnLPercent: '+10.60%',
};

const recentOrders = [
  { id: 'ORD123456', symbol: 'RELIANCE', type: 'BUY', quantity: 10, price: '2456.75', status: 'COMPLETED', time: '10:15 AM' },
  { id: 'ORD123457', symbol: 'INFY', type: 'SELL', quantity: 15, price: '1452.35', status: 'COMPLETED', time: '10:05 AM' },
  { id: 'ORD123458', symbol: 'HDFCBANK', type: 'BUY', quantity: 5, price: '1675.20', status: 'PENDING', time: '09:58 AM' },
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

export default function DashboardPage() {
  const [orderFormVisible, setOrderFormVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [orderFormData, setOrderFormData] = useState<OrderFormData>({
    symbol: '',
    symbolName: '',
    type: 'BUY',
    orderType: 'MARKET',
    quantity: 1,
    price: null,
    triggerPrice: null,
    product: 'CNC',
  });

  const openOrderForm = (stock: any) => {
    setSelectedStock(stock);
    setOrderFormData({
      ...orderFormData,
      symbol: stock.symbol,
      symbolName: stock.name,
      price: parseFloat(stock.ltp.replace(/,/g, '')),
    });
    setOrderFormVisible(true);
  };

  const closeOrderForm = () => {
    setOrderFormVisible(false);
    setSelectedStock(null);
  };

  const handleOrderFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrderFormData({
      ...orderFormData,
      [name]: value,
    });
  };

  const handleOrderTypeChange = (type: 'BUY' | 'SELL') => {
    setOrderFormData({
      ...orderFormData,
      type,
    });
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would integrate with your backend API to place the order
    console.log('Placing order:', orderFormData);
    
    // Mock successful order
    alert(`Order placed: ${orderFormData.type} ${orderFormData.quantity} ${orderFormData.symbol} @ ${orderFormData.orderType === 'MARKET' ? 'MARKET' : orderFormData.price}`);
    
    // Close the form
    closeOrderForm();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, Rajesh! Here's your market overview.</p>
      </div>

      {/* Market Indices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {marketIndices.map((index) => (
          <div key={index.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-500">{index.name}</h3>
                <p className="text-2xl font-semibold mt-1">{index.value}</p>
              </div>
              <div className={`flex items-center ${index.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {index.trend === 'up' ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                <span>{index.change} ({index.changePercent})</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Watchlist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Watchlist */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Watchlist</h2>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-500 hover:text-gray-700">
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-700">
                  <Plus className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-700">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left">Symbol</th>
                    <th className="py-3 px-4 text-left">LTP</th>
                    <th className="py-3 px-4 text-left">Change</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlistStocks.map((stock) => (
                    <tr 
                      key={stock.symbol} 
                      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => openOrderForm(stock)}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{stock.symbol}</p>
                          <p className="text-xs text-gray-500">{stock.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{stock.ltp}</td>
                      <td className={`py-3 px-4 ${stock.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center">
                          {stock.trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                          <span>{stock.change} ({stock.changePercent})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            openOrderForm(stock);
                          }}
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-200 text-center">
              <Link href="/dashboard/watchlist" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View all watchlists →
              </Link>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Market Overview</h2>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-500 hover:text-gray-700">
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-700">
                  <Maximize2 className="h-4 w-4" />
                </button>
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
        </div>

        {/* Right column: Portfolio, Orders, Trading Form */}
        <div className="space-y-6">
          {/* Portfolio Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Portfolio Summary</h2>
              <button className="p-1 text-gray-500 hover:text-gray-700">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Current Value</p>
                  <p className="text-xl font-bold">{portfolioSummary.currentValue}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Today's P&L</p>
                  <p className="text-lg font-medium text-green-600">{portfolioSummary.todaysPnL} ({portfolioSummary.todaysPnLPercent})</p>
                </div>
              </div>
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Investment Value</p>
                  <p className="text-lg font-medium">{portfolioSummary.investmentValue}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Overall P&L</p>
                  <p className="text-lg font-medium text-green-600">{portfolioSummary.overallPnL} ({portfolioSummary.overallPnLPercent})</p>
                </div>
              </div>
              <Link 
                href="/dashboard/portfolio" 
                className="block w-full mt-4 text-center py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                View Portfolio
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Link href="/dashboard/trades" className="text-sm text-indigo-600 hover:text-indigo-700">
                View All
              </Link>
            </div>
            <div>
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="p-4 border-b border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        order.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {order.type}
                      </span>
                      <span className="ml-2 font-medium">{order.symbol}</span>
                    </div>
                    <span className="text-sm text-gray-500">{order.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-500">
                      {order.quantity} x ₹{order.price}
                    </div>
                    <span className={`text-sm font-medium ${
                      order.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Trade Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Quick Trade</h2>
            </div>
            <div className="p-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for a stock to trade..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {watchlistStocks.slice(0, 4).map((stock) => (
                  <button
                    key={stock.symbol}
                    className="flex flex-col items-start p-2 border border-gray-200 rounded hover:bg-indigo-50"
                    onClick={() => openOrderForm(stock)}
                  >
                    <span className="font-medium">{stock.symbol}</span>
                    <span className={`text-xs ${stock.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.ltp} ({stock.changePercent})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Form Modal */}
      {orderFormVisible && selectedStock && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="order-form-modal" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeOrderForm}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Place Order
                      </h3>
                      <button onClick={closeOrderForm} className="text-gray-400 hover:text-gray-500">
                        <EyeOff className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{selectedStock.symbol}</h4>
                          <p className="text-sm text-gray-500">{selectedStock.name}</p>
                        </div>
                        <div className={`text-right ${selectedStock.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          <p className="font-medium">{selectedStock.ltp}</p>
                          <p className="text-sm">{selectedStock.change} ({selectedStock.changePercent})</p>
                        </div>
                      </div>
                    </div>
                    
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
