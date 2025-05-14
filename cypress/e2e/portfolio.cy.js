// cypress/e2e/portfolio.cy.js - Portfolio tests
describe('Portfolio', () => {
  beforeEach(() => {
    cy.login();
    
    // Intercept portfolio data
    cy.intercept('GET', '/api/v1/portfolio', { fixture: 'userPortfolio.json' }).as('getPortfolio');
  });

  it('should display portfolio holdings', () => {
    cy.visit('/dashboard/portfolio');
    cy.wait('@getPortfolio');
    
    // Verify portfolio summary is displayed
    cy.get('[data-testid="portfolio-value"]').should('contain', '$125,650.75');
    cy.get('[data-testid="cash-balance"]').should('contain', '$15,000.50');
    cy.get('[data-testid="day-change"]').should('contain', '+$1,250.25 (1.05%)');
    
    // Verify holdings are displayed
    cy.get('[data-testid="holding-row"]').should('have.length', 3);
    cy.get('[data-testid="holding-row"]').first().should('contain', 'AAPL');
    cy.get('[data-testid="holding-row"]').first().should('contain', '100');
    cy.get('[data-testid="holding-row"]').first().should('contain', '$17,525.00');
  });

  it('should allow quick trading from portfolio page', () => {
    cy.visit('/dashboard/portfolio');
    cy.wait('@getPortfolio');
    
    // Click quick trade button for a holding
    cy.get('[data-testid="holding-row"]').first().find('[data-testid="quick-trade-button"]').click();
    
    // Verify trading widget is displayed with the correct symbol
    cy.get('[data-testid="trading-widget-modal"]').should('be.visible');
    cy.get('[data-testid="selected-symbol"]').should('contain', 'AAPL');
    
    // Enter order details
    cy.get('[data-testid="order-type-selector"]').click();
    cy.get('[data-testid="order-type-MARKET"]').click();
    cy.get('[data-testid="side-SELL"]').click();
    cy.get('[data-testid="quantity-input"]').clear().type('10');
    
    // Intercept the order placement API call
    cy.intercept('POST', '/api/v1/trading/order', {
      statusCode: 200,
      body: {
        id: 'ord_sell12345',
        status: 'PENDING',
        symbol: 'AAPL',
        orderType: 'MARKET',
        side: 'SELL',
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
  });

  it('should display portfolio performance charts', () => {
    // Intercept portfolio performance data
    cy.intercept('GET', '/api/v1/portfolio/performance', {
      statusCode: 200,
      body: {
        timeRanges: ['1D', '1W', '1M', '3M', '1Y', 'YTD', 'ALL'],
        currentRange: '1M',
        data: [
          { date: '2025-04-13', value: 118500.25 },
          { date: '2025-04-20', value: 120150.75 },
          { date: '2025-04-27', value: 122300.50 },
          { date: '2025-05-04', value: 123500.25 },
          { date: '2025-05-11', value: 124800.50 },
          { date: '2025-05-13', value: 125650.75 }
        ]
      }
    }).as('getPerformance');
    
    cy.visit('/dashboard/portfolio');
    cy.wait('@getPortfolio');
    cy.wait('@getPerformance');
    
    // Verify chart is displayed
    cy.get('[data-testid="portfolio-chart"]').should('be.visible');
    
    // Change time range
    cy.get('[data-testid="timerange-selector"]').contains('1Y').click();
    
    // Verify API is called with new time range
    cy.wait('@getPerformance');
  });

  it('should allow adding funds to portfolio', () => {
    cy.visit('/dashboard/portfolio');
    cy.wait('@getPortfolio');
    
    // Click add funds button
    cy.get('[data-testid="add-funds-button"]').click();
    
    // Verify deposit modal is displayed
    cy.get('[data-testid="deposit-modal"]').should('be.visible');
    
    // Enter deposit amount
    cy.get('[data-testid="deposit-amount-input"]').clear().type('5000');
    
    // Select payment method
    cy.get('[data-testid="payment-method-selector"]').click();
    cy.get('[data-testid="payment-method-BANK_TRANSFER"]').click();
    
    // Intercept the deposit API call
    cy.intercept('POST', '/api/v1/wallet/deposit', {
      statusCode: 200,
      body: {
        id: 'dep_123456',
        amount: 5000,
        status: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        createdAt: '2025-05-13T11:30:45Z'
      }
    }).as('depositFunds');
    
    // Submit deposit
    cy.get('[data-testid="submit-deposit-button"]').click();
    
    // Wait for API call and verify
    cy.wait('@depositFunds');
    cy.get('[data-testid="deposit-success-message"]').should('be.visible');
  });
});
