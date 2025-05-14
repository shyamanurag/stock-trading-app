package services

import (
	"errors"
	"time"

	"github.com/yourusername/stockmarket-app/internal/models"
	"github.com/yourusername/stockmarket-app/internal/repositories"
	"golang.org/x/crypto/bcrypt"
)

// UserService provides user-related operations
type UserService interface {
	Register(request models.RegisterRequest) (*models.User, error)
	Login(request models.LoginRequest) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	UpdateUserProfile(id string, request models.UpdateProfileRequest) (*models.User, error)
	ChangePassword(id string, request models.ChangePasswordRequest) error
	GenerateResetPasswordToken(email string) (string, error)
	ResetPassword(request models.ResetPasswordRequest) error
	VerifyEmail(token string) error
	GetWatchlists(userId string) ([]models.Watchlist, error)
	CreateWatchlist(userId string, name string, symbols []string) (*models.Watchlist, error)
	UpdateWatchlist(id string, name string, symbols []string) (*models.Watchlist, error)
	DeleteWatchlist(id string) error
	CreateSession(userId string, refreshToken string, userAgent string, ipAddress string) (*models.Session, error)
	GetSessionByToken(token string) (*models.Session, error)
	InvalidateSession(id string) error
	InvalidateAllUserSessions(userId string) error
}

type userService struct {
	userRepo repositories.UserRepository
	jwtService JWTService
}

// NewUserService creates a new user service
func NewUserService(userRepo repositories.UserRepository, jwtService JWTService) UserService {
	return &userService{
		userRepo:   userRepo,
		jwtService: jwtService,
	}
}

// Register registers a new user
func (s *userService) Register(request models.RegisterRequest) (*models.User, error) {
	// Check if email already exists
	existingUser, _ := s.userRepo.FindByEmail(request.Email)
	if existingUser != nil {
		return nil, errors.New("email already exists")
	}
	
	// Check if phone already exists
	existingUserByPhone, _ := s.userRepo.FindByPhone(request.Phone)
	if existingUserByPhone != nil {
		return nil, errors.New("phone number already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Generate verification token
	verificationToken := generateRandomToken(32)

	// Create user
	user := &models.User{
		Email:             request.Email,
		Password:          string(hashedPassword),
		Name:              request.Name,
		Phone:             request.Phone,
		Status:            models.UserStatusPending,
		Role:              models.UserRoleUser,
		EmailVerified:     false,
		PhoneVerified:     false,
		VerificationToken: verificationToken,
		ReferredBy:        request.ReferralCode,
		ReferralCode:      generateReferralCode(),
		DeviceInfo:        request.DeviceInfo,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	// Save to database
	createdUser, err := s.userRepo.Create(user)
	if err != nil {
		return nil, err
	}

	// TODO: Send verification email
	// emailService.SendVerificationEmail(user.Email, verificationToken)

	return createdUser, nil
}

// Login authenticates a user
func (s *userService) Login(request models.LoginRequest) (*models.User, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(request.Email)
	if err != nil || user == nil {
		return nil, errors.New("invalid email or password")
	}

	// Check if user is active
	if user.Status != models.UserStatusActive {
		return nil, errors.New("account is not active")
	}

	// Check if account is locked
	if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
		return nil, errors.New("account is temporarily locked")
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(request.Password))
	if err != nil {
		// Increment failed login attempts
		s.incrementLoginAttempts(user)
		return nil, errors.New("invalid email or password")
	}

	// Check 2FA if enabled
	if user.TwoFactorEnabled {
		if request.OTPCode == "" {
			return nil, errors.New("2FA code required")
		}
		// Verify OTP
		// if !verifyOTP(user.TwoFactorSecret, request.OTPCode) {
		//     return nil, errors.New("invalid 2FA code")
		// }
	}

	// Reset login attempts on successful login
	user.LoginAttempts = 0
	user.LastLogin = &time.Time{}
	user.DeviceInfo = request.DeviceInfo
	s.userRepo.Update(user)

	return user, nil
}

// GetUserByID gets a user by ID
func (s *userService) GetUserByID(id string) (*models.User, error) {
	return s.userRepo.FindByID(id)
}

// GetUserByEmail gets a user by email
func (s *userService) GetUserByEmail(email string) (*models.User, error) {
	return s.userRepo.FindByEmail(email)
}

// UpdateUserProfile updates a user's profile
func (s *userService) UpdateUserProfile(id string, request models.UpdateProfileRequest) (*models.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if request.Name != "" {
		user.Name = request.Name
	}
	if request.Address != "" {
		user.Address = request.Address
	}
	if request.City != "" {
		user.City = request.City
	}
	if request.State != "" {
		user.State = request.State
	}
	if request.PostalCode != "" {
		user.PostalCode = request.PostalCode
	}
	if request.Country != "" {
		user.Country = request.Country
	}
	if request.DateOfBirth != nil {
		user.DateOfBirth = request.DateOfBirth
	}
	if request.Preferences != nil {
		user.Preferences = request.Preferences
	}

	user.UpdatedAt = time.Now()
	return s.userRepo.Update(user)
}

// ChangePassword changes a user's password
func (s *userService) ChangePassword(id string, request models.ChangePasswordRequest) error {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(request.CurrentPassword))
	if err != nil {
		return errors.New("current password is incorrect")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashedPassword)
	user.UpdatedAt = time.Now()

	_, err = s.userRepo.Update(user)
	return err
}

// GenerateResetPasswordToken generates a reset password token
func (s *userService) GenerateResetPasswordToken(email string) (string, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return "", err
	}

	resetToken := generateRandomToken(32)
	expiryTime := time.Now().Add(time.Hour * 24) // 24 hour expiry

	user.ResetPasswordToken = resetToken
	user.ResetTokenExpiry = &expiryTime
	user.UpdatedAt = time.Now()

	_, err = s.userRepo.Update(user)
	if err != nil {
		return "", err
	}

	// TODO: Send reset password email
	// emailService.SendResetPasswordEmail(user.Email, resetToken)

	return resetToken, nil
}

