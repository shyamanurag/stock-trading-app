// PostgreSQL Connection Pooling and Query Optimization in Go
// backend/config/db/postgres.go
package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v4/pgxpool"
	"your-app/config"
)

// PostgreSQL configuration
type PostgresConfig struct {
	Host             string
	Port             int
	User             string
	Password         string
	Database         string
	MaxConns         int32
	MinConns         int32
	MaxConnLifetime  time.Duration
	MaxConnIdleTime  time.Duration
	HealthCheckPeriod time.Duration
}

// Global DB pool variable
var DB *pgxpool.Pool

// Setup initializes the database pool
func SetupPostgres(ctx context.Context, cfg PostgresConfig) error {
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable&pool_max_conns=%d",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.Database, cfg.MaxConns)

	poolConfig, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return fmt.Errorf("unable to parse pool config: %v", err)
	}

	// Configure the connection pool parameters
	poolConfig.MaxConns = cfg.MaxConns                     // Maximum connections in the pool (recommend 2*CPU cores for web servers)
	poolConfig.MinConns = cfg.MinConns                     // Minimum idle connections to maintain
	poolConfig.MaxConnLifetime = cfg.MaxConnLifetime       // Maximum lifetime of a connection (recommended: 1 hour)
	poolConfig.MaxConnIdleTime = cfg.MaxConnIdleTime       // Maximum idle time for a connection (recommended: 30 minutes)
	poolConfig.HealthCheckPeriod = cfg.HealthCheckPeriod   // Period between health checks

	// Create the connection pool
	pool, err := pgxpool.ConnectConfig(ctx, poolConfig)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %v", err)
	}

	// Test the connection
	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("unable to ping database: %v", err)
	}

	DB = pool
	log.Println("Successfully connected to PostgreSQL database")
	return nil
}

// ClosePostgres closes the database pool
func ClosePostgres() {
	if DB != nil {
		DB.Close()
	}
}

// Redis Caching Implementation for Go
// backend/config/cache/redis.go
package cache

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/go-redis/redis/v8"
	"your-app/config"
)

// Redis client configuration
type RedisConfig struct {
	Host         string
	Port         int
	Password     string
	DB           int
	PoolSize     int
	MinIdleConns int
	MaxRetries   int
	DialTimeout  time.Duration
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

// Global Redis client
var RedisClient *redis.Client

// SetupRedis initializes the Redis client
func SetupRedis(cfg RedisConfig) error {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           cfg.DB,
		PoolSize:     cfg.PoolSize,         // Default: 10 connections per CPU
		MinIdleConns: cfg.MinIdleConns,     // Minimum number of idle connections
		MaxRetries:   cfg.MaxRetries,       // Maximum number of retries
		DialTimeout:  cfg.DialTimeout,      // Timeout for establishing new connections
		ReadTimeout:  cfg.ReadTimeout,      // Timeout for socket reads
		WriteTimeout: cfg.WriteTimeout,     // Timeout for socket writes
	})

	ctx := context.Background()
	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("unable to connect to Redis: %v", err)
	}

	log.Println("Successfully connected to Redis")
	return nil
}

// CloseRedis closes the Redis client
func CloseRedis() {
	if RedisClient != nil {
		_ = RedisClient.Close()
	}
}

// Generic cache interface for storing and retrieving data
type Cache interface {
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Get(ctx context.Context, key string, dest interface{}) error
	Delete(ctx context.Context, key string) error
	Exists(ctx context.Context, key string) (bool, error)
}

// Redis implementation of Cache interface
type RedisCache struct{}

// Set stores a value in Redis with an expiration
func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return RedisClient.Set(ctx, key, data, expiration).Err()
}

// Get retrieves a value from Redis and unmarshals it into dest
func (c *RedisCache) Get(ctx context.Context, key string, dest interface{}) error {
	data, err := RedisClient.Get(ctx, key).Bytes()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return fmt.Errorf("key %s not found", key)
		}
		return err
	}
	return json.Unmarshal(data, dest)
}

// Delete removes a key from Redis
func (c *RedisCache) Delete(ctx context.Context, key string) error {
	return RedisClient.Del(ctx, key).Err()
}

// Exists checks if a key exists in Redis
func (c *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	val, err := RedisClient.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return val > 0, nil
}

// NewRedisCache creates a new Redis cache instance
func NewRedisCache() Cache {
	return &RedisCache{}
}

