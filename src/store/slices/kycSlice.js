// src/store/slices/kycSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock API service for development purposes
// Will be replaced with actual API calls in production
const mockApiService = {
  getKYCStatus: () => 
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'uploaded', // 'not_started', 'uploaded', 'pending', 'approved', 'rejected'
          documents: [
            {
              type: 'aadhar',
              uploadedAt: new Date().toISOString(),
              status: 'pending'
            }
          ],
          lastUpdated: new Date().toISOString(),
          rejectionReason: null
        });
      }, 500);
    }),
  
  uploadKYCDocument: (formData) => 
    new Promise((resolve) => {
      // Simulate processing time
      setTimeout(() => {
        // Extract data from FormData for demonstration
        const documentType = formData.get('documentType');
        
        resolve({
          success: true,
          document: {
            type: documentType,
            uploadedAt: new Date().toISOString(),
            status: 'pending'
          },
          message: 'Document uploaded successfully'
        });
      }, 1500);
    })
};

// Async thunks
export const getKYCStatus = createAsyncThunk(
  'kyc/getStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockApiService.getKYCStatus();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch KYC status');
    }
  }
);

export const uploadKYCDocument = createAsyncThunk(
  'kyc/uploadDocument',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await mockApiService.uploadKYCDocument(formData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to upload KYC document');
    }
  }
);

// Initial state
const initialState = {
  status: 'not_started', // 'not_started', 'uploaded', 'pending', 'approved', 'rejected'
  documents: [],
  rejectionReason: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Create slice
const kycSlice = createSlice({
  name: 'kyc',
  initialState,
  reducers: {
    resetKYCState: () => initialState,
    updateKYCStatus: (state, action) => {
      state.status = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    // getKYCStatus
    builder.addCase(getKYCStatus.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getKYCStatus.fulfilled, (state, action) => {
      state.isLoading = false;
      state.status = action.payload.status;
      state.documents = action.payload.documents || [];
      state.rejectionReason = action.payload.rejectionReason;
      state.lastUpdated = action.payload.lastUpdated || new Date().toISOString();
    });
    builder.addCase(getKYCStatus.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Failed to fetch KYC status';
    });

    // uploadKYCDocument
    builder.addCase(uploadKYCDocument.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(uploadKYCDocument.fulfilled, (state, action) => {
      state.isLoading = false;
      
      // Update status to 'uploaded' if it was 'not_started'
      if (state.status === 'not_started') {
        state.status = 'uploaded';
      }
      
      // Add the newly uploaded document to the documents array
      if (action.payload.document) {
        state.documents = [...state.documents, action.payload.document];
      }
      
      state.lastUpdated = new Date().toISOString();
    });
    builder.addCase(uploadKYCDocument.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Failed to upload KYC document';
    });
  },
});

export const { resetKYCState, updateKYCStatus } = kycSlice.actions;
export default kycSlice.reducer;