// ResetPassword resets a user's password
func (s *userService) ResetPassword(request models.ResetPasswordRequest) error {
	user, err := s.userRepo.FindByResetToken(request.Token)
	if err != nil {
		return errors.New("invalid token")
	}

	// Check if token is expired
	if user.ResetTokenExpiry.Before(time.Now()) {
		return errors.New("token has expired")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashedPassword)
	user.ResetPasswordToken = ""
	user.ResetTokenExpiry = nil
	user.UpdatedAt = time.Now()

	_, err = s.userRepo.Update(user)
	return err
}

// VerifyEmail verifies a user's email
func (s *userService) VerifyEmail(token string) error {
	user, err := s.userRepo.FindByVerificationToken(token)
	if err != nil {
		return errors.New("invalid verification token")
	}

	user.EmailVerified = true
	user.VerificationToken = ""
	
	// If this is the first verification, set status to active
	if user.Status == models.UserStatusPending {
		user.Status = models.UserStatusActive
	}
	
	user.UpdatedAt = time.Now()

	_, err = s.userRepo.Update(user)
	return err
}

// GetWatchlists gets a user's watchlists
func (s *userService) GetWatchlists(userId string) ([]models.Watchlist, error) {
	return s.userRepo.FindWatchlistsByUserID(userId)
}

// CreateWatchlist creates a new watchlist
func (s *userService) CreateWatchlist(userId string, name string, symbols []string) (*models.Watchlist, error) {
	watchlist := &models.Watchlist{
		UserID:    userId,
		Name:      name,
		Symbols:   symbols,
		IsDefault: false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return s.userRepo.CreateWatchlist(watchlist)
}

// UpdateWatchlist updates a watchlist
func (s *userService) UpdateWatchlist(id string, name string, symbols []string) (*models.Watchlist, error) {
	watchlist, err := s.userRepo.FindWatchlistByID(id)
	if err != nil {
		return nil, err
	}

	watchlist.Name = name
	watchlist.Symbols = symbols
	watchlist.UpdatedAt = time.Now()

	return s.userRepo.UpdateWatchlist(watchlist)
}

// DeleteWatchlist deletes a watchlist
func (s *userService) DeleteWatchlist(id string) error {
	return s.userRepo.DeleteWatchlist(id)
}

// CreateSession creates a new user session
func (s *userService) CreateSession(userId string, refreshToken string, userAgent string, ipAddress string) (*models.Session, error) {
	session := &models.Session{
		UserID:       userId,
		RefreshToken: refreshToken,
		UserAgent:    userAgent,
		IPAddress:    ipAddress,
		ExpiresAt:    time.Now().Add(time.Hour * 24 * 30), // 30 days
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	return s.userRepo.CreateSession(session)
}

// GetSessionByToken gets a session by refresh token
func (s *userService) GetSessionByToken(token string) (*models.Session, error) {
	return s.userRepo.FindSessionByToken(token)
}

// InvalidateSession invalidates a session
func (s *userService) InvalidateSession(id string) error {
	return s.userRepo.DeleteSession(id)
}

// InvalidateAllUserSessions invalidates all sessions for a user
func (s *userService) InvalidateAllUserSessions(userId string) error {
	return s.userRepo.DeleteAllUserSessions(userId)
}

// incrementLoginAttempts increments failed login attempts
func (s *userService) incrementLoginAttempts(user *models.User) {
	user.LoginAttempts++
	
	// Lock account after 5 failed attempts
	if user.LoginAttempts >= 5 {
		lockUntil := time.Now().Add(time.Minute * 30) // Lock for 30 minutes
		user.LockedUntil = &lockUntil
	}
	
	s.userRepo.Update(user)
}

// Helper functions
func generateRandomToken(length int) string {
	// Implementation omitted for brevity
	return "random-token-" + time.Now().Format("20060102150405")
}

func generateReferralCode() string {
	// Implementation omitted for brevity
	return "REF" + time.Now().Format("20060102150405")
}
