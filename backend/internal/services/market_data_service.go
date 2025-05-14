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
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// Check if we have it in memory cache
	if quote, ok := s.quotes[key]; ok {
		return quote, nil
	}

	// Fallback to repository or API call
	if s.marketRepo != nil {
		quote, err := s.marketRepo.GetQuote(symbol, exchange)
		if err == nil && quote != nil {
			return quote, nil
		}
	}

	// Make API call if repository doesn't have it
	return s.fetchQuote(symbol, exchange)
}

// GetMarketDepth gets market depth for a symbol
func (s *marketDataService) GetMarketDepth(symbol string, exchange string) (*models.MarketDepth, error) {
	key := fmt.Sprintf("%s:%s", exchange, symbol)
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// Check if we have it in memory cache
	if depth, ok := s.depths[key]; ok {
		return depth, nil
	}

	// Fallback to repository or API call
	if s.marketRepo != nil {
		depth, err := s.marketRepo.GetMarketDepth(symbol, exchange)
		if err == nil && depth != nil {
			return depth, nil
		}
	}

	// Make API call if repository doesn't have it
	return s.fetchMarketDepth(symbol, exchange)
}

// GetHistoricalData gets historical data for a symbol
func (s *marketDataService) GetHistoricalData(symbol string, exchange string, interval string, startTime time.Time, endTime time.Time) (*models.HistoricalData, error) {
	// Check repository first
	if s.marketRepo != nil {
		data, err := s.marketRepo.GetHistoricalData(symbol, exchange, interval, startTime, endTime)
		if err == nil && data != nil {
			return data, nil
		}
	}

	// Fall back to API call
	return s.fetchHistoricalData(symbol, exchange, interval, startTime, endTime)
}

// GetSymbols gets all available symbols
func (s *marketDataService) GetSymbols() ([]models.Symbol, error) {
	// Check repository first
	if s.marketRepo != nil {
		symbols, err := s.marketRepo.GetSymbols()
		if err == nil && len(symbols) > 0 {
			return symbols, nil
		}
	}

	// Fall back to API call
	return s.fetchSymbols()
}

// GetIndices gets all market indices
func (s *marketDataService) GetIndices() ([]models.MarketIndex, error) {
	// Check repository first
	if s.marketRepo != nil {
		indices, err := s.marketRepo.GetIndices()
		if err == nil && len(indices) > 0 {
			return indices, nil
		}
	}

	// Fall back to API call
	return s.fetchIndices()
}

// OnQuoteUpdate registers a callback for quote updates
func (s *marketDataService) OnQuoteUpdate(callback func(quote *models.MarketQuote)) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.quoteCallbacks = append(s.quoteCallbacks, callback)
}

// OnDepthUpdate registers a callback for depth updates
func (s *marketDataService) OnDepthUpdate(callback func(depth *models.MarketDepth)) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.depthCallbacks = append(s.depthCallbacks, callback)
}

// IsConnected returns the connection status
func (s *marketDataService) IsConnected() bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.isConnected
}

// readMessages reads messages from WebSocket
func (s *marketDataService) readMessages() {
	for {
		select {
		case <-s.done:
			return
		default:
			if s.wsConn == nil {
				time.Sleep(time.Second)
				continue
			}

			_, message, err := s.wsConn.ReadMessage()
			if err != nil {
				log.Printf("Error reading message: %v", err)
				s.handleDisconnect()
				return
			}

			s.processMessage(message)
		}
	}
}

// processMessage processes a message from WebSocket
func (s *marketDataService) processMessage(message []byte) {
	// Determine message type
	var msg map[string]interface{}
	if err := json.Unmarshal(message, &msg); err != nil {
		log.Printf("Error unmarshaling message: %v", err)
		return
	}

	msgType, ok := msg["type"].(string)
	if !ok {
		log.Printf("Message missing type field")
		return
	}

	switch msgType {
	case "quote":
		var quote models.MarketQuote
		if err := json.Unmarshal(message, &quote); err != nil {
			log.Printf("Error unmarshaling quote: %v", err)
			return
		}
		s.updateQuote(&quote)

	case "depth":
		var depth models.MarketDepth
		if err := json.Unmarshal(message, &depth); err != nil {
			log.Printf("Error unmarshaling depth: %v", err)
			return
		}
		s.updateDepth(&depth)

	case "heartbeat":
		// Just a keep-alive message, ignore

	default:
		log.Printf("Unknown message type: %s", msgType)
	}
}

// updateQuote updates a quote and notifies callbacks
func (s *marketDataService) updateQuote(quote *models.MarketQuote) {
	key := fmt.Sprintf("%s:%s", quote.Exchange, quote.Symbol)
	
	s.mutex.Lock()
	s.quotes[key] = quote
	callbacks := s.quoteCallbacks // Take a copy to avoid holding the lock during callbacks
	s.mutex.Unlock()

	// Store in repository if available
	if s.marketRepo != nil {
		go s.marketRepo.SaveQuote(quote)
	}

	// Notify callbacks
	for _, callback := range callbacks {
		go callback(quote)
	}
}

