package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/yourusername/stockmarket-app/internal/models"
	"github.com/yourusername/stockmarket-app/internal/repositories"
)

// MarketDataService provides market data operations
type MarketDataService interface {
	Connect() error
	Disconnect() error
	Subscribe(symbol string, exchange string) error
	Unsubscribe(symbol string, exchange string) error
	GetQuote(symbol string, exchange string) (*models.MarketQuote, error)
	GetMarketDepth(symbol string, exchange string) (*models.MarketDepth, error)
	GetHistoricalData(symbol string, exchange string, interval string, startTime time.Time, endTime time.Time) (*models.HistoricalData, error)
	GetSymbols() ([]models.Symbol, error)
	GetIndices() ([]models.MarketIndex, error)
	OnQuoteUpdate(callback func(quote *models.MarketQuote))
	OnDepthUpdate(callback func(depth *models.MarketDepth))
	IsConnected() bool
}

type marketDataService struct {
	apiURL          string
	apiKey          string
	wsConn          *websocket.Conn
	isConnected     bool
	subscriptions   map[string]bool
	quotes          map[string]*models.MarketQuote
	depths          map[string]*models.MarketDepth
	quoteCallbacks  []func(quote *models.MarketQuote)
	depthCallbacks  []func(depth *models.MarketDepth)
	mutex           sync.RWMutex
	reconnectTicker *time.Ticker
	done            chan struct{}
	marketRepo      repositories.MarketRepository
}

// NewMarketDataService creates a new market data service
func NewMarketDataService() MarketDataService {
	return &marketDataService{
		apiURL:        "https://api.nse.example.com", // Replace with actual NSE API URL
		apiKey:        "your-api-key",                // Should be loaded from config
		subscriptions: make(map[string]bool),
		quotes:        make(map[string]*models.MarketQuote),
		depths:        make(map[string]*models.MarketDepth),
		quoteCallbacks: []func(quote *models.MarketQuote){},
		depthCallbacks: []func(depth *models.MarketDepth){},
		done:          make(chan struct{}),
	}
}

// Initialize with repository
func (s *marketDataService) Initialize(marketRepo repositories.MarketRepository) {
	s.marketRepo = marketRepo
}

// Connect establishes a connection to the market data provider
func (s *marketDataService) Connect() error {
	if s.isConnected {
		return nil
	}

	// Establish WebSocket connection
	dialer := &websocket.Dialer{}
	conn, _, err := dialer.Dial(s.apiURL+"/ws", nil)
	if err != nil {
		return err
	}

	s.wsConn = conn
	s.isConnected = true

	// Start reading messages
	go s.readMessages()

	// Start reconnection ticker
	s.reconnectTicker = time.NewTicker(time.Second * 30)
	go s.reconnectIfNeeded()

	// Authentication message
	authMsg := map[string]string{
		"type": "auth",
		"key":  s.apiKey,
	}
	err = s.wsConn.WriteJSON(authMsg)
	if err != nil {
		s.Disconnect()
		return err
	}

	return nil
}

// Disconnect closes the connection
func (s *marketDataService) Disconnect() error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if !s.isConnected {
		return nil
	}

	// Stop reconnection ticker
	if s.reconnectTicker != nil {
		s.reconnectTicker.Stop()
	}

	// Close done channel
	close(s.done)

	// Close WebSocket connection
	err := s.wsConn.Close()
	s.isConnected = false
	s.wsConn = nil
	return err
}

// Subscribe to market data for a symbol
func (s *marketDataService) Subscribe(symbol string, exchange string) error {
	if !s.isConnected {
		if err := s.Connect(); err != nil {
			return err
		}
	}

	key := fmt.Sprintf("%s:%s", exchange, symbol)
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.subscriptions[key] {
		return nil // Already subscribed
	}

	// Send subscription message
	subMsg := map[string]string{
		"type":     "subscribe",
		"symbol":   symbol,
		"exchange": exchange,
	}
	err := s.wsConn.WriteJSON(subMsg)
	if err != nil {
		return err
	}

	s.subscriptions[key] = true
	return nil
}

// Unsubscribe from market data for a symbol
func (s *marketDataService) Unsubscribe(symbol string, exchange string) error {
	if !s.isConnected {
		return nil
	}

	key := fmt.Sprintf("%s:%s", exchange, symbol)
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if !s.subscriptions[key] {
		return nil // Not subscribed
	}

	// Send unsubscription message
	unsubMsg := map[string]string{
		"type":     "unsubscribe",
		"symbol":   symbol,
		"exchange": exchange,
	}
	err := s.wsConn.WriteJSON(unsubMsg)
	if err != nil {
		return err
	}

	delete(s.subscriptions, key)
	return nil
}

// GetQuote gets a quote for a symbol
func (s *marketDataService) GetQuote(symbol string, exchange string) (*models.MarketQuote, error) {
	key := fmt.Sprintf("%s:%s", exchange, symbol)
	s.mutex.R
