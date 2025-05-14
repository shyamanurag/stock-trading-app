// cypress/e2e/auth.cy.js - Authentication tests
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should redirect to login page for unauthenticated users', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should allow users to login with valid credentials', () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    
    // Intercept the login API call
    cy.intercept('POST', '/api/v1/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: {
          id: 'user123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      }
    }).as('loginRequest');
    
    cy.get('[data-testid="login-button"]').click();
    cy.wait('@loginRequest');
    
    // Should redirect to dashboard after successful login
    cy.url().should('include', '/dashboard');
    
    // User info should be displayed in the UI
    cy.get('[data-testid="user-name"]').should('contain', 'Test User');
  });

  it('should show error message with invalid credentials', () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('wrong@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    
    // Intercept the login API call
    cy.intercept('POST', '/api/v1/auth/login', {
      statusCode: 401,
      body: {
        message: 'Invalid email or password'
      }
    }).as('loginRequest');
    
    cy.get('[data-testid="login-button"]').click();
    cy.wait('@loginRequest');
    
    // Should show error message
    cy.get('[data-testid="login-error"]').should('be.visible');
    cy.get('[data-testid="login-error"]').should('contain', 'Invalid email or password');
    
    // Should still be on login page
    cy.url().should('include', '/login');
  });

  it('should allow users to register a new account', () => {
    cy.visit('/register');
    cy.get('[data-testid="first-name-input"]').type('New');
    cy.get('[data-testid="last-name-input"]').type('User');
    cy.get('[data-testid="email-input"]').type('new@example.com');
    cy.get('[data-testid="password-input"]').type('newpassword123');
    cy.get('[data-testid="confirm-password-input"]').type('newpassword123');
    
    // Intercept the register API call
    cy.intercept('POST', '/api/v1/auth/register', {
      statusCode: 201,
      body: {
        message: 'Registration successful',
        user: {
          id: 'user456',
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'User'
        }
      }
    }).as('registerRequest');
    
    cy.get('[data-testid="register-button"]').click();
    cy.wait('@registerRequest');
    
    // Should be redirected to login or directly to dashboard
    cy.url().should('include', '/login');
    
    // Success message should be displayed
    cy.get('[data-testid="register-success"]').should('be.visible');
  });

  it('should allow users to logout', () => {
    // Login first
    cy.login();
    
    // Navigate to dashboard
    cy.visit('/dashboard');
    
    // Open user menu and click logout
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();
    
    // Should be redirected to login page
    cy.url().should('include', '/login');
    
    // Should not be able to access protected routes
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });
});