// Database indexing strategy in PostgreSQL
/*
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_created_at ON trades(created_at);
CREATE INDEX idx_trades_status ON trades(status);

-- Compound index for common query patterns
CREATE INDEX idx_trades_user_symbol ON trades(user_id, symbol);
CREATE INDEX idx_trades_user_date ON trades(user_id, created_at DESC);

-- For time-series data, use BRIN indexes which are smaller and efficient for ordered data
CREATE INDEX idx_market_data_timestamp_brin ON market_data USING BRIN (timestamp);

-- Use partial indexes for frequently filtered subsets
CREATE INDEX idx_active_trades ON trades(user_id, symbol) WHERE status = 'active';

-- Use expression indexes for computed values
CREATE INDEX idx_lower_symbol ON trades(LOWER(symbol));
*/

// Optimized WebSocket Hub implementation in Go
// backend/services/websocket/hub.go
package websocket

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Client represents a connected WebSocket client
type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Send     chan []byte
	Topics   map[string]bool // Topics this client is subscribed to
	UserID   string
	mu       sync.Mutex      // Mutex for thread-safe operations
	lastPing time.Time       // Last ping time for health checks
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Topic-based subscriptions for efficient broadcasting
	topics map[string]map[*Client]bool

	// User-based mapping for targeting specific users
	users map[string]map[*Client]bool

	// Channel for inbound messages from clients
	broadcast chan *Message

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Topic subscription/unsubscription
	subscribe   chan *Subscription
	unsubscribe chan *Subscription

	// For graceful shutdown
	shutdown chan struct{}
	wg       sync.WaitGroup

	// For thread safety
	mu sync.RWMutex

	// Connection metrics
	metrics *HubMetrics
}

// Message represents a message to be broadcast
type Message struct {
	Topic   string
	Data    []byte
	Exclude *Client // Optional client to exclude from broadcast
	UserIDs []string // Optional specific users to target
}

// Subscription represents a client's subscription to a topic
type Subscription struct {
	Client *Client
	Topic  string
}

// HubMetrics tracks connection and message statistics
type HubMetrics struct {
	ConnectionCount      int64
	MessagesSent         int64
	MessagesReceived     int64
	SubscriptionCount    int64
	PeakConnectionCount  int64
	LastMinuteMessages   int64
	lastMinuteReset      time.Time
	lastMinuteMessagesMu sync.Mutex
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:     make(map[*Client]bool),
		topics:      make(map[string]map[*Client]bool),
		users:       make(map[string]map[*Client]bool),
		broadcast:   make(chan *Message, 10000), // Buffer for handling message peaks
		register:    make(chan *Client, 1000),   // Buffer for connection peaks
		unregister:  make(chan *Client, 1000),
		subscribe:   make(chan *Subscription, 1000),
		unsubscribe: make(chan *Subscription, 1000),
		shutdown:    make(chan struct{}),
		metrics:     &HubMetrics{lastMinuteReset: time.Now()},
	}
}