// updateDepth updates market depth and notifies callbacks
func (s *marketDataService) updateDepth(depth *models.MarketDepth) {
	key := fmt.Sprintf("%s:%s", depth.Exchange, depth.Symbol)
	
	s.mutex.Lock()
	s.depths[key] = depth
	callbacks := s.depthCallbacks // Take a copy to avoid holding the lock during callbacks
	s.mutex.Unlock()

	// Store in repository if available
	if s.marketRepo != nil {
		go s.marketRepo.SaveMarketDepth(depth)
	}

	// Notify callbacks
	for _, callback := range callbacks {
		go callback(depth)
	}
}

// reconnectIfNeeded tries to reconnect if the connection is lost
func (s *marketDataService) reconnectIfNeeded() {
	for {
		select {
		case <-s.done:
			return
		case <-s.reconnectTicker.C:
			s.mutex.RLock()
			isConnected := s.isConnected
			s.mutex.RUnlock()

			if !isConnected {
				log.Println("Attempting to reconnect to market data service...")
				err := s.Connect()
				if err != nil {
					log.Printf("Reconnection failed: %v", err)
					continue
				}

				// Restore subscriptions
				s.mutex.RLock()
				subscriptions := make(map[string]bool)
				for k, v := range s.subscriptions {
					subscriptions[k] = v
				}
				s.mutex.RUnlock()

				for key := range subscriptions {
					parts := splitKey(key)
					if len(parts) == 2 {
						s.Subscribe(parts[1], parts[0])
					}
				}
			}
		}
	}
}

// handleDisconnect handles a disconnection event
func (s *marketDataService) handleDisconnect() {
	s.mutex.Lock()
	s.isConnected = false
	s.wsConn = nil
	s.mutex.Unlock()
}

// fetchQuote fetches a quote from the API
func (s *marketDataService) fetchQuote(symbol string, exchange string) (*models.MarketQuote, error) {
	// Implementation would make a REST API call to the market data provider
	// This is a mock implementation for demonstration
	
	// For mock data, return realistic values
	return &models.MarketQuote{
		Symbol:        symbol,
		Exchange:      exchange,
		LastPrice:     2456.75,
		Open:          2444.50,
		High:          2460.00,
		Low:           2432.25,
		Close:         2445.25, // Previous day close
		Change:        11.50,
		ChangePercent: 0.47,
		Volume:        1245780,
		AveragePrice:  2446.32,
		TotalBuyQty:   543218,
		TotalSellQty:  432156,
		Bid:           2456.50,
		BidQty:        500,
		Ask:           2457.00,
		AskQty:        750,
		LowerCircuit:  2200.75,
		UpperCircuit:  2690.00,
		YearHigh:      2780.50,
		YearLow:       1980.25,
		LastTradeTime: time.Now(),
		LastUpdateTime: time.Now(),
		MarketStatus:  models.MarketStatusOpen,
	}, nil
}

// fetchMarketDepth fetches market depth from the API
func (s *marketDataService) fetchMarketDepth(symbol string, exchange string) (*models.MarketDepth, error) {
	// Implementation would make a REST API call to the market data provider
	// This is a mock implementation for demonstration
	
	return &models.MarketDepth{
		Symbol:   symbol,
		Exchange: exchange,
		Bids: []models.DepthLevel{
			{Price: 2456.50, Quantity: 500, Orders: 3},
			{Price: 2456.25, Quantity: 750, Orders: 5},
			{Price: 2456.00, Quantity: 1200, Orders: 8},
			{Price: 2455.75, Quantity: 800, Orders: 4},
			{Price: 2455.50, Quantity: 1500, Orders: 10},
		},
		Asks: []models.DepthLevel{
			{Price: 2457.00, Quantity: 750, Orders: 4},
			{Price: 2457.25, Quantity: 600, Orders: 3},
			{Price: 2457.50, Quantity: 900, Orders: 6},
			{Price: 2457.75, Quantity: 500, Orders: 2},
			{Price: 2458.00, Quantity: 1100, Orders: 7},
		},
		LastUpdateTime: time.Now(),
	}, nil
}

