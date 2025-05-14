// backend/internal/docs/swagger.go
package docs

import (
	"github.com/swaggo/swag"
)

// @title Stock Trading API
// @version 1.0
// @description API for the Advanced Stock Trading Application
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1
// @schemes http https

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and the JWT token.

// swagger:meta
func SwaggerInfo() {
	// This function exists to hold the Swagger annotations
}

// Example of a handler with Swagger documentation:

// @Summary Place a new order
// @Description Create a new trading order
// @Tags orders
// @Accept json
// @Produce json
// @Param order body models.OrderRequest true "Order information"
// @Success 201 {object} models.Order "Order created"
// @Failure 400 {object} models.ErrorResponse "Invalid request"
// @Failure 401 {object} models.ErrorResponse "Unauthorized"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Security BearerAuth
// @Router /trading/order [post]
func PlaceOrderHandler() {
	// Implementation is in the actual handler
}