// Run starts the hub's main loop
func (h *Hub) Run(ctx context.Context) {
	defer h.wg.Done()
	h.wg.Add(1)

	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Hub shutting down due to context cancellation")
			close(h.shutdown)
			return
			
		case <-h.shutdown:
			log.Println("Hub shutting down")
			// Close all client connections
			h.mu.Lock()
			for client := range h.clients {
				close(client.Send)
				client.Conn.Close()
			}
			h.mu.Unlock()
			return

		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			if client.UserID != "" {
				if _, ok := h.users[client.UserID]; !ok {
					h.users[client.UserID] = make(map[*Client]bool)
				}
				h.users[client.UserID][client] = true
			}
			h.metrics.ConnectionCount++
			if h.metrics.ConnectionCount > h.metrics.PeakConnectionCount {
				h.metrics.PeakConnectionCount = h.metrics.ConnectionCount
			}
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				
				// Remove from topics
				for topic := range client.Topics {
					if _, ok := h.topics[topic]; ok {
						delete(h.topics[topic], client)
						if len(h.topics[topic]) == 0 {
							delete(h.topics, topic)
						}
					}
				}
				
				// Remove from users
				if client.UserID != "" {
					if userClients, ok := h.users[client.UserID]; ok {
						delete(userClients, client)
						if len(userClients) == 0 {
							delete(h.users, client.UserID)
						}
					}
				}
				
				close(client.Send)
				h.metrics.ConnectionCount--
			}
			h.mu.Unlock()

		case sub := <-h.subscribe:
			h.mu.Lock()
			// Add topic to client's subscriptions
			sub.Client.mu.Lock()
			sub.Client.Topics[sub.Topic] = true
			sub.Client.mu.Unlock()
			
			// Add client to topic's subscribers
			if _, ok := h.topics[sub.Topic]; !ok {
				h.topics[sub.Topic] = make(map[*Client]bool)
			}
			h.topics[sub.Topic][sub.Client] = true
			h.metrics.SubscriptionCount++
			h.mu.Unlock()

		case sub := <-h.unsubscribe:
			h.mu.Lock()
			// Remove topic from client's subscriptions
			sub.Client.mu.Lock()
			delete(sub.Client.Topics, sub.Topic)
			sub.Client.mu.Unlock()
			
			// Remove client from topic's subscribers
			if _, ok := h.topics[sub.Topic]; ok {
				delete(h.topics[sub.Topic], sub.Client)
				if len(h.topics[sub.Topic]) == 0 {
					delete(h.topics, sub.Topic)
				}
				h.metrics.SubscriptionCount--
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.metrics.MessagesReceived++
			h.metrics.lastMinuteMessagesMu.Lock()
			h.metrics.LastMinuteMessages++
			h.metrics.lastMinuteMessagesMu.Unlock()
			
			// Determine target clients
			var targetClients map[*Client]bool
			
			h.mu.RLock()
			if message.Topic != "" {
				// Topic-based targeting
				if topicClients, ok := h.topics[message.Topic]; ok {
					targetClients = make(map[*Client]bool, len(topicClients))
					for client := range topicClients {
						targetClients[client] = true
					}
				}
			} else if len(message.UserIDs) > 0 {
				// User-based targeting
				targetClients = make(map[*Client]bool)
				for _, userID := range message.UserIDs {
					if userClients, ok := h.users[userID]; ok {
						for client := range userClients {
							targetClients[client] = true
						}
					}
				}
			} else {
				// Broadcast to all
				targetClients = make(map[*Client]bool, len(h.clients))
				for client := range h.clients {
					targetClients[client] = true
				}
			}
			h.mu.RUnlock()
			
			// Exclude specified client if any
			if message.Exclude != nil && targetClients != nil {
				delete(targetClients, message.Exclude)
			}
			
			// Send to all target clients
			if targetClients != nil {
				for client := range targetClients {
					select {
					case client.Send <- message.Data:
						h.metrics.MessagesSent++
					default:
						// If client buffer is full, disconnect client
						h.mu.Lock()
						delete(h.clients, client)
						
						// Remove from topics
						for topic := range client.Topics {
							if topicClients, ok := h.topics[topic]; ok {
								delete(topicClients, client)
								if len(topicClients) == 0 {
									delete(h.topics, topic)
								}
							}
						}
						
						// Remove from users
						if client.UserID != "" {
							if userClients, ok := h.users[client.UserID]; ok {
								delete(userClients, client)
								if len(userClients) == 0 {
									delete(h.users, client.UserID)
								}
							}
						}
						
						close(client.Send)
						client.Conn.Close()
						h.metrics.ConnectionCount--
						h.mu.Unlock()
					}
				}
			}

		case <-ticker.C:
			// Periodic tasks (cleanup, metrics reset)
			now := time.Now()
			
			// Reset per-minute metrics
			if now.Sub(h.metrics.lastMinuteReset) >= time.Minute {
				h.metrics.lastMinuteMessagesMu.Lock()
				h.metrics.LastMinuteMessages = 0
				h.metrics.lastMinuteReset = now
				h.metrics.lastMinuteMessagesMu.Unlock()
			}
			
			// Health check and cleanup of stale connections
			h.mu.Lock()
			for client := range h.clients {
				client.mu.Lock()
				if now.Sub(client.lastPing) > 3*time.Minute {
					// Client hasn't pinged in too long, close connection
					log.Printf("Closing stale connection for user %s", client.UserID)
					client.mu.Unlock()
					
					delete(h.clients, client)
					
					// Remove from topics
					for topic := range client.Topics {
						if topicClients, ok := h.topics[topic]; ok {
							delete(topicClients, client)
							if len(topicClients) == 0 {
								delete(h.topics, topic)
							}
						}
					}
					
					// Remove from users
					if client.UserID != "" {
						if userClients, ok := h.users[client.UserID]; ok {
							delete(userClients, client)
							if len(userClients) == 0 {
								delete(h.users, client.UserID)
							}
						}
					}
					
					close(client.Send)
					client.Conn.Close()
					h.metrics.ConnectionCount--
				} else {
					client.mu.Unlock()
				}
			}
			h.mu.Unlock()
		}
	}
}

// Shutdown gracefully shuts down the hub
func (h *Hub) Shutdown() {
	close(h.shutdown)
	h.wg.Wait()
}

// Broadcast sends a message to all clients subscribed to a topic
func (h *Hub) Broadcast(topic string, data []byte, exclude *Client) {
	h.broadcast <- &Message{
		Topic:   topic,
		Data:    data,
		Exclude: exclude,
	}
}

