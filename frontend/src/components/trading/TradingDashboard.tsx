// stock-trading-app/frontend/src/components/trading/TradingDashboard.tsx

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dynamic from 'next/dynamic';
import useMediaQuery from '@/hooks/useMediaQuery';
import { fetchMarketData } from '@/store/slices/marketDataSlice';
import { AppDispatch, RootState } from '@/store';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { SymbolSearch } from '@/components/trading/SymbolSearch';
import { TradeNotification } from '@/components/trading/TradeNotification';
import websocketService from '@/services/websocket.service';

// Dynamically import heavy components
const StockChart = dynamic(() => import('./StockChart'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full flex items-center justify-center"><LoadingIndicator /></div>
});

const OrderBook = dynamic(() => import('./OrderBook'), {
  loading: () => <div className="h-48 w-full flex items-center justify-center"><LoadingIndicator /></div>
});

const TradingWidget = dynamic(() => import('./TradingWidget'), {
  loading: () => <div className="h-48 w-full flex items-center justify-center"><LoadingIndicator /></div>
});

const MarketDepth = dynamic(() => import('./MarketDepth'), {
  loading: () => <div className="h-48 w-full flex items-center justify-center"><LoadingIndicator /></div>
});

const MarketNews = dynamic(() => import('./MarketNews'), {
  loading: () => <div className="h-48 w-full flex items-center justify-center"><LoadingIndicator /></div>
});

export interface TradingDashboardProps {
  initialSymbol?: string;
}

export default function TradingDashboard({ initialSymbol }: TradingDashboardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedSymbol, marketData, loading, error } = useSelector((state: RootState) => state.marketData);
  const { user } = useSelector((state: RootState) => state.user);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState('chart');
  const [notifications, setNotifications] = useState<string[]>([]);
  
  // Initialize with symbol if provided
  useEffect(() => {
    if (initialSymbol && !selectedSymbol) {
      dispatch(fetchMarketData(initialSymbol));
    }
  }, [initialSymbol, selectedSymbol, dispatch]);
  
  // Fetch data when symbol changes
  useEffect(() => {
    if (selectedSymbol) {
      dispatch(fetchMarketData(selectedSymbol));
    }
  }, [selectedSymbol, dispatch]);
  
  // Subscribe to market data updates via WebSocket
  useEffect(() => {
    if (!selectedSymbol) return;
    
    const unsubscribe = websocketService.subscribeToMarketData(selectedSymbol, (data) => {
      // Update market data in real-time
      // This would typically dispatch an action to update Redux
      console.log('Received market data update:', data);
    });
    
    return () => {
      unsubscribe();
    };
  }, [selectedSymbol]);
  
  // Subscribe to order updates
  useEffect(() => {
    if (!user?.id) return;
    
    const unsubscribe = websocketService.subscribeToOrderUpdates(user.id, (data) => {
      // Show notification for order updates
      setNotifications(prev => [...prev, `Order ${data.orderId} ${data.status}`]);
      
      // Auto-remove notifications after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => !n.includes(data.orderId)));
      }, 5000);
    });
    
    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // Handle error state
  if (error) {
    return <ErrorDisplay message={`Error loading market data: ${error}`} retry={() => selectedSymbol && dispatch(fetchMarketData(selectedSymbol))} />;
  }
  
  // Function to handle symbol change
  const handleSymbolChange = (symbol: string) => {
    dispatch(fetchMarketData(symbol));
  };

  // Mobile layout with tabs
  if (isMobile) {
    return (
      <div className="flex flex-col w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Symbol search bar */}
        <div className="p-4 border-b dark:border-gray-700">
          <SymbolSearch onSelect={handleSymbolChange} currentSymbol={selectedSymbol} />
        </div>
        
        {/* Navigation tabs */}
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
          <button
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'news' 
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            News
          </button>
        </div>
        
        {/* Content area */}
        <div className="flex-1 p-4 overflow-hidden">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <LoadingIndicator />
            </div>
          ) : (
            <>
              {activeTab === 'chart' && <StockChart symbol={selectedSymbol} data={marketData} />}
              {activeTab === 'trade' && <TradingWidget symbol={selectedSymbol} />}
              {activeTab === 'orderbook' && (
                <div className="grid grid-cols-1 gap-4">
                  <OrderBook symbol={selectedSymbol} />
                  <MarketDepth symbol={selectedSymbol} />
                </div>
              )}
              {activeTab === 'news' && <MarketNews symbol={selectedSymbol} />}
            </>
          )}
        </div>
        
        {/* Notifications */}
        <div className="fixed bottom-4 right-4 z-50">
          {notifications.map((notification, index) => (
            <TradeNotification key={index} message={notification} />
          ))}
        </div>
      </div>
    );
  }
  
  // Desktop layout with all components visible
  return (
    <div className="flex flex-col h-full">
      {/* Symbol search and market summary */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-64">
          <SymbolSearch onSelect={handleSymbolChange} currentSymbol={selectedSymbol} />
        </div>
        <div className="flex space-x-4">
          {marketData && (
            <>
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Last: </span>
                <span className="font-medium">{marketData.lastPrice}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Change: </span>
                <span className={`font-medium ${marketData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {marketData.changePercent >= 0 ? '+' : ''}{marketData.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Vol: </span>
                <span className="font-medium">{(marketData.volume / 1000000).toFixed(2)}M</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* Left column - Chart and News */}
        <div className="col-span-8 flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex-1">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <LoadingIndicator />
              </div>
            ) : (
              <StockChart symbol={selectedSymbol} data={marketData} />
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-64">
            <MarketNews symbol={selectedSymbol} />
          </div>
        </div>
        
        {/* Right column - Trading tools */}
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
      
      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50">
        {notifications.map((notification, index) => (
          <TradeNotification key={index} message={notification} />
        ))}
      </div>
    </div>
  );
}