// fetchHistoricalData fetches historical data from the API
func (s *marketDataService) fetchHistoricalData(symbol string, exchange string, interval string, startTime time.Time, endTime time.Time) (*models.HistoricalData, error) {
	// Implementation would make a REST API call to the market data provider
	// This is a mock implementation for demonstration
	
	// Generate mock candles
	candles := []models.OHLC{}
	currentTime := startTime
	
	for currentTime.Before(endTime) {
		candle := models.OHLC{
			Timestamp: currentTime,
			Open:      2450.0 + (rand.Float64() * 10.0) - 5.0,
			High:      0,
			Low:       0,
			Close:     0,
			Volume:    int64(100000 + rand.Intn(500000)),
		}
		
		// Make the high, low, close realistic relative to open
		candle.High = candle.Open + (rand.Float64() * 15.0)
		candle.Low = candle.Open - (rand.Float64() * 15.0)
		candle.Close = candle.Low + rand.Float64()*(candle.High-candle.Low)
		
		candles = append(candles, candle)
		
		// Increment time based on interval
		switch interval {
		case "1m":
			currentTime = currentTime.Add(time.Minute)
		case "5m":
			currentTime = currentTime.Add(time.Minute * 5)
		case "15m":
			currentTime = currentTime.Add(time.Minute * 15)
		case "30m":
			currentTime = currentTime.Add(time.Minute * 30)
		case "1h":
			currentTime = currentTime.Add(time.Hour)
		case "1d":
			currentTime = currentTime.Add(time.Hour * 24)
		default:
			currentTime = currentTime.Add(time.Hour * 24)
		}
	}
	
	return &models.HistoricalData{
		Symbol:    symbol,
		Exchange:  exchange,
		Interval:  interval,
		StartTime: startTime,
		EndTime:   endTime,
		Candles:   candles,
	}, nil
}

// fetchSymbols fetches all available symbols from the API
func (s *marketDataService) fetchSymbols() ([]models.Symbol, error) {
	// Implementation would make a REST API call to the market data provider
	// This is a mock implementation for demonstration
	
	// Return a few sample symbols
	return []models.Symbol{
		{
			Symbol:          "RELIANCE",
			Name:            "Reliance Industries Ltd.",
			Exchange:        "NSE",
			InstrumentType:  "EQ",
			Segment:         "NSE",
			Series:          "EQ",
			ISIN:            "INE002A01018",
			TickSize:        0.05,
			LotSize:         1,
			PricePrecision:  2,
			TradingPermitted: true,
			MarketLot:       1,
			FreezeQty:       1250000,
			MaxOrderSize:    1000000,
			LastUpdateTime:  time.Now(),
		},
		{
			Symbol:          "TCS",
			Name:            "Tata Consultancy Services Ltd.",
			Exchange:        "NSE",
			InstrumentType:  "EQ",
			Segment:         "NSE",
			Series:          "EQ",
			ISIN:            "INE467B01029",
			TickSize:        0.05,
			LotSize:         1,
			PricePrecision:  2,
			TradingPermitted: true,
			MarketLot:       1,
			FreezeQty:       125000,
			MaxOrderSize:    100000,
			LastUpdateTime:  time.Now(),
		},
		{
			Symbol:          "HDFC",
			Name:            "Housing Development Finance Corporation Ltd.",
			Exchange:        "NSE",
			InstrumentType:  "EQ",
			Segment:         "NSE",
			Series:          "EQ",
			ISIN:            "INE001A01036",
			TickSize:        0.05,
			LotSize:         1,
			PricePrecision:  2,
			TradingPermitted: true,
			MarketLot:       1,
			FreezeQty:       125000,
			MaxOrderSize:    100000,
			LastUpdateTime:  time.Now(),
		},
	}, nil
}

// fetchIndices fetches all market indices from the API
func (s *marketDataService) fetchIndices() ([]models.MarketIndex, error) {
	// Implementation would make a REST API call to the market data provider
	// This is a mock implementation for demonstration
	
	// Return a few sample indices
	return []models.MarketIndex{
		{
			Symbol:        "NIFTY 50",
			Name:          "NIFTY 50",
			LastPrice:     18245.32,
			Open:          18210.65,
			High:          18260.45,
			Low:           18190.20,
			Close:         18195.75,
			Change:        49.57,
			ChangePercent: 0.27,
			LastUpdateTime: time.Now(),
		},
		{
			Symbol:        "NIFTY BANK",
			Name:          "NIFTY BANK",
			LastPrice:     42567.80,
			Open:          42456.45,
			High:          42678.30,
			Low:           42356.15,
			Close:         42410.55,
			Change:        157.25,
			ChangePercent: 0.37,
			LastUpdateTime: time.Now(),
		},
		{
			Symbol:        "NIFTY IT",
			Name:          "NIFTY IT",
			LastPrice:     32156.40,
			Open:          32045.75,
			High:          32234.55,
			Low:           31989.30,
			Close:         32078.65,
			Change:        77.75,
			ChangePercent: 0.24,
			LastUpdateTime: time.Now(),
		},
	}, nil
}

// Helper function to split key into exchange and symbol
func splitKey(key string) []string {
	parts := strings.Split(key, ":")
	return parts
}
