// k6 Load Testing Framework for Stock Trading App
// File: k6-tests/load-test-config.js

import { check, sleep } from 'k6';
import http from 'k6/http';
import { WebSocket } from 'k6/experimental/websockets';
import { SharedArray } from 'k6/data';
import { Trend, Counter, Rate, Gauge } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics
const wsConnectFailRate = new Rate('ws_connect_failures');
const wsMessageRate = new Rate('ws_message_rate');
const orderResponseTime = new Trend('order_response_time');
const marketDataResponseTime = new Trend('market_data_response_time');
const dashboardLoadTime = new Trend('dashboard_load_time');
const tradePlacementTime = new Trend('trade_placement_time');
const dbQueryCounter = new Counter('db_queries');
const activeConnections = new Gauge('active_connections');
const loginSuccessRate = new Rate('login_success');

// Load test configuration
export const options = {
  // Test scenarios
  scenarios: {
    // Scenario 1: UI Browsing
    browser: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '2m', target: 500 },    // Ramp up to 500 users
        { duration: '5m', target: 500 },    // Stay at 500 users
        { duration: '2m', target: 1000 },   // Ramp up to 1000 users
        { duration: '5m', target: 1000 },   // Stay at 1000 users
        { duration: '2m', target: 0 },      // Ramp down to 0 users
      ],
      env: { SCENARIO: 'browser' },
      tags: { type: 'browser' },
    },
    
    // Scenario 2: WebSocket Real-time Data
    websocket: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '2m', target: 1000 },   // Ramp up to 1000 users
        { duration: '5m', target: 1000 },   // Stay at 1000 users
        { duration: '2m', target: 5000 },   // Ramp up to 5000 users
        { duration: '5m', target: 5000 },   // Stay at 5000 users
        { duration: '3m', target: 10000 },  // Ramp up to max target of 10000 users
        { duration: '5m', target: 10000 },  // Stay at max for 5 minutes
        { duration: '2m', target: 0 },      // Ramp down to 0 users
      ],
      env: { SCENARIO: 'websocket' },
      tags: { type: 'websocket' },
    },
    
    // Scenario 3: Trading
    trading: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      maxVUs: 1000,
      stages: [
        { duration: '2m', target: 50 },     // Ramp up to 50 requests per second
        { duration: '5m', target: 50 },     // Stay at 50 requests per second
        { duration: '2m', target: 200 },    // Ramp up to 200 requests per second
        { duration: '5m', target: 200 },    // Stay at 200 requests per second
        { duration: '2m', target: 0 },      // Ramp down to 0 requests
      ],
      env: { SCENARIO: 'trading' },
      tags: { type: 'trading' },
    },
    
    // Scenario 4: Admin Operations
    admin: {
      executor: 'constant-vus',
      vus: 10,
      duration: '15m',
      env: { SCENARIO: 'admin' },
      tags: { type: 'admin' },
    },
  },
  
  // Global thresholds
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    ws_connect_failures: ['rate<0.01'],
    ws_message_rate: ['rate>0.9'],
    order_response_time: ['p(95)<300'],
    market_data_response_time: ['p(95)<200'],
    dashboard_load_time: ['p(95)<600'],
    login_success: ['rate>0.99'],
  },
};

// Test data
const stocks = new SharedArray('stocks', function() {
  return [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'UNH', name: 'UnitedHealth Group Incorporated' },
    // Add more stocks as needed
  ];
});

const users = new SharedArray('users', function() {
  return Array(1000).fill(0).map((_, i) => {
    return {
      username: `testuser${i}`,
      password: 'Password123!',
      email: `testuser${i}@example.com`,
    };
  });
});

// Helper functions
function getRandomStock() {
  return stocks[Math.floor(Math.random() * stocks.length)];
}

function getRandomUser() {
  return users[Math.floor(Math.random() * users.length)];
}

function getRandomOrderType() {
  const types = ['market', 'limit', 'stop', 'stop_limit'];
  return types[Math.floor(Math.random() * types.length)];
}

function getRandomOrderSide() {
  return Math.random() > 0.5 ? 'buy' : 'sell';
}

