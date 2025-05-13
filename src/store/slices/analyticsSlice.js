import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  performance: null,
  scenarios: [],
  volatilityData: [],
  isLoading: false,
  error: null
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    // Add reducers here
  },
  extraReducers: (builder) => {
    // Add extra reducers for async actions
  }
});

export default analyticsSlice.reducer;
