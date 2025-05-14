// stock-trading-app/frontend/src/app/dashboard/layout.tsx
// Implement code splitting and lazy loading for dashboard components

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import LoadingIndicator from '@/components/common/LoadingIndicator';

// Lazy load heavy components
const MarketMover = dynamic(() => import('@/components/trading/MarketMover'), { 
  suspense: true,
  loading: () => <LoadingIndicator /> 
});

const TradingDashboard = dynamic(() => import('@/components/trading/TradingDashboard'), {
  suspense: true,
  loading: () => <LoadingIndicator />
});

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Suspense fallback={<LoadingIndicator />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
