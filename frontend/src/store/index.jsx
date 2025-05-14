// stock-trading-app/frontend/src/store/index.jsx
// Implement Redux with proper slices for different features

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { tradingApi } from '../services/api/tradingApi';
import portfolioReducer from './slices/portfolioSlice';
import marketDataReducer from './slices/marketDataSlice';
import userReducer from './slices/userSlice';
import watchlistReducer from './slices/watchlistSlice';
import orderReducer from './slices/orderSlice';

export const store = configureStore({
  reducer: {
    [tradingApi.reducerPath]: tradingApi.reducer,
    portfolio: portfolioReducer,
    marketData: marketDataReducer,
    user: userReducer,
    watchlist: watchlistReducer,
    orders: orderReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(tradingApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
