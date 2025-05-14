package models

import (
	"time"

	"gorm.io/gorm"
)

type OrderSide string
type OrderType string
type OrderStatus string
type OrderValidity string

const (
	OrderSideBuy       OrderSide = "BUY"
	OrderSideSell      OrderSide = "SELL"

	OrderTypeMarket    OrderType = "MARKET"
	OrderTypeLimit     OrderType = "LIMIT"
	OrderTypeStopLoss  OrderType = "STOP_LOSS"
	OrderTypeStopLimit OrderType = "STOP_LIMIT"

	OrderStatusPending   OrderStatus = "PENDING"
	OrderStatusOpen      OrderStatus = "OPEN"
	OrderStatusPartial   OrderStatus = "PARTIAL"
	OrderStatusCompleted OrderStatus = "COMPLETED"
	OrderStatusCancelled OrderStatus = "CANCELLED"
	OrderStatusRejected  OrderStatus = "REJECTED"
	OrderStatusExpired   OrderStatus = "EXPIRED"

	OrderValidityDay       OrderValidity = "DAY"
	OrderValidityIOC       OrderValidity = "IOC" // Immediate or Cancel
	OrderValidityGTC       OrderValidity = "GTC" // Good Till Cancelled  
	OrderValidityGTD       OrderValidity = "GTD" // Good Till Date
)

