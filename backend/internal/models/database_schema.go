// stock-trading-app/backend/internal/models/database_schema.go

package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Database schemas and relationships for stock trading application

// User represents a system user
type User struct {
	ID             uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email          string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash   string         `gorm:"not null" json:"-"`
	FirstName      string         `gorm:"not null" json:"first_name"`
	LastName       string         `gorm:"not null" json:"last_name"`
	Phone          string         `json:"phone"`
	KYCVerified    bool           `gorm:"default:false" json:"kyc_verified"`
	KYCDocuments   []KYCDocument  `gorm:"foreignKey:UserID" json:"kyc_documents,omitempty"`
	Portfolios     []Portfolio    `gorm:"foreignKey:UserID" json:"portfolios,omitempty"`
	Wallet         Wallet         `gorm:"foreignKey:UserID" json:"wallet,omitempty"`
	Orders         []Order        `gorm:"foreignKey:UserID" json:"orders,omitempty"`
	Watchlists     []Watchlist    `gorm:"foreignKey:UserID" json:"watchlists,omitempty"`
	TradingHistory []TradeHistory `gorm:"foreignKey:UserID" json:"trading_history,omitempty"`
	ApiKeys        []ApiKey       `gorm:"foreignKey:UserID" json:"api_keys,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// KYCDocument stores user KYC verification documents
type KYCDocument struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	DocumentType string         `gorm:"not null" json:"document_type"` // ID, Address Proof, etc.
	DocumentURL  string         `gorm:"not null" json:"document_url"`
	VerifiedAt   *time.Time     `json:"verified_at,omitempty"`
	RejectedAt   *time.Time     `json:"rejected_at,omitempty"`
	RejectionReason string      `json:"rejection_reason,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// Portfolio represents a user's investment portfolio
type Portfolio struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID       uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	Name         string         `gorm:"not null" json:"name"`
	Description  string         `json:"description,omitempty"`
	Holdings     []Holding      `gorm:"foreignKey:PortfolioID" json:"holdings,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// Holding represents a security holding in a portfolio
type Holding struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	PortfolioID uuid.UUID      `gorm:"type:uuid;not null" json:"portfolio_id"`
	Symbol      string         `gorm:"not null" json:"symbol"`
	Quantity    float64        `gorm:"not null;default:0" json:"quantity"`
	AveragePrice float64       `gorm:"not null;default:0" json:"average_price"`
	LastUpdated time.Time      `json:"last_updated"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// Order represents a trading order
type Order struct {
	ID            uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID        uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	Symbol        string         `gorm:"not null" json:"symbol"`
	OrderType     string         `gorm:"not null" json:"order_type"` // MARKET, LIMIT, STOP, etc.
	Side          string         `gorm:"not null" json:"side"`       // BUY, SELL
	Quantity      float64        `gorm:"not null" json:"quantity"`
	Price         *float64       `json:"price,omitempty"`           // Required for LIMIT orders
	StopPrice     *float64       `json:"stop_price,omitempty"`      // Required for STOP orders
	Status        string         `gorm:"not null;default:'PENDING'" json:"status"` // PENDING, FILLED, CANCELLED, REJECTED
	FilledQuantity float64       `gorm:"not null;default:0" json:"filled_quantity"`
	RemainingQuantity float64    `gorm:"not null" json:"remaining_quantity"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	ExecutedAt    *time.Time     `json:"executed_at,omitempty"`
	CancelledAt   *time.Time     `json:"cancelled_at,omitempty"`
	ExpiresAt     *time.Time     `json:"expires_at,omitempty"`
}

// TradeHistory represents executed trades
type TradeHistory struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	OrderID   uuid.UUID      `gorm:"type:uuid;not null" json:"order_id"`
	Symbol    string         `gorm:"not null" json:"symbol"`
	Side      string         `gorm:"not null" json:"side"` // BUY, SELL
	Quantity  float64        `gorm:"not null" json:"quantity"`
	Price     float64        `gorm:"not null" json:"price"`
	Timestamp time.Time      `gorm:"not null" json:"timestamp"`
	Fee       float64        `gorm:"not null;default:0" json:"fee"`
	CreatedAt time.Time      `json:"created_at"`
}

// Wallet represents a user's trading account wallet
type Wallet struct {
	ID            uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID        uuid.UUID      `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	Balance       float64        `gorm:"not null;default:0" json:"balance"`
	HoldBalance   float64        `gorm:"not null;default:0" json:"hold_balance"` // Amount reserved for open orders
	Transactions  []Transaction  `gorm:"foreignKey:WalletID" json:"transactions,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

// Transaction represents a wallet transaction
type Transaction struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	WalletID    uuid.UUID      `gorm:"type:uuid;not null" json:"wallet_id"`
	Type        string         `gorm:"not null" json:"type"` // DEPOSIT, WITHDRAWAL, TRADE, FEE, etc.
	Amount      float64        `gorm:"not null" json:"amount"`
	Description string         `json:"description,omitempty"`
	Status      string         `gorm:"not null;default:'PENDING'" json:"status"` // PENDING, COMPLETED, FAILED
	PaymentID   *uuid.UUID     `gorm:"type:uuid" json:"payment_id,omitempty"`
	OrderID     *uuid.UUID     `gorm:"type:uuid" json:"order_id,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// Payment stores payment processing information
type Payment struct {
	ID            uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID        uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	PaymentMethod string         `gorm:"not null" json:"payment_method"` // CREDIT_CARD, BANK_TRANSFER, etc.
	Amount        float64        `gorm:"not null" json:"amount"`
	Currency      string         `gorm:"not null;default:'USD'" json:"currency"`
	Status        string         `gorm:"not null;default:'PENDING'" json:"status"` // PENDING, COMPLETED, FAILED
	PaymentDetails string        `gorm:"type:jsonb" json:"payment_details"`
	ExternalReference string     `json:"external_reference,omitempty"` // Reference ID from payment processor
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

// Watchlist represents a user's stock watchlist
type Watchlist struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	Name      string         `gorm:"not null" json:"name"`
	Items     []WatchlistItem `gorm:"foreignKey:WatchlistID" json:"items,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// WatchlistItem represents a stock in a watchlist
type WatchlistItem struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	WatchlistID uuid.UUID      `gorm:"type:uuid;not null" json:"watchlist_id"`
	Symbol      string         `gorm:"not null" json:"symbol"`
	AddedAt     time.Time      `gorm:"not null" json:"added_at"`
	Notes       string         `json:"notes,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// ApiKey represents an API key for algorithmic trading
type ApiKey struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	Name      string         `gorm:"not null" json:"name"`
	Key       string         `gorm:"uniqueIndex;not null" json:"key"`
	Secret    string         `json:"-"` // Never expose this
	Permissions string        `gorm:"type:jsonb;not null" json:"permissions"`
	IsActive  bool           `gorm:"not null;default:true" json:"is_active"`
	LastUsed  *time.Time     `json:"last_used,omitempty"`
	ExpiresAt *time.Time     `json:"expires_at,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

// MarketData represents cached market data
type MarketData struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Symbol    string         `gorm:"uniqueIndex;not null" json:"symbol"`
	LastPrice float64        `gorm:"not null" json:"last_price"`
	Open      float64        `json:"open"`
	High      float64        `json:"high"`
	Low       float64        `json:"low"`
	Volume    int64          `json:"volume"`
	ChangePercent float64    `json:"change_percent"`
	UpdatedAt time.Time      `gorm:"not null" json:"updated_at"`
}

// Setup database migrations and indexes
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{},
		&KYCDocument{},
		&Portfolio{},
		&Holding{},
		&Order{},
		&TradeHistory{},
		&Wallet{},
		&Transaction{},
		&Payment{},
		&Watchlist{},
		&WatchlistItem{},
		&ApiKey{},
		&MarketData{},
	)
}
