// File: backend/controllers/stock_controller.go

package controllers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/papertrader/models"
	"github.com/yourusername/papertrader/services"
	"github.com/yourusername/papertrader/utils"
)

// StockController handles stock-related API requests
type StockController struct {
	stockService *services.StockService
}

// NewStockController creates a new StockController
func NewStockController(stockService *services.StockService) *StockController {
	return &StockController{
		stockService: stockService,
	}
}

// SearchStocks godoc
// @Summary Search for stocks
// @Description Search for stocks by name or symbol
// @Tags stocks
// @Accept json
// @Produce json
// @Param q query string true "Search query"
// @Param limit query int false "Limit results (default 10, max 50)"
// @Success 200 {object} models.StockResponse{data=[]models.StockSearchResult}
// @Failure 400 {object} models.ErrorResponse
// @Failure 429 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /stocks/search [get]
func (sc *StockController) SearchStocks(c *gin.Context) {
	var request models.SearchRequest
	if err := c.ShouldBindQuery(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid search parameters: " + err.Error(),
		})
		return
	}

	if request.Limit == 0 {
		request.Limit = 10
	} else if request.Limit > 50 {
		request.Limit = 50
	}

	// Sanitize the query
	request.Query = utils.SanitizeString(request.Query)

	results, err := sc.stockService.SearchStocks(request.Query, request.Limit)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "rate limit exceeded" {
			statusCode = http.StatusTooManyRequests
		}
		c.JSON(statusCode, models.ErrorResponse{
			Error: "Failed to search stocks: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StockResponse{
		Data: results,
	})
}

// GetStockQuote godoc
// @Summary Get stock quote
// @Description Get current stock quote for a specific symbol
// @Tags stocks
// @Accept json
// @Produce json
// @Param symbol path string true "Stock symbol"
// @Success 200 {object} models.StockResponse{data=models.Stock}
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 429 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /stocks/quote/{symbol} [get]
func (sc *StockController) GetStockQuote(c *gin.Context) {
	symbol := c.Param("symbol")
	if symbol == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Stock symbol is required",
		})
		return
	}

	// Sanitize the symbol
	symbol = utils.SanitizeString(strings.ToUpper(symbol))

	stock, err := sc.stockService.GetStockQuote(symbol)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "stock not found" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "rate limit exceeded" {
			statusCode = http.StatusTooManyRequests
		}
		c.JSON(statusCode, models.ErrorResponse{
			Error: "Failed to get stock quote: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StockResponse{
		Data: stock,
	})
}

// GetBatchQuotes godoc
// @Summary Get batch stock quotes
// @Description Get current stock quotes for multiple symbols
// @Tags stocks
// @Accept json
// @Produce json
// @Param symbols query string true "Comma-separated list of stock symbols"
// @Success 200 {object} models.StockResponse{data=map[string]models.Stock}
// @Failure 400 {object} models.ErrorResponse
// @Failure 429 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /stocks/batch [get]
func (sc *StockController) GetBatchQuotes(c *gin.Context) {
	symbolsParam := c.Query("symbols")
	if symbolsParam == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Symbols parameter is required",
		})
		return
	}

	// Split and sanitize the symbols
	symbols := strings.Split(symbolsParam, ",")
	for i, symbol := range symbols {
		symbols[i] = utils.SanitizeString(strings.ToUpper(strings.TrimSpace(symbol)))
	}

	// Remove empty symbols
	var validSymbols []string
	for _, symbol := range symbols {
		if symbol != "" {
			validSymbols = append(validSymbols, symbol)
		}
	}

	if len(validSymbols) == 0 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "No valid symbols provided",
		})
		return
	}

	if len(validSymbols) > 100 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Too many symbols. Maximum 100 allowed",
		})
		return
	}

	quotes, err := sc.stockService.GetBatchQuotes(validSymbols)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "rate limit exceeded" {
			statusCode = http.StatusTooManyRequests
		}
		c.JSON(statusCode, models.ErrorResponse{
			Error: "Failed to get batch quotes: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StockResponse{
		Data: quotes,
	})
}

// GetHistoricalData godoc
// @Summary Get historical stock data
// @Description Get historical price data for a specific stock
// @Tags stocks
// @Accept json
// @Produce json
// @Param symbol path string true "Stock symbol"
// @Param period query string false "Time period (1d, 5d, 1m, 3m, 6m, 1y, 5y, max)"
// @Param from query string false "Start date (YYYY-MM-DD)"
// @Param to query string false "End date (YYYY-MM-DD)"
// @Success 200 {object} models.StockResponse{data=[]models.HistoricalData}
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 429 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Security BearerAuth
// @Router /stocks/history/{symbol} [get]
func (sc *StockController) GetHistoricalData(c *gin.Context) {
	var request models.HistoricalDataRequest
	if err := c.ShouldBindUri(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid symbol: " + err.Error(),
		})
		return
	}

	if err := c.ShouldBindQuery(&request); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Invalid query parameters: " + err.Error(),
		})
		return
	}

	// Default period is 1 year if not specified
	if request.Period == "" && request.From == "" && request.To == "" {
		request.Period = "1y"
	}

	// Sanitize the symbol
	request.Symbol = utils.SanitizeString(strings.ToUpper(request.Symbol))

	data, err := sc.stockService.GetHistoricalData(request)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "stock not found" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "rate limit exceeded" {
			statusCode = http.StatusTooManyRequests
		}
		c.JSON(statusCode, models.ErrorResponse{
			Error: "Failed to get historical data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StockResponse{
		Data: data,
	})
}