// DirectMessage sends a message to specific users
func (h *Hub) DirectMessage(userIDs []string, data []byte) {
	h.broadcast <- &Message{
		UserIDs: userIDs,
		Data:    data,
	}
}

// GetMetrics returns the current hub metrics
func (h *Hub) GetMetrics() HubMetrics {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return *h.metrics
}

// Rate Limiting Middleware Implementation
// backend/middleware/ratelimit.go
package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"golang.org/x/time/rate"
	"your-app/config/cache"
)

// Local in-memory rate limiter for smaller deployments
type LocalRateLimiter struct {
	ipLimiters   map[string]*rate.Limiter
	userLimiters map[string]*rate.Limiter
	mu           sync.RWMutex
	limit        rate.Limit
	burst        int
}

// NewLocalRateLimiter creates a new local rate limiter
func NewLocalRateLimiter(rps int, burst int) *LocalRateLimiter {
	return &LocalRateLimiter{
		ipLimiters:   make(map[string]*rate.Limiter),
		userLimiters: make(map[string]*rate.Limiter),
		limit:        rate.Limit(rps),
		burst:        burst,
	}
}

// GetLimiter returns a rate limiter for the provided IP address
func (l *LocalRateLimiter) GetIPLimiter(ip string) *rate.Limiter {
	l.mu.RLock()
	limiter, exists := l.ipLimiters[ip]
	l.mu.RUnlock()

	if !exists {
		l.mu.Lock()
		limiter = rate.NewLimiter(l.limit, l.burst)
		l.ipLimiters[ip] = limiter
		l.mu.Unlock()
	}

	return limiter
}

// GetUserLimiter returns a rate limiter for the provided user ID
func (l *LocalRateLimiter) GetUserLimiter(userID string) *rate.Limiter {
	l.mu.RLock()
	limiter, exists := l.userLimiters[userID]
	l.mu.RUnlock()

	if !exists {
		l.mu.Lock()
		limiter = rate.NewLimiter(l.limit, l.burst)
		l.userLimiters[userID] = limiter
		l.mu.Unlock()
	}

	return limiter
}

