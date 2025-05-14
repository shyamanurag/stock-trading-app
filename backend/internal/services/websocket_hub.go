package services

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// ClientMessage represents a message from a client
type ClientMessage struct {
	Type      string          `json:"type"`
	RequestID string          `json:"requestId,omitempty"`
	Data      json.RawMessage `json:"data"`
}

// ServerMessage represents a message to a client
type ServerMessage struct {
	Type      string      `json:"type"`
	RequestID string      `json:"requestId,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	Error     string      `json:"error,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

// Client represents a connected client
type Client struct {
	Hub      *WebSocketHub
	Conn     *websocket.Conn
	Send     chan ServerMessage
	UserID   string
	Topics   map[string]bool
	IsAuth   bool
	LastPing time.Time
	mu       sync.Mutex
}

// WebSocketHub maintains the set of active clients and broadcasts messages
type WebSocketHub struct {
	// Registered clients
	clients map[*Client]bool

	// User to clients mapping for direct messages
	userClients map[string][]*Client

	// Topic to clients mapping for topic-based messages
	topicClients map[string][]*Client

	// Inbound messages from clients
	broadcast chan ServerMessage

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for concurrent access
	mu sync.RWMutex
}

// NewWebSocketHub creates a new WebSocketHub
func NewWebSocketHub() *WebSocketHub {
	return &WebSocketHub{
		broadcast:    make(chan ServerMessage),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		clients:      make(map[*Client]bool),
		userClients:  make(map[string][]*Client),
		topicClients: make(map[string][]*Client),
	}
}

// Run starts the WebSocketHub
func (h *WebSocketHub) Run() {
	pingTicker := time.NewTicker(time.Second * 30)
	defer pingTicker.Stop()

	for {
		select {
		case client := <-h.register:
			h.registerClient(client)
		case client := <-h.unregister:
			h.unregisterClient(client)
		case message := <-h.broadcast:
			h.broadcastMessage(message)
		case <-pingTicker.C:
			h.pingClients()
		}
	}
}

// registerClient registers a client
func (h *WebSocketHub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.clients[client] = true
	log.Printf("Client connected, total clients: %d", len(h.clients))

	// If authenticated, add to user clients
	if client.IsAuth && client.UserID != "" {
		h.userClients[client.UserID] = append(h.userClients[client.UserID], client)
	}
}

// unregisterClient unregisters a client
func (h *WebSocketHub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		close(client.Send)

		// Remove from user clients
		if client.IsAuth && client.UserID != "" {
			if clients, ok := h.userClients[client.UserID]; ok {
				for i, c := range clients {
					if c == client {
						h.userClients[client.UserID] = append(clients[:i], clients[i+1:]...)
						break
					}
				}
				// If no more clients for this user, remove the user entry
				if len(h.userClients[client.UserID]) == 0 {
					delete(h.userClients, client.UserID)
				}
			}
		}

		// Remove from topic clients
		for topic := range client.Topics {
			if clients, ok := h.topicClients[topic]; ok {
				for i, c := range clients {
					if c == client {
						h.topicClients[topic] = append(clients[:i], clients[i+1:]...)
						break
					}
				}
				// If no more clients for this topic, remove the topic entry
				if len(h.topicClients[topic]) == 0 {
					delete(h.topicClients, topic)
				}
			}
		}

		log.Printf("Client disconnected, remaining clients: %d", len(h.clients))
	}
}

// broadcastMessage broadcasts a message to all clients
func (h *WebSocketHub) broadcastMessage(message ServerMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		select {
		case client.Send <- message:
		default:
			// If the client's send buffer is full, unregister the client
			go h.unregister <- client
		}
	}
}

// SendToUser sends a message to a specific user
func (h *WebSocketHub) SendToUser(userID string, message ServerMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.userClients[userID]; ok {
		for _, client := range clients {
			select {
			case client.Send <- message:
			default:
				// If the client's send buffer is full, unregister the client
				go h.unregister <- client
			}
		}
	}
}

// SendToTopic sends a message to all clients subscribed to a topic
func (h *WebSocketHub) SendToTopic(topic string, message ServerMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.topicClients[topic]; ok {
		for _, client := range clients {
			select {
			case client.Send <- message:
			default:
				// If the client's send buffer is full, unregister the client
				go h.unregister <- client
			}
		}
	}
}

// SubscribeToTopic subscribes a client to a topic
func (h *WebSocketHub) SubscribeToTopic(client *Client, topic string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Add topic to client's topics
	client.mu.Lock()
	client.Topics[topic] = true
	client.mu.Unlock()

	// Add client to topic's clients
	h.topicClients[topic] = append(h.topicClients[topic], client)
}

// UnsubscribeFromTopic unsubscribes a client from a topic
func (h *WebSocketHub) UnsubscribeFromTopic(client *Client, topic string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Remove topic from client's topics
	client.mu.Lock()
	delete(client.Topics, topic)
	client.mu.Unlock()

	// Remove client from topic's clients
	if clients, ok := h.topicClients[topic]; ok {
		for i, c := range clients {
			if c == client {
				h.topicClients[topic] = append(clients[:i], clients[i+1:]...)
				break
			}
		}
		// If no more clients for this topic, remove the topic entry
		if len(h.topicClients[topic]) == 0 {
			delete(h.topicClients, topic)
		}
	}
}