// Order represents a trading order
type Order struct {
	ID               string        `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID           string        `gorm:"type:uuid;not null" json:"userId"`
	Symbol           string        `gorm:"not null" json:"symbol"`
	Exchange         string        `gorm:"not null;default:'NSE'" json:"exchange"`
	Quantity         int           `gorm:"not null" json:"quantity"`
	FilledQuantity   int           `gorm:"default:0" json:"filledQuantity"`
	RemainingQty     int           `gorm:"default:0" json:"remainingQty"`
	Price            *float64      `json:"price,omitempty"`
	TriggerPrice     *float64      `json:"triggerPrice,omitempty"`
	Type             OrderType     `gorm:"type:varchar(20);not null" json:"type"`
	Side             OrderSide     `gorm:"type:varchar(10);not null" json:"side"`
	Status           OrderStatus   `gorm:"type:varchar(20);default:'PENDING'" json:"status"`
	Validity         OrderValidity `gorm:"type:varchar(10);default:'DAY'" json:"validity"`
	ValidityDate     *time.Time    `json:"validityDate,omitempty"`
	AvgExecutionPrice *float64     `json:"avgExecutionPrice,omitempty"`
	Product          string        `gorm:"not null;default:'CNC'" json:"product"` // CNC, MIS, NRML
	InstrumentType   string        `gorm:"not null;default:'EQ'" json:"instrumentType"` // EQ, FUT, OPT, etc.
	ExpiryDate       *time.Time    `json:"expiryDate,omitempty"`
	StrikePrice      *float64      `json:"strikePrice,omitempty"`
	OptionType       *string       `json:"optionType,omitempty"` // CE, PE
	OrderID          string        `json:"orderId,omitempty"` // Exchange order ID
	Tag              string        `json:"tag,omitempty"` // User defined tag
	ParentOrderID    *string       `json:"parentOrderId,omitempty"` // For bracket/cover orders
	DisclosedQty     *int          `json:"disclosedQty,omitempty"`
	Variety          string        `gorm:"default:'regular'" json:"variety"` // regular, bo (bracket), co (cover), amo (after-market)
	Error            string        `json:"error,omitempty"`
	Remarks          string        `json:"remarks,omitempty"`
	StrategyID       *string       `gorm:"type:uuid" json:"strategyId,omitempty"`
	Trades           []Trade       `gorm:"foreignKey:OrderID" json:"trades,omitempty"`
	Charges          JSON          `gorm:"type:jsonb;default:'{}'::jsonb" json:"charges"`
	PlacedBy         string        `json:"placedBy,omitempty"` // User or system
	CancelledBy      string        `json:"cancelledBy,omitempty"`
	CancelledAt      *time.Time    `json:"cancelledAt,omitempty"`
	ExecutedAt       *time.Time    `json:"executedAt,omitempty"`
	CreatedAt        time.Time     `json:"createdAt"`
	UpdatedAt        time.Time     `json:"updatedAt"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

// Trade represents a trade execution
type Trade struct {
	ID               string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	OrderID          string         `gorm:"type:uuid;not null" json:"orderId"`
	UserID           string         `gorm:"type:uuid;not null" json:"userId"`
	Symbol           string         `gorm:"not null" json:"symbol"`
	Exchange         string         `gorm:"not null" json:"exchange"`
	Quantity         int            `gorm:"not null" json:"quantity"`
	Price            float64        `gorm:"not null" json:"price"`
	Side             OrderSide      `gorm:"type:varchar(10);not null" json:"side"`
	Product          string         `gorm:"not null" json:"product"`
	InstrumentType   string         `gorm:"not null" json:"instrumentType"`
	TradeID          string         `json:"tradeId"`  // Exchange trade ID
	OrderTimestamp   time.Time      `json:"orderTimestamp"`
	TradeTimestamp   time.Time      `json:"tradeTimestamp"`
	Charges          JSON           `gorm:"type:jsonb;default:'{}'::jsonb" json:"charges"`
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"updatedAt"`
}

// OrderBook represents the order book for a symbol
type OrderBook struct {
	Symbol   string       `json:"symbol"`
	Exchange string       `json:"exchange"`
	Bids     []OrderLevel `json:"bids"`
	Asks     []OrderLevel `json:"asks"`
	Timestamp time.Time   `json:"timestamp"`
}

// OrderLevel represents a price level in the order book
type OrderLevel struct {
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
	Orders   int     `json:"orders"`
}

// TradingStrategy represents an algorithmic trading strategy
type TradingStrategy struct {
	ID               string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID           string         `gorm:"type:uuid;not null" json:"userId"`
	Name             string         `gorm:"not null" json:"name"`
	Description      string         `json:"description"`
	Symbols          []string       `gorm:"type:text[];not null" json:"symbols"`
	Parameters       JSON           `gorm:"type:jsonb;default:'{}'::jsonb" json:"parameters"`
	EntryConditions  JSON           `gorm:"type:jsonb;not null" json:"entryConditions"`
	ExitConditions   JSON           `gorm:"type:jsonb;not null" json:"exitConditions"`
	PositionSizing   JSON           `gorm:"type:jsonb;not null" json:"positionSizing"`
	Status           string         `gorm:"type:varchar(20);default:'draft'" json:"status"`
	BacktestResults  []JSON         `gorm:"type:jsonb[]" json:"backtestResults,omitempty"`
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"updatedAt"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

// PlaceOrderRequest represents the request to place an order
type PlaceOrderRequest struct {
	Symbol         string        `json:"symbol" binding:"required"`
	Exchange       string        `json:"exchange" binding:"required"`
	Quantity       int           `json:"quantity" binding:"required,min=1"`
	Price          *float64      `json:"price"`
	TriggerPrice   *float64      `json:"triggerPrice"`
	Type           OrderType     `json:"type" binding:"required"`
	Side           OrderSide     `json:"side" binding:"required"`
	Product        string        `json:"product" binding:"required"`
	Validity       OrderValidity `json:"validity"`
	ValidityDate   *time.Time    `json:"validityDate"`
	DisclosedQty   *int          `json:"disclosedQty"`
	Tag            string        `json:"tag"`
	InstrumentType string        `json:"instrumentType" binding:"required"`
	ExpiryDate     *time.Time    `json:"expiryDate"`
	StrikePrice    *float64      `json:"strikePrice"`
	OptionType     *string       `json:"optionType"`
	Variety        string        `json:"variety"`
	ParentOrderID  *string       `json:"parentOrderId"`
}

// OrderResponse represents the response for an order
type OrderResponse struct {
	Order    Order  `json:"order"`
	Message  string `json:"message,omitempty"`
	Success  bool   `json:"success"`
}

// StrategyRequest represents the request to create or update a trading strategy
type StrategyRequest struct {
	Name            string   `json:"name" binding:"required"`
	Description     string   `json:"description"`
	Symbols         []string `json:"symbols" binding:"required"`
	Parameters      JSON     `json:"parameters"`
	EntryConditions JSON     `json:"entryConditions" binding:"required"`
	ExitConditions  JSON     `json:"exitConditions" binding:"required"`
	PositionSizing  JSON     `json:"positionSizing" binding:"required"`
}

// BacktestRequest represents the request to backtest a strategy
type BacktestRequest struct {
	StrategyID string    `json:"strategyId" binding:"required"`
	StartDate  time.Time `json:"startDate" binding:"required"`
	EndDate    time.Time `json:"endDate" binding:"required"`
	InitialCapital float64 `json:"initialCapital" binding:"required"`
	CommissionRate float64 `json:"commissionRate"`
}

// BacktestResult represents the result of a backtest
type BacktestResult struct {
	StrategyID      string    `json:"strategyId"`
	StartDate       time.Time `json:"startDate"`
	EndDate         time.Time `json:"endDate"`
	InitialCapital  float64   `json:"initialCapital"`
	FinalCapital    float64   `json:"finalCapital"`
	TotalReturn     float64   `json:"totalReturn"`
	AnnualizedReturn float64  `json:"annualizedReturn"`
	MaxDrawdown     float64   `json:"maxDrawdown"`
	SharpeRatio     float64   `json:"sharpeRatio"`
	WinRate         float64   `json:"winRate"`
	TotalTrades     int       `json:"totalTrades"`
	ProfitableTrades int      `json:"profitableTrades"`
	LosingTrades    int       `json:"losingTrades"`
	Trades          []JSON    `json:"trades"`
	EquityCurve     []JSON    `json:"equityCurve"`
	Metrics         JSON      `json:"metrics"`
	CreatedAt       time.Time `json:"createdAt"`
}
