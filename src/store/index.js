// src/store/index.js

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { combineReducers } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import thunk from 'redux-thunk';

// Import reducers
import authReducer from './slices/authSlice';
import marketReducer from './slices/marketSlice';
import orderReducer from './slices/orderSlice';
import portfolioReducer from './slices/portfolioSlice';
import watchlistReducer from './slices/watchlistSlice';
import walletReducer from './slices/walletSlice';
import kycReducer from './slices/kycSlice';

// Middleware
const middlewares = [thunk];

// Configure persist
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'watchlist', 'market'], // Only persist these reducers
  blacklist: ['wallet', 'kyc'], // Don't persist these (sensitive data)
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  market: marketReducer,
  order: orderReducer,
  portfolio: portfolioReducer,
  watchlist: watchlistReducer,
  wallet: walletReducer,
  kyc: kycReducer,
});

// Apply persist
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(middlewares),
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for RTK Query refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Create persisted store
export const persistor = persistStore(store);

export default store;
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    // Other reducers
    analytics: analyticsReducer,
  },
});
