// cypress/e2e/trading-flow.cy.js - Trading flow tests
describe('Trading Flow', () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('GET', '/api/v1/market/data/*', { fixture: 'marketData.json' }).as('getMarketData');
  });

  it('should allow placing a market order', () => {
    cy.visit('/dashboard/trading');
    cy.wait('@getMarketData');
    
    // Select a stock
    cy.selectSymbol('AAPL');
    
    // Enter order details
    cy.get('[data-testid="order-type-selector"]').click();
    cy.get('[data-testid="order-type-MARKET"]').click();
    cy.get('[data-testid="side-BUY"]').click();
    cy.get('[data-testid="quantity-input"]').clear().type('10');
    
    // Intercept the order placement API call
    cy.intercept('POST', '/api/v1/trading/order', {
      statusCode: 200,
      body: {
        id: 'ord_123456789',
        status: 'PENDING',
        symbol: 'AAPL',
        orderType: 'MARKET',
        side: 'BUY',
        quantity: 10
      }
    }).as('placeOrder');
    
    // Submit order
    cy.get('[data-testid="place-order-button"]').click();
    
    // Confirm order in modal
    cy.get('[data-testid="confirm-order-modal"]').should('be.visible');
    cy.get('[data-testid="confirm-order-button"]').click();
    
    // Wait for API call and verify
    cy.wait('@placeOrder');
    cy.get('[data-testid="order-success-message"]').should('be.visible');
    cy.get('[data-testid="order-id"]').should('contain', 'ord_123456789');
  });

  it('should allow placing a limit order', () => {
    cy.visit('/dashboard/trading');
    cy.wait('@getMarketData');
    
    // Select a stock
    cy.selectSymbol('AAPL');
    
    // Enter order details
    cy.get('[data-testid="order-type-selector"]').click();
    cy.get('[data-testid="order-type-LIMIT"]').click();
    cy.get('[data-testid="side-BUY"]').click();
    cy.get('[data-testid="quantity-input"]').clear().type('15');
    cy.get('[data-testid="price-input"]').clear().type('170.50');
    
    // Intercept the order placement API call
    cy.intercept('POST', '/api/v1/trading/order', {
      statusCode: 200,
      body: {
        id: 'ord_987654321',
        status: 'PENDING',
        symbol: 'AAPL',
        orderType: 'LIMIT',
        side: 'BUY',
        quantity: 15,
        price: 170.50
      }
    }).as('placeOrder');
    
    // Submit order
    cy.get('[data-testid="place-order-button"]').click();
    
    // Confirm order in modal
    cy.get('[data-testid="confirm-order-modal"]').should('be.visible');
    cy.get('[data-testid="confirm-order-button"]').click();
    
    // Wait for API call and verify
    cy.wait('@placeOrder');
    cy.get('[data-testid="order-success-message"]').should('be.visible');
    cy.get('[data-testid="order-id"]').should('contain', 'ord_987654321');
  });

  it('should display order history', () => {
    // Intercept the order history API call
    cy.intercept('GET', '/api/v1/trading/orders', {
      statusCode: 200,
      body: [
        {
          id: 'ord_123456789',
          status: 'FILLED',
          symbol: 'AAPL',
          orderType: 'MARKET',
          side: 'BUY',
          quantity: 10,
          filledQuantity: 10,
          price: null,
          executedPrice: 175.25,
          createdAt: '2025-05-12T14:30:45Z',
          executedAt: '2025-05-12T14:30:46Z'
        },
        {
          id: 'ord_987654321',
          status: 'PENDING',
          symbol: 'MSFT',
          orderType: 'LIMIT',
          side: 'BUY',
          quantity: 15,
          filledQuantity: 0,
          price: 300.50,
          createdAt: '2025-05-13T09:15:30Z'
        }
      ]
    }).as('getOrderHistory');
    
    // Navigate to order history
    cy.visit('/dashboard/orders');
    cy.wait('@getOrderHistory');
    
    // Verify orders are displayed
    cy.get('[data-testid="order-row"]').should('have.length', 2);
    cy.get('[data-testid="order-row"]').first().should('contain', 'AAPL');
    cy.get('[data-testid="order-row"]').first().should('contain', 'FILLED');
    cy.get('[data-testid="order-row"]').eq(1).should('contain', 'MSFT');
    cy.get('[data-testid="order-row"]').eq(1).should('contain', 'PENDING');
  });

  it('should allow cancelling a pending order', () => {
    // Intercept the order history API call
    cy.intercept('GET', '/api/v1/trading/orders', {
      statusCode: 200,
      body: [
        {
          id: 'ord_987654321',
          status: 'PENDING',
          symbol: 'MSFT',
          orderType: 'LIMIT',
          side: 'BUY',
          quantity: 15,
          filledQuantity: 0,
          price: 300.50,
          createdAt: '2025-05-13T09:15:30Z'
        }
      ]
    }).as('getOrderHistory');
    
    // Intercept the cancel order API call
    cy.intercept('POST', '/api/v1/trading/order/*/cancel', {
      statusCode: 200,
      body: {
        id: 'ord_987654321',
        status: 'CANCELLED',
        symbol: 'MSFT',
        orderType: 'LIMIT',
        side: 'BUY',
        quantity: 15,
        filledQuantity: 0,
        price: 300.50,
        createdAt: '2025-05-13T09:15:30Z',
        cancelledAt: '2025-05-13T10:45:20Z'
      }
    }).as('cancelOrder');
    
    // Navigate to order history
    cy.visit('/dashboard/orders');
    cy.wait('@getOrderHistory');
    
    // Click cancel button for the pending order
    cy.get('[data-testid="cancel-order-button"]').click();
    
    // Confirm cancellation in modal
    cy.get('[data-testid="confirm-cancel-modal"]').should('be.visible');
    cy.get('[data-testid="confirm-cancel-button"]').click();
    
    // Wait for API call and verify
    cy.wait('@cancelOrder');
    cy.get('[data-testid="order-success-message"]').should('be.visible');
    cy.get('[data-testid="order-row"]').first().should('contain', 'CANCELLED');
  });
});
