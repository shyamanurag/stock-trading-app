// cypress/e2e/watchlist.cy.js - Watchlist tests
describe('Watchlist', () => {
  beforeEach(() => {
    cy.login();
    
    // Intercept watchlist data
    cy.intercept('GET', '/api/v1/watchlist', {
      statusCode: 200,
      body: [
        {
          id: 'watchlist_123',
          name: 'Default',
          items: [
            {
              symbol: 'AAPL',
              lastPrice: 175.25,
              change: 2.15,
              changePercent: 1.24
            },
            {
              symbol: 'MSFT',
              lastPrice: 305.50,
              change: 1.75,
              changePercent: 0.58
            }
          ]
        },
        {
          id: 'watchlist_456',
          name: 'Tech Stocks',
          items: [
            {
              symbol: 'GOOGL',
              lastPrice: 1375.25,
              change: 15.75,
              changePercent: 1.16
            },
            {
              symbol: 'AMZN',
              lastPrice: 3300.50,
              change: -12.25,
              changePercent: -0.37
            }
          ]
        }
      ]
    }).as('getWatchlists');
    
    // Intercept market data
    cy.intercept('GET', '/api/v1/market/data/*', { fixture: 'marketData.json' }).as('getMarketData');
  });

  it('should display watchlists', () => {
    cy.visit('/dashboard/watchlist');
    cy.wait('@getWatchlists');
    
    // Verify watchlist tabs are displayed
    cy.get('[data-testid="watchlist-tab"]').should('have.length', 2);
    cy.get('[data-testid="watchlist-tab"]').first().should('contain', 'Default');
    cy.get('[data-testid="watchlist-tab"]').eq(1).should('contain', 'Tech Stocks');
    
    // Verify watchlist items are displayed
    cy.get('[data-testid="watchlist-item"]').should('have.length', 2);
    cy.get('[data-testid="watchlist-item"]').first().should('contain', 'AAPL');
    cy.get('[data-testid="watchlist-item"]').first().should('contain', '175.25');
    cy.get('[data-testid="watchlist-item"]').first().should('contain', '+1.24%');
  });

  it('should allow switching between watchlists', () => {
    cy.visit('/dashboard/watchlist');
    cy.wait('@getWatchlists');
    
    // Click on second watchlist tab
    cy.get('[data-testid="watchlist-tab"]').eq(1).click();
    
    // Verify correct watchlist items are displayed
    cy.get('[data-testid="watchlist-item"]').should('have.length', 2);
    cy.get('[data-testid="watchlist-item"]').first().should('contain', 'GOOGL');
    cy.get('[data-testid="watchlist-item"]').eq(1).should('contain', 'AMZN');
  });

  it('should allow creating a new watchlist', () => {
    // Intercept create watchlist API call
    cy.intercept('POST', '/api/v1/watchlist', {
      statusCode: 201,
      body: {
        id: 'watchlist_789',
        name: 'New Watchlist',
        items: []
      }
    }).as('createWatchlist');
    
    cy.visit('/dashboard/watchlist');
    cy.wait('@getWatchlists');
    
    // Click create watchlist button
    cy.get('[data-testid="create-watchlist-button"]').click();
    
    // Enter watchlist name
    cy.get('[data-testid="watchlist-name-input"]').type('New Watchlist');
    
    // Submit form
    cy.get('[data-testid="create-watchlist-submit"]').click();
    
    // Wait for API call and verify
    cy.wait('@createWatchlist');
    
    // Verify new watchlist is displayed
    cy.get('[data-testid="watchlist-tab"]').should('have.length', 3);
    cy.get('[data-testid="watchlist-tab"]').eq(2).should('contain', 'New Watchlist');
  });

  it('should allow adding a stock to watchlist', () => {
    // Intercept add to watchlist API call
    cy.intercept('POST', '/api/v1/watchlist/*/add', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('addToWatchlist');
    
    cy.visit('/dashboard/market');
    cy.wait('@getMarketData');
    
    // Search for a stock
    cy.selectSymbol('AAPL');
    
    // Click add to watchlist button
    cy.get('[data-testid="add-to-watchlist-button"]').click();
    
    // Select watchlist
    cy.get('[data-testid="watchlist-tech-stocks"]').click();
    
    // Wait for API call and verify
    cy.wait('@addToWatchlist');
    cy.get('[data-testid="add-success-message"]').should('be.visible');
  });

  it('should allow removing a stock from watchlist', () => {
    // Intercept remove from watchlist API call
    cy.intercept('DELETE', '/api/v1/watchlist/*/item/*', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('removeFromWatchlist');
    
    cy.visit('/dashboard/watchlist');
    cy.wait('@getWatchlists');
    
    // Click remove button for the first stock
    cy.get('[data-testid="watchlist-item"]').first().find('[data-testid="remove-from-watchlist"]').click();
    
    // Confirm removal
    cy.get('[data-testid="confirm-remove-modal"]').should('be.visible');
    cy.get('[data-testid="confirm-remove-button"]').click();
    
    // Wait for API call and verify
    cy.wait('@removeFromWatchlist');
    
    // Verify stock is removed
    cy.get('[data-testid="watchlist-item"]').should('have.length', 1);
    cy.get('[data-testid="watchlist-item"]').first().should('not.contain', 'AAPL');
  });
});
