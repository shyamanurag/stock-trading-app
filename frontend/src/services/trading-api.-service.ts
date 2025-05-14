/**
 * Trading API Service for interacting with the backend
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API response interface
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Order interfaces
export interface OrderRequest {
  symbol: string;
  exchange: string;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  product: 'CNC' | 'MIS' | 'NRML';
  validity?: 'DAY' | 'IOC' | 'GTC';
  disclosedQuantity?: number;
  tag?: string;
}

export interface Order {
  id: string;
  userId: string;
  symbol: string;
  exchange: string;
  quantity: number;
  filledQuantity: number;
  remainingQty: number;
  price?: number;
  triggerPrice?: number;
  type: string;
  side: string;
  status: string;
  product: string;
  orderType: string;
  validity: string;
  tag?: string;
  exchangeOrderId?: string;
  message?: string;
  averagePrice?: number;
  createdAt: string;
  updatedAt: string;
}

// Watchlist interfaces
export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistCreateRequest {
  name: string;
  symbols: string[];
  isDefault?: boolean;
}

// Portfolio interfaces
export interface Portfolio {
  id: string;
  userId: string;
  totalValue: number;
  totalInvestment: number;
  totalPL: number;
  totalPLPercent: number;
  dayPL: number;
  dayPLPercent: number;
  lastUpdateTime: string;
  holdings: Holding[];
}

export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  exchange: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  investment: number;
  pl: number;
  plPercent: number;
  dayChange: number;
  dayChangePercent: number;
  product: string;
  lastUpdateTime: string;
}

// Market data interfaces
export interface MarketQuote {
  symbol: string;
  exchange: string;
  lastPrice: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  bid?: number;
  bidQty?: number;
  ask?: number;
  askQty?: number;
  marketStatus: string;
  lastUpdateTime: string;
}

export interface HistoricalDataRequest {
  symbol: string;
  exchange: string;
  interval: string;
  from: string | Date;
  to: string | Date;
}

export interface OHLC {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalData {
  symbol: string;
  exchange: string;
  interval: string;
  candles: OHLC[];
}

// Fund interfaces
export interface FundBalance {
  userId: string;
  balance: number;
  blockedAmount: number;
  available: number;
  currency: string;
  lastUpdated: string;
}

export interface PaymentRequest {
  amount: number;
  method: string;
  currency?: string;
  returnUrl?: string;
  description?: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  type: string;
  method: string;
  status: string;
  reference?: string;
  gatewayResponse?: any;
  createdAt: string;
  updatedAt: string;
}

// User interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  otpCode?: string;
  deviceInfo?: any;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  referralCode?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class TradingApiService {
  private api: AxiosInstance;
  private refreshTokenRequest: Promise<AxiosResponse<ApiResponse<AuthResponse>>> | null = null;
  
  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor to handle 401 errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If the error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry && this.getRefreshToken()) {
          originalRequest._retry = true;
          
          try {
            // Only make one refresh token request at a time
            if (!this.refreshTokenRequest) {
              this.refreshTokenRequest = this.api.post<ApiResponse<AuthResponse>>('/auth/refresh', {
                refreshToken: this.getRefreshToken()
              });
            }
            
            const response = await this.refreshTokenRequest;
            this.refreshTokenRequest = null;
            
            if (response.data.success && response.data.data) {
              const { accessToken, refreshToken } = response.data.data;
              
              // Save the new tokens
              this.saveToken(accessToken);
              this.saveRefreshToken(refreshToken);
              
              // Retry the original request with the new token
              originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.refreshTokenRequest = null;
            
            // If refresh fails, log out the user
            this.logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // Authentication methods
  public async login(loginData: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/login', loginData);
      
      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken } = response.data.data;
        this.saveToken(accessToken);
        this.saveRefreshToken(refreshToken);
      }
      
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async register(registerData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/register', registerData);
      
      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken } = response.data.data;
        this.saveToken(accessToken);
        this.saveRefreshToken(refreshToken);
      }
      
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/refresh', {
        refreshToken
      });
      
      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        this.saveToken(accessToken);
        this.saveRefreshToken(newRefreshToken);
      }
      
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    
    // Optionally send a logout request to the server
    this.api.post('/auth/logout').catch(() => {
      // Ignore errors during logout
    });
  }
  
  public isAuthenticated(): boolean {
    return !!this.getToken();
  }
  
  // Order methods
  public async placeOrder(orderData: OrderRequest): Promise<ApiResponse<Order>> {
    try {
      const response = await this.api.post<ApiResponse<Order>>('/orders', orderData);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async getOrders(params?: { status?: string, from?: string, to?: string }): Promise<ApiResponse<Order[]>> {
    try {
      const response = await this.api.get<ApiResponse<Order[]>>('/orders', { params });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async getOrderDetails(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await this.api.get<ApiResponse<Order>>(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async cancelOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await this.api.delete<ApiResponse<Order>>(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  // Watchlist methods
  public async getWatchlists(): Promise<ApiResponse<Watchlist[]>> {
    try {
      const response = await this.api.get<ApiResponse<Watchlist[]>>('/watchlist');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async createWatchlist(watchlistData: WatchlistCreateRequest): Promise<ApiResponse<Watchlist>> {
    try {
      const response = await this.api.post<ApiResponse<Watchlist>>('/watchlist', watchlistData);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async updateWatchlist(id: string, watchlistData: Partial<WatchlistCreateRequest>): Promise<ApiResponse<Watchlist>> {
    try {
      const response = await this.api.put<ApiResponse<Watchlist>>(`/watchlist/${id}`, watchlistData);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async deleteWatchlist(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.delete<ApiResponse<any>>(`/watchlist/${id}`);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  // Portfolio methods
  public async getPortfolio(): Promise<ApiResponse<Portfolio>> {
    try {
      const response = await this.api.get<ApiResponse<Portfolio>>('/portfolio');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async getHoldings(): Promise<ApiResponse<Holding[]>> {
    try {
      const response = await this.api.get<ApiResponse<Holding[]>>('/portfolio/holdings');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  // Market data methods
  public async getQuote(symbol: string, exchange: string): Promise<ApiResponse<MarketQuote>> {
    try {
      const response = await this.api.get<ApiResponse<MarketQuote>>('/market/quote', {
        params: { symbol, exchange }
      });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async getHistoricalData(request: HistoricalDataRequest): Promise<ApiResponse<HistoricalData>> {
    try {
      const response = await this.api.get<ApiResponse<HistoricalData>>('/market/history', {
        params: request
      });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  // Fund methods
  public async getFundBalance(): Promise<ApiResponse<FundBalance>> {
    try {
      const response = await this.api.get<ApiResponse<FundBalance>>('/payment/balance');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async initiateDeposit(depositData: PaymentRequest): Promise<ApiResponse<Payment>> {
    try {
      const response = await this.api.post<ApiResponse<Payment>>('/payment/deposit', depositData);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async initiateWithdrawal(withdrawalData: PaymentRequest): Promise<ApiResponse<Payment>> {
    try {
      const response = await this.api.post<ApiResponse<Payment>>('/payment/withdraw', withdrawalData);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  public async getTransactions(params?: { type?: string, from?: string, to?: string }): Promise<ApiResponse<Payment[]>> {
    try {
      const response = await this.api.get<ApiResponse<Payment[]>>('/payment/transactions', { params });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  // User profile methods
  public async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get<ApiResponse<User>>('/user/profile');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }
  
  // Helper methods
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }
  
  private saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }
  
  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }
  
  private saveRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', token);
    }
  }
  
  private handleError(error: any): ApiResponse<any> {
    if (error.response?.data) {
      // If the server returned a response with an error
      return error.response.data as ApiResponse<any>;
    }
    
    // Generic error
    return {
      data: null,
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

// Export a singleton instance
export const tradingApiService = new TradingApiService();
export default tradingApiService;