// Gin middleware for local rate limiting
func LocalRateLimit(limiter *LocalRateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get client IP
		clientIP := c.ClientIP()
		
		// If user is authenticated, use user ID instead
		userID, _ := c.Get("userID")
		
		var allow bool
		
		if userID != nil {
			// Rate limit by user ID
			userLimiter := limiter.GetUserLimiter(userID.(string))
			allow = userLimiter.Allow()
		} else {
			// Rate limit by IP
			ipLimiter := limiter.GetIPLimiter(clientIP)
			allow = ipLimiter.Allow()
		}
		
		if !allow {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests, please try again later.",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// Redis-based rate limiter for distributed environments
func RedisRateLimit(redisClient *redis.Client, key string, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		
		// Determine the rate limit key (user ID or IP)
		var limitKey string
		userID, exists := c.Get("userID")
		
		if exists {
			limitKey = "rate:user:" + userID.(string)
		} else {
			limitKey = "rate:ip:" + c.ClientIP()
		}
		
		// Add endpoint-specific suffix
		limitKey = limitKey + ":" + key
		
		// Get current count
		count, err := redisClient.Incr(ctx, limitKey).Result()
		if err != nil {
			// If Redis fails, allow the request but log the error
			log.Printf("Rate limiting error: %v", err)
			c.Next()
			return
		}
		
		// Set expiry on new keys
		if count == 1 {
			redisClient.Expire(ctx, limitKey, window)
		}
		
		// Get the TTL for the header
		ttl, err := redisClient.TTL(ctx, limitKey).Result()
		if err == nil {
			c.Header("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(ttl).Unix(), 10))
		}
		
		// Set rate limit headers
		c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(int64(limit)-count, 10))
		
		// Check if over limit
		if count > int64(limit) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests, please try again later.",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// API Endpoint specific rate limits
func SetupRateLimits(r *gin.Engine, redisClient *redis.Client) {
	// Define endpoint-specific rate limits
	endpoints := map[string]struct {
		path   string
		limit  int
		window time.Duration
	}{
		"login":        {"/api/auth/login", 5, time.Minute},
		"register":     {"/api/auth/register", 3, time.Minute},
		"marketData":   {"/api/market-data/:symbol", 100, time.Minute},
		"placeOrder":   {"/api/orders", 20, time.Minute},
		"userProfile":  {"/api/users/:id", 30, time.Minute},
	}
	
	// Apply rate limits to each endpoint
	for key, endpoint := range endpoints {
		r.Use(func(c *gin.Context) {
			if c.FullPath() == endpoint.path {
				RedisRateLimit(redisClient, key, endpoint.limit, endpoint.window)(c)
			} else {
				c.Next()
			}
		})
	}
	
	// Global fallback rate limit for all routes
	localLimiter := NewLocalRateLimiter(50, 100) // 50 requests per second, burst of 100
	r.Use(LocalRateLimit(localLimiter))
}

// DoS Protection with Circuit Breaker Pattern
// backend/middleware/circuitbreaker.go
package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// CircuitBreaker implements the circuit breaker pattern
type CircuitBreaker struct {
	name          string
	maxFailures   uint
	timeout       time.Duration
	failures      uint
	lastFailure   time.Time
	state         State
	mutex         sync.RWMutex
	onStateChange func(name string, from, to State)
}

// State represents the state of the circuit breaker
type State int

const (
	StateClosed State = iota
	StateOpen
	StateHalfOpen
)

// NewCircuitBreaker creates a new circuit breaker
func NewCircuitBreaker(name string, maxFailures uint, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		name:        name,
		maxFailures: maxFailures,
		timeout:     timeout,
		state:       StateClosed,
	}
}

// OnStateChange sets a callback function to be called when the state changes
func (cb *CircuitBreaker) OnStateChange(fn func(name string, from, to State)) {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	cb.onStateChange = fn
}

// State returns the current state of the circuit breaker
func (cb *CircuitBreaker) CurrentState() State {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()
	return cb.state
}

// Execute executes the given function if the circuit breaker is in the closed or half-open state
func (cb *CircuitBreaker) Execute(fn func() error) error {
	if !cb.Allow() {
		return fmt.Errorf("circuit breaker is open")
	}

	err := fn()
	
	if err != nil {
		cb.RecordFailure()
		return err
	}
	
	cb.RecordSuccess()
	return nil
}

// Allow checks if a request is allowed to proceed
func (cb *CircuitBreaker) Allow() bool {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()

	switch cb.state {
	case StateClosed:
		return true
		
	case StateOpen:
		// Check if timeout has expired
		if cb.lastFailure.Add(cb.timeout).Before(time.Now()) {
			// Move to half-open state
			cb.mutex.RUnlock()
			cb.setState(StateHalfOpen)
			cb.mutex.RLock()
			return true
		}
		return false
		
	case StateHalfOpen:
		// In half-open state, only allow one request at a time
		return true
		
	default:
		return false
	}
}

// RecordFailure records a failure and updates the circuit breaker state
func (cb *CircuitBreaker) RecordFailure() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()

	cb.failures++
	cb.lastFailure = time.Now()

	if (cb.state == StateClosed && cb.failures >= cb.maxFailures) || cb.state == StateHalfOpen {
		cb.setState(StateOpen)
	}
}

// RecordSuccess records a success and updates the circuit breaker state
func (cb *CircuitBreaker) RecordSuccess() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()

	if cb.state == StateHalfOpen {
		cb.setState(StateClosed)
		cb.failures = 0
	} else if cb.state == StateClosed {
		// Reset failures counter on success
		cb.failures = 0
	}
}

// setState changes the state of the circuit breaker
func (cb *CircuitBreaker) setState(state State) {
	if cb.state == state {
		return
	}

	oldState := cb.state
	cb.state = state

	if cb.onStateChange != nil {
		cb.onStateChange(cb.name, oldState, state)
	}
}

// Gin middleware for circuit breaker
func CircuitBreakerMiddleware(cb *CircuitBreaker) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cb.Allow() {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "Service temporarily unavailable, please try again later",
			})
			c.Abort()
			return
		}

		// Store the status code
		c.Writer.CloseNotify()
		
		// Process request
		c.Next()

		// If status code indicates a server error, record a failure
		if c.Writer.Status() >= 500 {
			cb.RecordFailure()
		} else {
			cb.RecordSuccess()
		}
	}
}

// Example of setting up circuit breakers for critical endpoints
func SetupCircuitBreakers(r *gin.Engine) {
	// Circuit breaker for order placement
	orderCB := NewCircuitBreaker("orders", 10, 30*time.Second)
	orderCB.OnStateChange(func(name string, from, to State) {
		log.Printf("Circuit breaker %s changed from %v to %v", name, from, to)
	})

	// Circuit breaker for market data
	marketDataCB := NewCircuitBreaker("market-data", 20, 15*time.Second)
	
	// Apply circuit breakers to specific routes
	r.POST("/api/orders", CircuitBreakerMiddleware(orderCB))
	r.GET("/api/market-data/:symbol", CircuitBreakerMiddleware(marketDataCB))
}
