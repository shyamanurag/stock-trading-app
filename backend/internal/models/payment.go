package models

import (
	"time"

	"gorm.io/gorm"
)

// PaymentMethod represents the payment method
type PaymentMethod string

// PaymentStatus represents the status of a payment
type PaymentStatus string

// PaymentType represents the type of payment
type PaymentType string

const (
	PaymentMethodUPI          PaymentMethod = "UPI"
	PaymentMethodCard         PaymentMethod = "CARD"
	PaymentMethodNetBanking   PaymentMethod = "NET_BANKING"
	PaymentMethodWallet       PaymentMethod = "WALLET"
	PaymentMethodBankTransfer PaymentMethod = "BANK_TRANSFER"

	PaymentStatusInitiated   PaymentStatus = "INITIATED"
	PaymentStatusProcessing  PaymentStatus = "PROCESSING"
	PaymentStatusCompleted   PaymentStatus = "COMPLETED"
	PaymentStatusFailed      PaymentStatus = "FAILED"
	PaymentStatusCancelled   PaymentStatus = "CANCELLED"
	PaymentStatusRefunded    PaymentStatus = "REFUNDED"
	PaymentStatusPartialRefund PaymentStatus = "PARTIAL_REFUND"

	PaymentTypeDeposit    PaymentType = "DEPOSIT"
	PaymentTypeWithdrawal PaymentType = "WITHDRAWAL"
	PaymentTypeFees       PaymentType = "FEES"
	PaymentTypeRefund     PaymentType = "REFUND"
	PaymentTypeAdjustment PaymentType = "ADJUSTMENT"
)

// Payment represents a payment transaction
type Payment struct {
	ID                string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID            string         `gorm:"type:uuid;not null" json:"userId"`
	Amount            float64        `gorm:"not null" json:"amount"`
	Currency          string         `gorm:"not null;default:'INR'" json:"currency"`
	Type              PaymentType    `gorm:"type:varchar(20);not null" json:"type"`
	Method            PaymentMethod  `gorm:"type:varchar(20);not null" json:"method"`
	Status            PaymentStatus  `gorm:"type:varchar(20);not null;default:'INITIATED'" json:"status"`
	TransactionID     string         `json:"transactionId"`
	ReferenceID       string         `json:"referenceID,omitempty"`
	Gateway           string         `json:"gateway,omitempty"`
	GatewayPaymentID  string         `json:"gatewayPaymentId,omitempty"`
	GatewayResponse   JSON           `gorm:"type:jsonb;default:'{}'::jsonb" json:"-"`
	PaymentDetails    JSON           `gorm:"type:jsonb;default:'{}'::jsonb" json:"paymentDetails,omitempty"`
	Metadata          JSON           `gorm:"type:jsonb;default:'{}'::jsonb" json:"metadata,omitempty"`
	Description       string         `json:"description,omitempty"`
	Fees              float64        `json:"fees"`
	Tax               float64        `json:"tax"`
	NetAmount         float64        `json:"netAmount"`
	RefundedAmount    float64        `json:"refundedAmount,omitempty"`
	BankAccountID     *string        `gorm:"type:uuid" json:"bankAccountId,omitempty"`
	ApprovedBy        string         `json:"approvedBy,omitempty"`
	RejectedBy        string         `json:"rejectedBy,omitempty"`
	RejectReason      string         `json:"rejectReason,omitempty"`
	CompletedAt       *time.Time     `json:"completedAt,omitempty"`
	FailedAt          *time.Time     `json:"failedAt,omitempty"`
	CancelledAt       *time.Time     `json:"cancelledAt,omitempty"`
	RefundedAt        *time.Time     `json:"refundedAt,omitempty"`
	CreatedAt         time.Time      `json:"createdAt"`
	UpdatedAt         time.Time      `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
}

// Wallet represents a user's wallet
type Wallet struct {
	ID              string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID          string         `gorm:"type:uuid;not null;uniqueIndex" json:"userId"`
	Balance         float64        `gorm:"not null;default:0" json:"balance"`
	Currency        string         `gorm:"not null;default:'INR'" json:"currency"`
	Blocked         bool           `gorm:"default:false" json:"blocked"`
	BlockedAmount   float64        `gorm:"default:0" json:"blockedAmount"`
	LastTopupAt     *time.Time     `json:"lastTopupAt,omitempty"`
	LastWithdrawalAt *time.Time    `json:"lastWithdrawalAt,omitempty"`
	Remarks         string         `json:"remarks,omitempty"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
}

