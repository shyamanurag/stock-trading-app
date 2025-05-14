// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Use SWC for minification (faster than Terser)
  images: {
    domains: ['yourstockimages.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // Enable server components where beneficial
    serverComponents: true,
    // Optimize CSS - removes unused CSS
    optimizeCss: true,
    // Optimize fonts
    fontLoaders: [
      { loader: '@next/font/google', options: { subsets: ['latin'] } },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // Only run bundle analyzer in production build
    if (!dev && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: false,
        })
      );
      
      // Add compression plugins for production
      const CompressionPlugin = require('compression-webpack-plugin');
      config.plugins.push(
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 10240,
          minRatio: 0.8,
        })
      );
    }
    
    // Optimize images
    config.module.rules.push({
      test: /\.(jpe?g|png|gif|webp)$/i,
      use: [
        {
          loader: 'image-webpack-loader',
          options: {
            mozjpeg: {
              progressive: true,
              quality: 65,
            },
            optipng: {
              enabled: true,
            },
            pngquant: {
              quality: [0.65, 0.90],
              speed: 4,
            },
            gifsicle: {
              interlaced: false,
            },
            webp: {
              quality: 75,
            },
          },
        },
      ],
    });
    
    return config;
  },
};

module.exports = nextConfig;

// Implement React.lazy and dynamic imports for code splitting
// app/components/trading/OptionChain.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import heavy components
const OptionChainTable = dynamic(() => import('./OptionChainTable'), {
  loading: () => <div>Loading option chain...</div>,
  ssr: false, // Disable Server-Side Rendering for data-heavy components
});

const OptionStrategyBuilder = dynamic(() => import('./OptionStrategyBuilder'), {
  loading: () => <div>Loading strategy builder...</div>,
  ssr: false,
});

// Implementation of hooks for memoization
// app/hooks/useMemoizedCallback.ts
import { useCallback, useRef, useEffect, DependencyList } from 'react';

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(
    ((...args: any[]) => callbackRef.current(...args)) as T,
    deps
  );
}

// Implement a custom hook for virtualized lists
// app/hooks/useVirtualizedList.ts
import { useState, useEffect, useRef } from 'react';

export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateVisibleRange = () => {
      if (!containerRef.current) return;
      
      const scrollTop = containerRef.current.scrollTop;
      const buffer = 5; // Items buffered outside visible area
      
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
      const end = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
      );
      
      setVisibleRange({ start, end });
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateVisibleRange);
      updateVisibleRange();
      
      return () => {
        container.removeEventListener('scroll', updateVisibleRange);
      };
    }
  }, [items.length, itemHeight, containerHeight]);
  
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const paddingTop = visibleRange.start * itemHeight;
  
  return {
    containerRef,
    visibleItems,
    paddingTop,
    totalHeight: items.length * itemHeight,
  };
}

// Implement service worker for PWA and offline caching
// public/sw.js
const CACHE_NAME = 'stock-trading-app-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/portfolio',
  '/watchlist',
  '/options',
  '/offline',
  '/static/styles/main.css',
  '/static/js/main.js',
  '/static/images/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Don't cache API requests for market data
                if (!event.request.url.includes('/api/market-data/')) {
                  cache.put(event.request, responseToCache);
                }
              });
            
            return response;
          }
        );
      }).catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/offline');
        }
        
        return new Response('Network error occurred', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});

// Implementation of Web Vitals monitoring
// app/lib/webVitals.ts
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

export function reportWebVitals(metric) {
  // Send to analytics or logging service
  console.log(metric);
  
  // Send to your APM service
  if (window.apm && window.apm.captureWebVitals) {
    window.apm.captureWebVitals(metric);
  }
  
  // You can also send to a custom endpoint
  const body = JSON.stringify(metric);
  
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', body);
  } else {
    fetch('/api/vitals', {
      body,
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export function initWebVitals() {
  getCLS(reportWebVitals);
  getFID(reportWebVitals);
  getLCP(reportWebVitals);
  getFCP(reportWebVitals);
  getTTFB(reportWebVitals);
}

// Implement effective caching for static content
// app/lib/cacheControl.ts
export const staticCacheControl = {
  'Cache-Control': 'public, max-age=31536000, immutable',
};

export const dynamicCacheControl = {
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
};

export const noCacheControl = {
  'Cache-Control': 'no-store, max-age=0',
};

// Set up an optimized React component
// app/components/MarketData/StockTickerRow.tsx
import React, { memo, useMemo } from 'react';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface StockTickerRowProps {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  onSelect: (symbol: string) => void;
}

const StockTickerRow: React.FC<StockTickerRowProps> = memo(
  ({ symbol, price, change, volume, onSelect }) => {
    // Calculate percentage change only when price or change updates
    const percentChange = useMemo(() => {
      return (change / (price - change)) * 100;
    }, [price, change]);
    
    // Determine color based on change direction
    const changeColor = useMemo(() => {
      return change >= 0 ? 'text-green-500' : 'text-red-500';
    }, [change]);
    
    // Format values only when they change
    const formattedPrice = useMemo(() => formatCurrency(price), [price]);
    const formattedChange = useMemo(() => formatCurrency(change), [change]);
    const formattedPercent = useMemo(
      () => formatPercentage(percentChange),
      [percentChange]
    );
    
    return (
      <tr
        className="hover:bg-gray-100 cursor-pointer"
        onClick={() => onSelect(symbol)}
      >
        <td className="py-2 px-4">{symbol}</td>
        <td className="py-2 px-4">{formattedPrice}</td>
        <td className={`py-2 px-4 ${changeColor}`}>
          {formattedChange} ({formattedPercent})
        </td>
        <td className="py-2 px-4">{volume.toLocaleString()}</td>
      </tr>
    );
  }
);

StockTickerRow.displayName = 'StockTickerRow';

export default StockTickerRow;