// SetUserID sets the user ID for a client
func (h *WebSocketHub) SetUserID(client *Client, userID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Remove from previous user's clients if any
	if client.IsAuth && client.UserID != "" && client.UserID != userID {
		if clients, ok := h.userClients[client.UserID]; ok {
			for i, c := range clients {
				if c == client {
					h.userClients[client.UserID] = append(clients[:i], clients[i+1:]...)
					break
				}
			}
			// If no more clients for this user, remove the user entry
			if len(h.userClients[client.UserID]) == 0 {
				delete(h.userClients, client.UserID)
			}
		}
	}

	// Set new user ID
	client.UserID = userID
	client.IsAuth = true

	// Add to new user's clients
	h.userClients[userID] = append(h.userClients[userID], client)
}

// pingClients sends a ping to all clients
func (h *WebSocketHub) pingClients() {
	h.mu.RLock()
	defer h.mu.RUnlock()

	now := time.Now()
	pingMessage := ServerMessage{
		Type:      "ping",
		Timestamp: now.Unix(),
	}

	for client := range h.clients {
		// Check if client is still alive
		if client.LastPing.Add(time.Minute * 2).Before(now) {
			// Client hasn't responded to ping for 2 minutes, disconnect
			go h.unregister <- client
			continue
		}

		select {
		case client.Send <- pingMessage:
		default:
			// If the client's send buffer is full, unregister the client
			go h.unregister <- client
		}
	}
}

// NewClient creates a new client
func (h *WebSocketHub) NewClient(conn *websocket.Conn) *Client {
	return &Client{
		Hub:      h,
		Conn:     conn,
		Send:     make(chan ServerMessage, 256),
		Topics:   make(map[string]bool),
		LastPing: time.Now(),
	}
}

// ReadPump pumps messages from the websocket connection to the hub
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512 * 1024) // 512KB max message size
	c.Conn.SetReadDeadline(time.Now().Add(time.Minute * 2))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(time.Minute * 2))
		c.mu.Lock()
		c.LastPing = time.Now()
		c.mu.Unlock()
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		var clientMsg ClientMessage
		if err := json.Unmarshal(message, &clientMsg); err != nil {
			log.Printf("Failed to parse client message: %v", err)
			c.SendError("Invalid message format", clientMsg.RequestID)
			continue
		}

		c.ProcessMessage(clientMsg)
	}
}

// WritePump pumps messages from the hub to the websocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(time.Second * 30)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(time.Second * 10))
			if !ok {
				// The hub closed the channel
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			message.Timestamp = time.Now().Unix()
			encodedMsg, err := json.Marshal(message)
			if err != nil {
				log.Printf("Failed to encode message: %v", err)
				return
			}

			w.Write(encodedMsg)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(time.Second * 10))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ProcessMessage processes a client message
func (c *Client) ProcessMessage(msg ClientMessage) {
	switch msg.Type {
	case "pong":
		c.mu.Lock()
		c.LastPing = time.Now()
		c.mu.Unlock()

	case "auth":
		var authData struct {
			Token string `json:"token"`
		}
		if err := json.Unmarshal(msg.Data, &authData); err != nil {
			c.SendError("Invalid auth data", msg.RequestID)
			return
		}

		// TODO: Validate token and get user ID
		// This should use the JWT service to validate the token
		userID := "mock-user-id" // Replace with actual token validation
		c.Hub.SetUserID(c, userID)
		
		c.SendSuccess("Authentication successful", msg.RequestID)

	case "subscribe":
		var subData struct {
			Topic string `json:"topic"`
		}
		if err := json.Unmarshal(msg.Data, &subData); err != nil {
			c.SendError("Invalid subscription data", msg.RequestID)
			return
		}

		c.Hub.SubscribeToTopic(c, subData.Topic)
		c.SendSuccess("Subscribed to "+subData.Topic, msg.RequestID)

	case "unsubscribe":
		var unsubData struct {
			Topic string `json:"topic"`
		}
		if err := json.Unmarshal(msg.Data, &unsubData); err != nil {
			c.SendError("Invalid unsubscription data", msg.RequestID)
			return
		}

		c.Hub.UnsubscribeFromTopic(c, unsubData.Topic)
		c.SendSuccess("Unsubscribed from "+unsubData.Topic, msg.RequestID)

	default:
		c.SendError("Unknown message type", msg.RequestID)
	}
}

// SendError sends an error message to the client
func (c *Client) SendError(message string, requestID string) {
	select {
	case c.Send <- ServerMessage{
		Type:      "error",
		RequestID: requestID,
		Error:     message,
		Timestamp: time.Now().Unix(),
	}:
	default:
		// If the send buffer is full, unregister the client
		c.Hub.unregister <- c
	}
}

// SendSuccess sends a success message to the client
func (c *Client) SendSuccess(message string, requestID string) {
	select {
	case c.Send <- ServerMessage{
		Type:      "success",
		RequestID: requestID,
		Data:      message,
		Timestamp: time.Now().Unix(),
	}:
	default:
		// If the send buffer is full, unregister the client
		c.Hub.unregister <- c
	}
}

// SendData sends data to the client
func (c *Client) SendData(messageType string, data interface{}, requestID string) {
	select {
	case c.Send <- ServerMessage{
		Type:      messageType,
		RequestID: requestID,
		Data:      data,
		Timestamp: time.Now().Unix(),
	}:
	default:
		// If the send buffer is full, unregister the client
		c.Hub.unregister <- c
	}
}
