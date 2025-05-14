// File: backend/models/stock.go

package models

import (
	"time"
)

// Stock represents stock market data for a particular security
type Stock struct {
	Symbol        string   `json:"symbol"`
	Name          string   `json:"name"`
	Price         float64  `json:"price"`
	Change        float64  `json:"change"`
	ChangePercent float64  `json:"changePercent"`
	Volume        float64  `json:"volume"`
	MarketCap     float64  `json:"marketCap"`
	PERatio       *float64 `json:"peRatio,omitempty"`
	Dividend      *float64 `json:"dividend,omitempty"`
	Sector        *string  `json:"sector,omitempty"`
	Industry      *string  `json:"industry,omitempty"`
	Exchange      string   `json:"exchange"`
	PreviousClose float64  `json:"previousClose"`
	Open          float64  `json:"open"`
	DayHigh       float64  `json:"dayHigh"`
	DayLow        float64  `json:"dayLow"`
	YearHigh      float64  `json:"yearHigh"`
	YearLow       float64  `json:"yearLow"`
}

// StockSearchResult represents a lightweight stock result for search operations
type StockSearchResult struct {
	Symbol   string  `json:"symbol"`
	Name     string  `json:"name"`
	Exchange string  `json:"exchange"`
	Type     string  `json:"type,omitempty"`
	Price    float64 `json:"price,omitempty"`
}

// HistoricalData represents historical price data for a stock
type HistoricalData struct {
	Date     time.Time `json:"date"`
	Open     float64   `json:"open"`
	High     float64   `json:"high"`
	Low      float64   `json:"low"`
	Close    float64   `json:"close"`
	Volume   float64   `json:"volume"`
	Adjusted float64   `json:"adjusted,omitempty"`
}

// StockQuoteRequest defines the request parameters for getting stock quotes
type StockQuoteRequest struct {
	Symbols []string `json:"symbols" form:"symbols" binding:"required"`
}

// HistoricalDataRequest defines the request parameters for getting historical data
type HistoricalDataRequest struct {
	Symbol string `uri:"symbol" binding:"required"`
	Period string `form:"period" binding:"omitempty,oneof=1d 5d 1m 3m 6m 1y 5y max"`
	From   string `form:"from" binding:"omitempty,datetime=2006-01-02"`
	To     string `form:"to" binding:"omitempty,datetime=2006-01-02"`
}

// SearchRequest defines the request parameters for searching stocks
type SearchRequest struct {
	Query string `form:"q" binding:"required,min=1,max=50"`
	Limit int    `form:"limit" binding:"omitempty,min=1,max=50"`
}

// StockResponse represents the API response for stock data
type StockResponse struct {
	Data  interface{} `json:"data"`
	Error string      `json:"error,omitempty"`
}

// BatchQuoteResponse represents multiple stock quotes in a single response
type BatchQuoteResponse struct {
	Quotes map[string]Stock `json:"quotes"`
}
