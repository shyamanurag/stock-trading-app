// File: frontend/src/components/dashboard/Dashboard.tsx

import React, { useState } from 'react';
import { Navigate, Routes, Route, Link } from 'react-router-dom';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useAuth } from '../../contexts/AuthContext';
import { PlusIcon, BellIcon, UserCircleIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';
import useMediaQuery from '../../hooks/useMediaQuery';

// Components
import Navbar from '../navigation/Navbar';
import Sidebar from '../navigation/Sidebar';
import PortfolioSummary from './PortfolioSummary';
import PositionsList from './PositionsList';
import WatchlistsPanel from './watchlist/WatchlistsPanel';
import StockSearch from './stocks/StockSearch';
import StockDetails from './stocks/StockDetails';
import TransactionHistory from './transactions/TransactionHistory';
import PerformanceChart from './charts/PerformanceChart';
import AccountSettings from '../settings/AccountSettings';
import NotificationsPanel from '../notifications/NotificationsPanel';
import LoadingSpinner from '../ui/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { portfolio, loading: portfolioLoading } = usePortfolio();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (portfolioLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Top navigation */}
        <Navbar
          toggleSidebar={toggleSidebar}
          toggleNotifications={toggleNotifications}
        />

        {/* Notifications panel (slide-over on mobile, right column on desktop) */}
        {isMobile ? (
          <Transition
            show={notificationsOpen}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
            className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-white dark:bg-gray-800 shadow-lg"
          >
            <div className="h-full flex flex-col">
              <div className="px-4 py-6 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h2>
                  <button
                    type="button"
                    className="ml-3 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <span className="sr-only">Close panel</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NotificationsPanel />
              </div>
            </div>
          </Transition>
        ) : null}

        {/* Page content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Dashboard content */}
              <Routes>
                <Route path="/" element={
                  <>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
                    <div className="py-4">
                      <PortfolioSummary />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <div className="lg:col-span-2 space-y-5">
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
                          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Portfolio Performance</h2>
                          <div className="h-64">
                            <PerformanceChart />
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Positions</h2>
                            <Link 
                              to="/dashboard/transactions" 
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View all transactions →
                            </Link>
                          </div>
                          <PositionsList />
                        </div>
                      </div>
                      <div className="space-y-5">
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Watchlists</h2>
                            <Link 
                              to="/dashboard/watchlists" 
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Manage →
                            </Link>
                          </div>
                          <WatchlistsPanel showLatestOnly={true} maxItems={5} />
                        </div>
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
                          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Trade</h2>
                          <StockSearch limit={3} showTradingPanel={true} />
                        </div>
                        {!isMobile && 
                          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notifications</h2>
                            <NotificationsPanel limit={5} />
                          </div>
                        }
                      </div>
                    </div>
                  </>
                } />
                <Route path="/stocks" element={<StockSearch />} />
                <Route path="/stocks/:symbol" element={<StockDetails />} />
                <Route path="/watchlists" element={<WatchlistsPanel />} />
                <Route path="/transactions" element={<TransactionHistory />} />
                <Route path="/settings" element={<AccountSettings />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