// WalletTransaction represents a transaction in a wallet
type WalletTransaction struct {
	ID             string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	WalletID       string         `gorm:"type:uuid;not null" json:"walletId"`
	UserID         string         `gorm:"type:uuid;not null" json:"userId"`
	Amount         float64        `gorm:"not null" json:"amount"`
	Type           string         `gorm:"not null" json:"type"` // CREDIT, DEBIT
	Balance        float64        `gorm:"not null" json:"balance"` // Balance after transaction
	Description    string         `json:"description"`
	Source         string         `json:"source"`             // DEPOSIT, WITHDRAWAL, TRADE, REFUND, ADJUSTMENT
	ReferenceID    string         `json:"referenceId"`        // Payment ID or Trade ID
	ReferenceType  string         `json:"referenceType"`      // PAYMENT, TRADE
	TransactionID  string         `json:"transactionId"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

// DepositRequest represents a request to deposit funds
type DepositRequest struct {
	Amount      float64       `json:"amount" binding:"required,min=100"`
	Currency    string        `json:"currency" binding:"required"`
	Method      PaymentMethod `json:"method" binding:"required"`
	Description string        `json:"description"`
	ReturnURL   string        `json:"returnUrl"`
	Metadata    JSON          `json:"metadata"`
}

// WithdrawalRequest represents a request to withdraw funds
type WithdrawalRequest struct {
	Amount        float64  `json:"amount" binding:"required,min=100"`
	BankAccountID string   `json:"bankAccountId" binding:"required"`
	Description   string   `json:"description"`
	Metadata      JSON     `json:"metadata"`
}

// PaymentResponse represents the response for a payment
type PaymentResponse struct {
	Payment      Payment `json:"payment"`
	RedirectURL  string  `json:"redirectUrl,omitempty"`
	PaymentToken string  `json:"paymentToken,omitempty"`
	QRCode       string  `json:"qrCode,omitempty"`
	Message      string  `json:"message,omitempty"`
	Success      bool    `json:"success"`
}

// TransactionResponse represents the response for a transaction
type TransactionResponse struct {
	Transaction WalletTransaction `json:"transaction"`
	Message     string            `json:"message,omitempty"`
	Success     bool              `json:"success"`
}

// BalanceResponse represents the response for a balance
type BalanceResponse struct {
	UserID       string  `json:"userId"`
	Balance      float64 `json:"balance"`
	BlockedAmount float64 `json:"blockedAmount"`
	Available     float64 `json:"available"`
	Currency     string  `json:"currency"`
	LastUpdated  time.Time `json:"lastUpdated"`
}

// PaymentGatewayConfig represents the configuration for a payment gateway
type PaymentGatewayConfig struct {
	Name          string `json:"name"`
	ApiKey        string `json:"-"`
	ApiSecret     string `json:"-"`
	MerchantID    string `json:"-"`
	IsDefault     bool   `json:"isDefault"`
	IsActive      bool   `json:"isActive"`
	SupportedMethods []PaymentMethod `json:"supportedMethods"`
	WebhookURL    string `json:"-"`
	RedirectURL   string `json:"-"`
	Environment   string `json:"environment"` // TEST, PRODUCTION
	Extra         JSON   `json:"-"`
}

// PaymentGatewayResponse represents the response from a payment gateway
type PaymentGatewayResponse struct {
	Status        string `json:"status"`
	GatewayPaymentID string `json:"gatewayPaymentId"`
	RedirectURL   string `json:"redirectUrl,omitempty"`
	PaymentToken  string `json:"paymentToken,omitempty"`
	QRCode        string `json:"qrCode,omitempty"`
	RawResponse   JSON   `json:"-"`
}

// PaymentWebhookRequest represents a webhook request from a payment gateway
type PaymentWebhookRequest struct {
	GatewayPaymentID string `json:"gatewayPaymentId"`
	Status          string `json:"status"`
	ReferenceID     string `json:"referenceId"`
	RawPayload      JSON   `json:"rawPayload"`
}

// PaymentReceipt represents a receipt for a payment
type PaymentReceipt struct {
	ID              string    `json:"id"`
	UserID          string    `json:"userId"`
	TransactionID   string    `json:"transactionId"`
	Amount          float64   `json:"amount"`
	Fees            float64   `json:"fees"`
	Tax             float64   `json:"tax"`
	NetAmount       float64   `json:"netAmount"`
	Currency        string    `json:"currency"`
	Type            string    `json:"type"`
	Method          string    `json:"method"`
	Status          string    `json:"status"`
	Description     string    `json:"description"`
	Date            time.Time `json:"date"`
	CompletedAt     *time.Time `json:"completedAt,omitempty"`
	UserName        string    `json:"userName"`
	UserEmail       string    `json:"userEmail"`
	UserPhone       string    `json:"userPhone"`
	CompanyName     string    `json:"companyName"`
	CompanyAddress  string    `json:"companyAddress"`
	CompanyGST      string    `json:"companyGST"`
	ReceiptNumber   string    `json:"receiptNumber"`
	PaymentDetails  JSON      `json:"paymentDetails"`
}

// FeeStructure represents the fee structure for a payment
type FeeStructure struct {
	Type            string  `json:"type"` // DEPOSIT, WITHDRAWAL, TRADE
	Method          string  `json:"method,omitempty"` // For deposits and withdrawals
	MinAmount       float64 `json:"minAmount"`
	MaxAmount       float64 `json:"maxAmount"`
	FeePercent      float64 `json:"feePercent"`
	FixedFee        float64 `json:"fixedFee"`
	TaxPercent      float64 `json:"taxPercent"`
	MinFee          float64 `json:"minFee"`
	MaxFee          float64 `json:"maxFee"`
	EffectiveFrom   time.Time `json:"effectiveFrom"`
	EffectiveTo     *time.Time `json:"effectiveTo,omitempty"`
}

// CalculateFee calculates the fee for a payment
func CalculateFee(amount float64, feeStructure FeeStructure) (fee float64, tax float64) {
	// Calculate fee
	percentFee := amount * (feeStructure.FeePercent / 100)
	totalFee := percentFee + feeStructure.FixedFee
	
	// Apply min/max constraints
	if feeStructure.MinFee > 0 && totalFee < feeStructure.MinFee {
		totalFee = feeStructure.MinFee
	}
	if feeStructure.MaxFee > 0 && totalFee > feeStructure.MaxFee {
		totalFee = feeStructure.MaxFee
	}
	
	// Calculate tax
	tax = totalFee * (feeStructure.TaxPercent / 100)
	
	return totalFee, tax
}
