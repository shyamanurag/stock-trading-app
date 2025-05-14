package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/yourusername/stockmarket-app/internal/models"
)

// Custom JWT claims struct
type JWTClaims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// JWTService provides JWT operations
type JWTService interface {
	GenerateToken(user models.User) (string, error)
	GenerateRefreshToken(user models.User) (string, error)
	ValidateToken(tokenString string) (*JWTClaims, error)
	ValidateRefreshToken(tokenString string) (*JWTClaims, error)
	ExtractTokenClaims(tokenString string) (*JWTClaims, error)
}

type jwtService struct {
	secretKey     string
	tokenExpiry   int // in minutes
	refreshSecret string
	refreshExpiry int // in days
}

// NewJWTService creates a new instance of JWTService
func NewJWTService(secretKey string, tokenExpiry int) JWTService {
	return &jwtService{
		secretKey:     secretKey,
		tokenExpiry:   tokenExpiry,
		refreshSecret: secretKey + "-refresh",
		refreshExpiry: 30, // 30 days
	}
}

// GenerateToken generates a new JWT token
func (j *jwtService) GenerateToken(user models.User) (string, error) {
	claims := &JWTClaims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute * time.Duration(j.tokenExpiry))),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "stockmarket-app",
			Subject:   user.ID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.secretKey))
}

// GenerateRefreshToken generates a new refresh token
func (j *jwtService) GenerateRefreshToken(user models.User) (string, error) {
	claims := &JWTClaims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24 * time.Duration(j.refreshExpiry))),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "stockmarket-app",
			Subject:   user.ID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.refreshSecret))
}

// ValidateToken validates the JWT token
func (j *jwtService) ValidateToken(tokenString string) (*JWTClaims, error) {
	return j.validateTokenWithSecret(tokenString, j.secretKey)
}

// ValidateRefreshToken validates the refresh token
func (j *jwtService) ValidateRefreshToken(tokenString string) (*JWTClaims, error) {
	return j.validateTokenWithSecret(tokenString, j.refreshSecret)
}

// validateTokenWithSecret validates a token with a specific secret
func (j *jwtService) validateTokenWithSecret(tokenString string, secret string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// ExtractTokenClaims extracts claims from token
func (j *jwtService) ExtractTokenClaims(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(j.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}
