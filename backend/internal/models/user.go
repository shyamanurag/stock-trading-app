package models

import (
	"time"

	"gorm.io/gorm"
)

type UserStatus string
type UserRole string

const (
	UserStatusActive       UserStatus = "active"
	UserStatusInactive     UserStatus = "inactive"
	UserStatusPending      UserStatus = "pending"
	UserStatusSuspended    UserStatus = "suspended"
	UserStatusBlocked      UserStatus = "blocked"

	UserRoleUser           UserRole = "user"
	UserRoleAdmin          UserRole = "admin"
	UserRoleSuperAdmin     UserRole = "super_admin"
)

// User represents a user in the system
type User struct {
	ID                string           `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Email             string           `gorm:"uniqueIndex;not null" json:"email"`
	Password          string           `gorm:"not null" json:"-"`
	Name              string           `gorm:"not null" json:"name"`
	Phone             string           `gorm:"uniqueIndex;not null" json:"phone"`
	Status            UserStatus       `gorm:"type:varchar(20);default:'pending'" json:"status"`
	Role              UserRole         `gorm:"type:varchar(20);default:'user'" json:"role"`
	LastLogin         *time.Time       `json:"lastLogin,omitempty"`
	EmailVerified     bool             `gorm:"default:false" json:"emailVerified"`
	PhoneVerified     bool             `gorm:"default:false" json:"phoneVerified"`
	TwoFactorEnabled  bool             `gorm:"default:false" json:"twoFactorEnabled"`
	TwoFactorSecret   string           `json:"-"`
	KYCStatus         string           `gorm:"type:varchar(20);default:'not_submitted'" json:"kycStatus"`
	RiskProfile       string           `gorm:"type:varchar(20);default:'moderate'" json:"riskProfile"`
	AccountBalance    float64          `gorm:"default:0" json:"accountBalance"`
	PAN               string           `json:"pan,omitempty"`
	AadhaarNumber     string           `json:"-"`
	Address           string           `json:"address,omitempty"`
	City              string           `json:"city,omitempty"`
	State             string           `json:"state,omitempty"`
	PostalCode        string           `json:"postalCode,omitempty"`
	Country           string           `gorm:"default:'India'" json:"country,omitempty"`
	DateOfBirth       *time.Time       `json:"dateOfBirth,omitempty"`
	ReferralCode      string           `json:"referralCode,omitempty"`
	ReferredBy        string           `json:"referredBy,omitempty"`
	Preferences       JSON             `gorm:"type:jsonb;default:'{}'::jsonb" json:"preferences"`
	DeviceInfo        JSON             `gorm:"type:jsonb;default:'{}'::jsonb" json:"-"`
	LoginAttempts     int              `gorm:"default:0" json:"-"`
	LockedUntil       *time.Time       `json:"-"`
	ResetPasswordToken string          `json:"-"`
	ResetTokenExpiry  *time.Time       `json:"-"`
	VerificationToken string           `json:"-"`
	CreatedAt         time.Time        `json:"createdAt"`
	UpdatedAt         time.Time        `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt   `gorm:"index" json:"-"`
	Watchlists        []Watchlist      `gorm:"foreignKey:UserID" json:"watchlists,omitempty"`
	KYCDocuments      []KYCDocument    `gorm:"foreignKey:UserID" json:"-"`
	BankAccounts      []BankAccount    `gorm:"foreignKey:UserID" json:"bankAccounts,omitempty"`
	Sessions          []Session        `gorm:"foreignKey:UserID" json:"-"`
}

// Watchlist represents a user's watchlist
type Watchlist struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID    string         `gorm:"type:uuid;not null" json:"userId"`
	Name      string         `gorm:"not null" json:"name"`
	Symbols   []string       `gorm:"type:text[];not null" json:"symbols"`
	IsDefault bool           `gorm:"default:false" json:"isDefault"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// KYCDocument represents a user's KYC document
type KYCDocument struct {
	ID           string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID       string         `gorm:"type:uuid;not null" json:"userId"`
	DocumentType string         `gorm:"type:varchar(50);not null" json:"documentType"`
	DocumentURL  string         `json:"-"`
	Status       string         `gorm:"type:varchar(20);default:'pending'" json:"status"`
	Remarks      string         `json:"remarks,omitempty"`
	VerifiedBy   string         `gorm:"type:uuid" json:"verifiedBy,omitempty"`
	VerifiedAt   *time.Time     `json:"verifiedAt,omitempty"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// BankAccount represents a user's bank account
