package models

import (
	"time"

	"gorm.io/gorm"
)

// Portfolio represents a user's portfolio
type Portfolio struct {
	ID              string       `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID          string       `gorm:"type:uuid;not null;uniqueIndex" json:"userId"`
	Holdings        []Holding    `gorm:"foreignKey:PortfolioID" json:"holdings,omitempty"`
	TotalValue      float64      `json:"totalValue"`
	TotalInvestment float64      `json:"totalInvestment"`
	TotalPL         float64      `json:"totalPL"`
	TotalPLPercent  float64      `json:"totalPLPercent"`
	DayPL           float64      `json:"dayPL"`
	DayPLPercent    float64      `json:"dayPLPercent"`
	LastUpdateTime  time.Time    `json:"lastUpdateTime"`
	CreatedAt       time.Time    `json:"createdAt"`
	UpdatedAt       time.Time    `json:"updatedAt"`
}

// Holding represents a holding in a portfolio
type Holding struct {
	ID                string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	PortfolioID       string         `gorm:"type:uuid;not null" json:"portfolioId"`
	UserID            string         `gorm:"type:uuid;not null" json:"userId"`
	Symbol            string         `gorm:"not null" json:"symbol"`
	Exchange          string         `gorm:"not null" json:"exchange"`
	Quantity          int            `gorm:"not null" json:"quantity"`
	AvgPrice          float64        `gorm:"not null" json:"avgPrice"`
	CurrentPrice      float64        `json:"currentPrice"`
	Value             float64        `json:"value"` // Quantity * CurrentPrice
	Investment        float64        `json:"investment"` // Quantity * AvgPrice
	PL                float64        `json:"pl"` // Value - Investment
	PLPercent         float64        `json:"plPercent"` // (PL / Investment) * 100
	DayChange         float64        `json:"dayChange"`
	DayChangePercent  float64        `json:"dayChangePercent"`
	Product           string         `gorm:"not null;default:'CNC'" json:"product"` // CNC, MIS, NRML
	InstrumentType    string         `gorm:"not null;default:'EQ'" json:"instrumentType"` // EQ, FUT, OPT
	ExpiryDate        *time.Time     `json:"expiryDate,omitempty"`
	StrikePrice       *float64       `json:"strikePrice,omitempty"`
	OptionType        *string        `json:"optionType,omitempty"`
	LastUpdateTime    time.Time      `json:"lastUpdateTime"`
	CreatedAt         time.Time      `json:"createdAt"`
	UpdatedAt         time.Time      `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
}

// Transaction represents a transaction (buy/sell) in a portfolio
type Transaction struct {
	ID                string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID            string         `gorm:"type:uuid;not null" json:"userId"`
	Symbol            string         `gorm:"not null" json:"symbol"`
	Exchange          string         `gorm:"not null" json:"exchange"`
	Quantity          int            `gorm:"not null" json:"quantity"`
	Price             float64        `gorm:"not null" json:"price"`
	TradeValue        float64        `json:"tradeValue"` // Quantity * Price
	Type              string         `gorm:"not null" json:"type"` // BUY, SELL
	Product           string         `gorm:"not null" json:"product"` // CNC, MIS, NRML
	InstrumentType    string         `gorm:"not null" json:"instrumentType"` // EQ, FUT, OPT
	ExpiryDate        *time.Time     `json:"expiryDate,omitempty"`
	StrikePrice       *float64       `json:"strikePrice,omitempty"`
	OptionType        *string        `json:"optionType,omitempty"`
	OrderID           string         `gorm:"type:uuid" json:"orderId"`
	TradeID           string         `json:"tradeId"`
	Charges           float64        `json:"charges"`
	ChargesBreakup    JSON           `gorm:"type:jsonb;default:'{}'::jsonb" json:"chargesBreakup"`
	NetAmount         float64        `json:"netAmount"` // TradeValue +/- Charges
	TradeTime         time.Time      `json:"tradeTime"`
	SettlementID      string         `json:"settlementId,omitempty"`
	SettlementDate    *time.Time     `json:"settlementDate,omitempty"`
	CreatedAt         time.Time      `json:"createdAt"`
	UpdatedAt         time.Time      `json:"updatedAt"`
}

// PortfolioPerformance represents the performance of a portfolio over time
type PortfolioPerformance struct {
	UserID          string    `json:"userId"`
	Date            time.Time `json:"date"`
	Value           float64   `json:"value"`
	Investment      float64   `json:"investment"`
	PL              float64   `json:"pl"`
	PLPercent       float64   `json:"plPercent"`
	DayChange       float64   `json:"dayChange"`
	DayChangePercent float64  `json:"dayChangePercent"`
}

// PortfolioSummary represents a summary of a portfolio
type PortfolioSummary struct {
	TotalValue        float64 `json:"totalValue"`
	TotalInvestment   float64 `json:"totalInvestment"`
	TotalPL           float64 `json:"totalPL"`
	TotalPLPercent    float64 `json:"totalPLPercent"`
	DayPL             float64 `json:"dayPL"`
	DayPLPercent      float64 `json:"dayPLPercent"`
	TotalHoldings     int     `json:"totalHoldings"`
	ProfitableHoldings int    `json:"profitableHoldings"`
	LossHoldings      int     `json:"lossHoldings"`
}

// PortfolioAllocation represents the allocation of a portfolio
type PortfolioAllocation struct {
	Sector            map[string]float64 `json:"sector"`
	InstrumentType    map[string]float64 `json:"instrumentType"`
	Exchange          map[string]float64 `json:"exchange"`
	Product           map[string]float64 `json:"product"`
}

// PortfolioHistory represents the historical performance of a portfolio
type PortfolioHistory struct {
	UserID   string                 `json:"userId"`
	Interval string                 `json:"interval"` // daily, weekly, monthly, yearly
	Data     []PortfolioPerformance `json:"data"`
}

// GetPortfolioRequest represents the request to get a portfolio
type GetPortfolioRequest struct {
	UserID string `json:"userId"`
}

// GetPortfolioPerformanceRequest represents the request to get portfolio performance
type GetPortfolioPerformanceRequest struct {
	UserID    string    `json:"userId"`
	Interval  string    `json:"interval"` // daily, weekly, monthly, yearly
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
}
