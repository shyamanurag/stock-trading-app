// stock-trading-app/frontend/src/components/trading/TradingDashboard.jsx
// Enhanced trading dashboard with mobile responsiveness

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dynamic from 'next/dynamic';
import useMediaQuery from '@/hooks/useMediaQuery';
import { fetchMarketData } from '@/store/slices/marketDataSlice';

// Dynamically import heavy components
const StockChart = dynamic(() => import('./StockChart'), { ssr: false });
const OrderBook = dynamic(() => import('./OrderBook'));
const TradingWidget = dynamic(() => import('./TradingWidget'));
const MarketDepth = dynamic(() => import('./MarketDepth'));

export default function TradingDashboard() {
  const dispatch = useDispatch();
  const { selectedSymbol, marketData, loading } = useSelector(state => state.marketData);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState('chart');
  
  useEffect(() => {
    if (selectedSymbol) {
      dispatch(fetchMarketData(selectedSymbol));
    }
  }, [selectedSymbol, dispatch]);

  // Mobile layout with tabs
  if (isMobile) {
    return (
      <div className="flex flex-col w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'chart' 
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Chart
          </button>
          <button
            onClick={() => setActiveTab('trade')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'trade' 
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Trade
          </button>
          <button
            onClick={() => setActiveTab('orderbook')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'orderbook' 
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Order Book
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-hidden">
          {activeTab === 'chart' && <StockChart symbol={selectedSymbol} data={marketData} />}
          {activeTab === 'trade' && <TradingWidget symbol={selectedSymbol} />}
          {activeTab === 'orderbook' && (
            <div className="grid grid-cols-1 gap-4">
              <OrderBook symbol={selectedSymbol} />
              <MarketDepth symbol={selectedSymbol} />
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Desktop layout with all components visible
  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <StockChart symbol={selectedSymbol} data={marketData} />
      </div>
      <div className="col-span-4 flex flex-col gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <TradingWidget symbol={selectedSymbol} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <OrderBook symbol={selectedSymbol} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <MarketDepth symbol={selectedSymbol} />
        </div>
      </div>
    </div>
  );
}