type BankAccount struct {
	ID            string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID        string         `gorm:"type:uuid;not null" json:"userId"`
	AccountNumber string         `json:"accountNumber"`
	IFSC          string         `json:"ifsc"`
	BankName      string         `json:"bankName"`
	AccountType   string         `json:"accountType"`
	AccountHolder string         `json:"accountHolder"`
	IsDefault     bool           `gorm:"default:false" json:"isDefault"`
	Verified      bool           `gorm:"default:false" json:"verified"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// Session represents a user session
type Session struct {
	ID           string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID       string         `gorm:"type:uuid;not null" json:"userId"`
	RefreshToken string         `json:"-"`
	UserAgent    string         `json:"-"`
	IPAddress    string         `json:"-"`
	ExpiresAt    time.Time      `json:"expiresAt"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// JSON is a custom type for storing JSON data
type JSON map[string]interface{}

// UserDTO represents a user for API responses (without sensitive fields)
type UserDTO struct {
	ID               string     `json:"id"`
	Email            string     `json:"email"`
	Name             string     `json:"name"`
	Phone            string     `json:"phone"`
	Status           UserStatus `json:"status"`
	Role             UserRole   `json:"role"`
	EmailVerified    bool       `json:"emailVerified"`
	PhoneVerified    bool       `json:"phoneVerified"`
	TwoFactorEnabled bool       `json:"twoFactorEnabled"`
	KYCStatus        string     `json:"kycStatus"`
	AccountBalance   float64    `json:"accountBalance"`
	CreatedAt        time.Time  `json:"createdAt"`
}

// ToDTO converts a User to a UserDTO
func (u *User) ToDTO() UserDTO {
	return UserDTO{
		ID:               u.ID,
		Email:            u.Email,
		Name:             u.Name,
		Phone:            u.Phone,
		Status:           u.Status,
		Role:             u.Role,
		EmailVerified:    u.EmailVerified,
		PhoneVerified:    u.PhoneVerified,
		TwoFactorEnabled: u.TwoFactorEnabled,
		KYCStatus:        u.KYCStatus,
		AccountBalance:   u.AccountBalance,
		CreatedAt:        u.CreatedAt,
	}
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	OTPCode     string `json:"otpCode"`
	DeviceInfo  JSON   `json:"deviceInfo"`
	RememberMe  bool   `json:"rememberMe"`
}

// RegisterRequest represents the register request payload
type RegisterRequest struct {
	Name            string `json:"name" binding:"required"`
	Email           string `json:"email" binding:"required,email"`
	Phone           string `json:"phone" binding:"required"`
	Password        string `json:"password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirmPassword" binding:"required,eqfield=Password"`
	ReferralCode    string `json:"referralCode"`
	DeviceInfo      JSON   `json:"deviceInfo"`
	AcceptTerms     bool   `json:"acceptTerms" binding:"required"`
}

// ChangePasswordRequest represents the change password request payload
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=8,nefield=CurrentPassword"`
	ConfirmPassword string `json:"confirmPassword" binding:"required,eqfield=NewPassword"`
}

// ForgotPasswordRequest represents the forgot password request payload
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest represents the reset password request payload
type ResetPasswordRequest struct {
	Token           string `json:"token" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=8"`
	ConfirmPassword string `json:"confirmPassword" binding:"required,eqfield=NewPassword"`
}

// UpdateProfileRequest represents the update profile request payload
type UpdateProfileRequest struct {
	Name        string     `json:"name"`
	Address     string     `json:"address"`
	City        string     `json:"city"`
	State       string     `json:"state"`
	PostalCode  string     `json:"postalCode"`
	Country     string     `json:"country"`
	DateOfBirth *time.Time `json:"dateOfBirth"`
	Preferences JSON       `json:"preferences"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	User         UserDTO `json:"user"`
	AccessToken  string  `json:"accessToken"`
	RefreshToken string  `json:"refreshToken"`
	ExpiresIn    int     `json:"expiresIn"`
}
