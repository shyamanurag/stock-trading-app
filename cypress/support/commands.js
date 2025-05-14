// cypress/support/commands.js
// Custom commands for Cypress tests

// Login command
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('[data-testid="email-input"]').type(email)
    cy.get('[data-testid="password-input"]').type(password)
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('include', '/dashboard')
  })
})

// Select a symbol in the trading interface
Cypress.Commands.add('selectSymbol', (symbol) => {
  cy.get('[data-testid="symbol-search"]').clear().type(symbol)
  cy.get(`[data-testid="search-result-${symbol}"]`).click()
  cy.get('[data-testid="selected-symbol"]').should('contain', symbol)
})

// Place a market order
Cypress.Commands.add('placeMarketOrder', (side, symbol, quantity) => {
  // First select the symbol
  cy.selectSymbol(symbol)
  
  // Select order type
  cy.get('[data-testid="order-type-selector"]').click()
  cy.get('[data-testid="order-type-MARKET"]').click()
  
  // Select side
  cy.get(`[data-testid="side-${side}"]`).click()
  
  // Enter quantity
  cy.get('[data-testid="quantity-input"]').clear().type(quantity)
  
  // Submit order
  cy.get('[data-testid="place-order-button"]').click()
})

// Add a stock to watchlist
Cypress.Commands.add('addToWatchlist', (symbol, watchlistName = 'Default') => {
  cy.selectSymbol(symbol)
  cy.get('[data-testid="add-to-watchlist-button"]').click()
  cy.get(`[data-testid="watchlist-${watchlistName}"]`).click()
  cy.get('[data-testid="watchlist-add-confirm"]').click()
})

// Navigate to a specific dashboard page
Cypress.Commands.add('navigateTo', (page) => {
  cy.get(`[data-testid="nav-link-${page}"]`).click()
  cy.url().should('include', `/${page}`)
})