// Main function
export default function() {
  // Determine which scenario to execute
  const scenario = __ENV.SCENARIO;
  
  switch(scenario) {
    case 'browser':
      simulateBrowserUser();
      break;
    case 'websocket':
      simulateWebSocketUser();
      break;
    case 'trading':
      simulateTrader();
      break;
    case 'admin':
      simulateAdminUser();
      break;
    default:
      simulateBrowserUser();
  }
}

// Authentication for API requests
function authenticateUser() {
  const user = getRandomUser();
  const loginPayload = JSON.stringify({
    username: user.username,
    password: user.password,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const loginResponse = http.post(`${__ENV.API_URL}/auth/login`, loginPayload, params);
  loginSuccessRate.add(loginResponse.status === 200);
  
  if (loginResponse.status !== 200) {
    console.error(`Login failed: ${loginResponse.status} ${loginResponse.body}`);
    return null;
  }
  
  const authToken = JSON.parse(loginResponse.body).token;
  return authToken;
}

// Scenario 1: UI Browsing
function simulateBrowserUser() {
  // Simulate a user browsing the UI
  const authToken = authenticateUser();
  
  if (!authToken) {
    sleep(randomIntBetween(1, 3));
    return;
  }
  
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  // Load dashboard
  const startTime = new Date();
  const dashboardResponse = http.get(`${__ENV.APP_URL}/dashboard`, params);
  dashboardLoadTime.add(new Date() - startTime);
  
  check(dashboardResponse, {
    'dashboard loaded': (r) => r.status === 200,
  });
  
  // Browse watchlist
  http.get(`${__ENV.APP_URL}/watchlist`, params);
  sleep(randomIntBetween(1, 5));
  
  // View portfolio
  http.get(`${__ENV.APP_URL}/portfolio`, params);
  sleep(randomIntBetween(1, 5));
  
  // View specific stock
  const stock = getRandomStock();
  http.get(`${__ENV.APP_URL}/stocks/${stock.symbol}`, params);
  sleep(randomIntBetween(1, 5));
  
  // Random navigation pattern
  const pages = [
    '/dashboard',
    '/watchlist',
    '/portfolio',
    `/stocks/${getRandomStock().symbol}`,
    '/options',
    '/futures',
    '/account',
    '/market-overview',
  ];
  
  for (let i = 0; i < randomIntBetween(3, 8); i++) {
    const randomPage = pages[Math.floor(Math.random() * pages.length)];
    http.get(`${__ENV.APP_URL}${randomPage}`, params);
    sleep(randomIntBetween(1, 5));
  }
}

// Scenario 2: WebSocket User
function simulateWebSocketUser() {
  const authToken = authenticateUser();
  
  if (!authToken) {
    wsConnectFailRate.add(1);
    sleep(randomIntBetween(1, 3));
    return;
  }
  
  // Connect to WebSocket
  const ws = new WebSocket(`${__ENV.WS_URL}?token=${authToken}`);
  let socketClosed = false;
  let messageCount = 0;
  
  ws.onopen = () => {
    activeConnections.add(1);
    wsConnectFailRate.add(0);
    
    // Subscribe to market data for random stocks
    const subscriptions = [];
    const numStocks = randomIntBetween(1, 5);
    
    for (let i = 0; i < numStocks; i++) {
      const stock = getRandomStock();
      subscriptions.push(stock.symbol);
    }
    
    const subscribeMsg = JSON.stringify({
      action: 'subscribe',
      topics: subscriptions.map(sym => `market-data.${sym}`),
    });
    
    ws.send(subscribeMsg);
  };
  
  ws.onmessage = (event) => {
    messageCount++;
    wsMessageRate.add(1);
    
    // Occasionally send a ping to keep connection alive
    if (messageCount % 10 === 0) {
      ws.send(JSON.stringify({ action: 'ping' }));
    }
    
    // Occasionally change subscriptions
    if (messageCount % 20 === 0 && Math.random() > 0.7) {
      const stock = getRandomStock();
      const action = Math.random() > 0.5 ? 'subscribe' : 'unsubscribe';
      
      ws.send(JSON.stringify({
        action: action,
        topics: [`market-data.${stock.symbol}`],
      }));
    }
  };
  
  ws.onclose = () => {
    activeConnections.add(-1);
    socketClosed = true;
  };
  
  ws.onerror = (e) => {
    console.error('WebSocket error: ', e);
    wsConnectFailRate.add(1);
    socketClosed = true;
  };
  
  // Keep the WebSocket connection alive for the duration of the test
  sleep(randomIntBetween(30, 300)); // Between 30 seconds and 5 minutes
  
  if (!socketClosed) {
    ws.close();
  }
}

// Scenario 3: Trading
function simulateTrader() {
  const authToken = authenticateUser();
  
  if (!authToken) {
    sleep(randomIntBetween(1, 3));
    return;
  }
  
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  // Get market data for a random stock
  const stock = getRandomStock();
  const startTime = new Date();
  const marketDataResponse = http.get(`${__ENV.API_URL}/market-data/${stock.symbol}`, params);
  marketDataResponseTime.add(new Date() - startTime);
  
  check(marketDataResponse, {
    'market data retrieved': (r) => r.status === 200,
  });
  
  // Simulate looking at data before trading
  sleep(randomIntBetween(1, 5));
  
  // Place an order
  const orderPayload = JSON.stringify({
    symbol: stock.symbol,
    type: getRandomOrderType(),
    side: getRandomOrderSide(),
    quantity: randomIntBetween(1, 100),
    price: marketDataResponse.status === 200 
      ? JSON.parse(marketDataResponse.body).price * (Math.random() * 0.1 + 0.95) // +/- 5%
      : 100.0, // Default if market data couldn't be retrieved
    client_order_id: uuidv4(),
  });
  
  const orderStartTime = new Date();
  const orderResponse = http.post(`${__ENV.API_URL}/orders`, orderPayload, params);
  tradePlacementTime.add(new Date() - orderStartTime);
  orderResponseTime.add(new Date() - orderStartTime);
  
  check(orderResponse, {
    'order placed successfully': (r) => r.status === 201 || r.status === 200,
  });
  
  // Check order status
  if (orderResponse.status === 200 || orderResponse.status === 201) {
    const orderId = JSON.parse(orderResponse.body).id;
    http.get(`${__ENV.API_URL}/orders/${orderId}`, params);
  }
  
  // Randomly get portfolio
  if (Math.random() > 0.7) {
    http.get(`${__ENV.API_URL}/portfolio`, params);
  }
  
  // Randomly cancel an order
  if (Math.random() > 0.8 && orderResponse.status === 200) {
    const orderId = JSON.parse(orderResponse.body).id;
    http.delete(`${__ENV.API_URL}/orders/${orderId}`, null, params);
  }
  
  sleep(randomIntBetween(1, 5));
}

// Scenario 4: Admin User
function simulateAdminUser() {
  // Admin credentials would be different and more limited in number
  const adminPayload = JSON.stringify({
    username: `admin${randomIntBetween(1, 5)}`,
    password: 'AdminPassword123!',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const loginResponse = http.post(`${__ENV.API_URL}/auth/admin/login`, adminPayload, params);
  
  if (loginResponse.status !== 200) {
    sleep(randomIntBetween(1, 3));
    return;
  }
  
  const authToken = JSON.parse(loginResponse.body).token;
  
  const adminParams = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  // Simulate admin operations
  
  // View users
  http.get(`${__ENV.API_URL}/admin/users?page=1&limit=50`, adminParams);
  sleep(randomIntBetween(1, 3));
  
  // View transactions
  http.get(`${__ENV.API_URL}/admin/transactions?page=1&limit=50`, adminParams);
  sleep(randomIntBetween(1, 3));
  
  // View pending KYC verifications
  http.get(`${__ENV.API_URL}/admin/kyc/pending`, adminParams);
  sleep(randomIntBetween(1, 3));
  
  // Approve a random KYC
  if (Math.random() > 0.7) {
    const kycPayload = JSON.stringify({
      user_id: `user${randomIntBetween(1, 1000)}`,
      status: 'approved',
      comment: 'Verified through load test',
    });
    
    http.put(`${__ENV.API_URL}/admin/kyc/update`, kycPayload, adminParams);
  }
  
  // View system health
  http.get(`${__ENV.API_URL}/admin/system/health`, adminParams);
  sleep(randomIntBetween(1, 3));
}
