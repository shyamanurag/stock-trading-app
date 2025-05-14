// stock-trading-app/frontend/src/services/websocket.service.js
// Implement robust WebSocket handling with reconnection logic

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.reconnectTimeout = null;
  }

  connect(token) {
    return new Promise((resolve, reject) => {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws?token=${token}`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('WebSocket connected');
        resolve();
      };
      
      this.socket.onclose = (event) => {
        this.isConnected = false;
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        this.attemptReconnect();
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;
          
          if (this.listeners.has(type)) {
            this.listeners.get(type).forEach(callback => callback(payload));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    });
  }

  subscribe(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
      
      // Send subscription request to server if needed
      if (this.isConnected) {
        this.sendMessage({
          action: 'subscribe',
          channel: type
        });
      }
    }
    
    this.listeners.get(type).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        this.listeners.delete(type);
        
        // Send unsubscribe request to server if needed
        if (this.isConnected) {
          this.sendMessage({
            action: 'unsubscribe',
            channel: type
          });
        }
      }
    };
  }

  sendMessage(data) {
    if (this.isConnected) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('Cannot send message: WebSocket not connected');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.isConnected = false;
    this.listeners.clear();
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect()
          .catch(error => {
            console.error('Reconnection failed:', error);
          });
      }, delay);
    } else {
      console.error('Maximum reconnection attempts reached');
    }
  }
}

// Singleton instance
const websocketService = new WebSocketService();
export default websocketService;
