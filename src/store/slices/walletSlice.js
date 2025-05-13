// src/store/slices/walletSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock API service for development purposes
// Will be replaced with actual API calls in production
const mockApiService = {
  getWalletBalance: () => 
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({ balance: 10000.50 });
      }, 500);
    }),
  
  getTransactionHistory: () => 
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          transactions: [
            { 
              id: '1', 
              type: 'deposit', 
              amount: 5000, 
              status: 'completed', 
              timestamp: new Date(2025, 4, 10).toISOString(),
              reference: 'UPI/12345678/DEPOSIT' 
            },
            { 
              id: '2', 
              type: 'withdrawal', 
              amount: 2000, 
              status: 'completed', 
              timestamp: new Date(2025, 4, 5).toISOString(),
              reference: 'NEFT/87654321/WITHDRAW' 
            },
            { 
              id: '3', 
              type: 'deposit', 
              amount: 1500, 
              status: 'pending', 
              timestamp: new Date(2025, 4, 1).toISOString(),
              reference: 'CARD/56781234/DEPOSIT' 
            },
            { 
              id: '4', 
              type: 'withdrawal', 
              amount: 3000, 
              status: 'failed', 
              timestamp: new Date(2025, 3, 28).toISOString(),
              reference: 'NEFT/43218765/FAILED' 
            }
          ],
          currentPage: 1,
          totalPages: 1,
          totalItems: 4
        });
      }, 700);
    }),
  
  depositFunds: (paymentDetails) => 
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transaction: {
            id: Math.random().toString(36).substr(2, 9),
            type: 'deposit',
            amount: paymentDetails.amount,
            status: 'pending',
            timestamp: new Date().toISOString(),
            reference: `${paymentDetails.method.toUpperCase()}/${Math.random().toString(36).substr(2, 8)}/DEPOSIT`
          },
          message: 'Deposit initiated successfully'
        });
      }, 1000);
    }),
  
  withdrawFunds: (withdrawalDetails) => 
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transaction: {
            id: Math.random().toString(36).substr(2, 9),
            type: 'withdrawal',
            amount: withdrawalDetails.amount,
            status: 'pending',
            timestamp: new Date().toISOString(),
            reference: `NEFT/${Math.random().toString(36).substr(2, 8)}/WITHDRAW`
          },
          message: 'Withdrawal initiated successfully'
        });
      }, 1000);
    })
};

// Async thunks
export const getWalletBalance = createAsyncThunk(
  'wallet/getBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockApiService.getWalletBalance();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch wallet balance');
    }
  }
);

export const getTransactionHistory = createAsyncThunk(
  'wallet/getTransactionHistory',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await mockApiService.getTransactionHistory(page, limit);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch transaction history');
    }
  }
);

export const depositFunds = createAsyncThunk(
  'wallet/depositFunds',
  async (paymentDetails, { rejectWithValue, dispatch }) => {
    try {
      const response = await mockApiService.depositFunds(paymentDetails);
      
      // Refresh wallet balance after successful deposit
      if (response.success) {
        dispatch(getWalletBalance());
      }
      
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to process deposit');
    }
  }
);

export const withdrawFunds = createAsyncThunk(
  'wallet/withdrawFunds',
  async (withdrawalDetails, { rejectWithValue, dispatch }) => {
    try {
      const response = await mockApiService.withdrawFunds(withdrawalDetails);
      
      // Refresh wallet balance after successful withdrawal
      if (response.success) {
        dispatch(getWalletBalance());
      }
      
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to process withdrawal');
    }
  }
);

// Initial state
const initialState = {
  balance: 0,
  transactions: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Create slice
const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    resetWalletState: () => initialState,
    updateWalletBalance: (state, action) => {
      state.balance = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    // getWalletBalance
    builder.addCase(getWalletBalance.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getWalletBalance.fulfilled, (state, action) => {
      state.isLoading = false;
      state.balance = action.payload.balance;
      state.lastUpdated = new Date().toISOString();
    });
    builder.addCase(getWalletBalance.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Failed to fetch wallet balance';
    });

    // getTransactionHistory
    builder.addCase(getTransactionHistory.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getTransactionHistory.fulfilled, (state, action) => {
      state.isLoading = false;
      state.transactions = action.payload.transactions;
      state.pagination = {
        currentPage: action.payload.currentPage,
        totalPages: action.payload.totalPages,
        totalItems: action.payload.totalItems,
      };
    });
    builder.addCase(getTransactionHistory.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Failed to fetch transaction history';
    });

    // depositFunds
    builder.addCase(depositFunds.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(depositFunds.fulfilled, (state, action) => {
      state.isLoading = false;
      // Add new transaction to the list if it exists
      if (action.payload.transaction) {
        state.transactions = [action.payload.transaction, ...state.transactions];
      }
    });
    builder.addCase(depositFunds.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Failed to process deposit';
    });

    // withdrawFunds
    builder.addCase(withdrawFunds.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(withdrawFunds.fulfilled, (state, action) => {
      state.isLoading = false;
      // Add new transaction to the list if it exists
      if (action.payload.transaction) {
        state.transactions = [action.payload.transaction, ...state.transactions];
      }
    });
    builder.addCase(withdrawFunds.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Failed to process withdrawal';
    });
  },
});

export const { resetWalletState, updateWalletBalance } = walletSlice.actions;
export default walletSlice.reducer;
