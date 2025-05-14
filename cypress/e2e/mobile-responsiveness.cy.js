// cypress/e2e/mobile-responsiveness.cy.js - Mobile tests
describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    cy.login();
    // Set viewport to mobile size
    cy.viewport('iphone-x');
  });

  it('should display mobile navigation', () => {
    cy.visit('/dashboard');
    
    // Verify mobile navigation is displayed
    cy.get('[data-testid="mobile-nav"]').should('be.visible');
    cy.get('[data-testid="desktop-nav"]').should('not.be.visible');
    
    // Verify hamburger menu works
    cy.get('[data-testid="menu-button"]').click();
    cy.get('[data-testid="mobile-menu"]').should('be.visible');
    
    // Navigate to another page
    cy.get('[data-testid="mobile-menu-link-portfolio"]').click();
    cy.url().should('include', '/portfolio');
    
    // Menu should close after navigation
    cy.get('[data-testid="mobile-menu"]').should('not.be.visible');
  });

  it('should display trading interface in mobile view', () => {
    // Intercept market data
    cy.intercept('GET', '/api/v1/market/data/*', { fixture: 'marketData.json' }).as('getMarketData');
    
    cy.visit('/dashboard/trading');
    cy.wait('@getMarketData');
    
    // Verify tabs are displayed
    cy.get('[data-testid="mobile-tabs"]').should('be.visible');
    
    // Chart should be displayed by default
    cy.get('[data-testid="stock-chart"]').should('be.visible');
    cy.get('[data-testid="trading-widget"]').should('not.be.visible');
    
    // Switch to trading tab
    cy.get('[data-testid="mobile-tab-trade"]').click();
    
    // Trading widget should be displayed
    cy.get('[data-testid="trading-widget"]').should('be.visible');
    cy.get('[data-testid="stock-chart"]').should('not.be.visible');
    
    // Place an order on mobile
    cy.get('[data-testid="order-type-selector"]').click();
    cy.get('[data-testid="order-type-MARKET"]').click();
    cy.get('[data-testid="side-BUY"]').click();
    cy.get('[data-testid="quantity-input"]').clear().type('5');
    
    // Intercept order placement
    cy.intercept('POST', '/api/v1/trading/order', {
      statusCode: 200,
      body: {
        id: 'order_mobile_123',
        status: 'PENDING',
        symbol: 'AAPL',
        orderType: 'MARKET',
        side: 'BUY',
        quantity: 5
      }
    }).as('placeOrder');
    
    cy.get('[data-testid="place-order-button"]').click();
    
    // Confirm in modal
    cy.get('[data-testid="confirm-order-modal"]').should('be.visible');
    cy.get('[data-testid="confirm-order-button"]').click();
    
    cy.wait('@placeOrder');
    cy.get('[data-testid="order-success-message"]').should('be.visible');
  });

  it('should display portfolio in mobile view', () => {
    // Intercept portfolio data
    cy.intercept('GET', '/api/v1/portfolio', { fixture: 'userPortfolio.json' }).as('getPortfolio');
    
    cy.visit('/dashboard/portfolio');
    cy.wait('@getPortfolio');
    
    // Verify portfolio summary is displayed
    cy.get('[data-testid="mobile-portfolio-summary"]').should('be.visible');
    
    // Verify holdings list is displayed
    cy.get('[data-testid="holdings-list"]').should('be.visible');
    
    // Click on a holding to see details
    cy.get('[data-testid="holding-item"]').first().click();
    
    // Holding details should be displayed
    cy.get('[data-testid="holding-detail-view"]').should('be.visible');
    
    // Go back to list
    cy.get('[data-testid="back-button"]').click();
    
    // List should be visible again
    cy.get('[data-testid="holdings-list"]').should('be.visible');
  });

  it('should have touch-friendly controls', () => {
    cy.visit('/dashboard/watchlist');
    
    // Swipe to remove functionality
    cy.get('[data-testid="watchlist-item"]').first()
      .trigger('touchstart', { touches: [{ clientX: 300, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 100, clientY: 100 }] })
      .trigger('touchend');
    
    // Delete button should appear after swipe
    cy.get('[data-testid="swipe-delete-button"]').should('be.visible');
    
    // Tap delete button
    cy.get('[data-testid="swipe-delete-button"]').click();
    
    // Confirm deletion
    cy.get('[data-testid="confirm-delete-modal"]').should('be.visible');
    cy.get('[data-testid="confirm-delete-button"]').click();
    
    // Pull to refresh functionality
    cy.get('[data-testid="watchlist-container"]')
      .trigger('touchstart', { touches: [{ clientX: 200, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 200, clientY: 300 }] })
      .trigger('touchend');
    
    // Refresh indicator should be visible
    cy.get('[data-testid="refresh-indicator"]').should('be.visible');
  });
});
