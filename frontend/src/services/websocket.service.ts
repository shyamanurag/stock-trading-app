// Path: stock-trading-app/frontend/src/services/websocket.service.ts

type MessageCallback = (payload: any) => void;

interface WebSocketMessage {
  type: string;
  payload: any;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private listeners: Map<string, MessageCallback[]> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private token: string = '';

  connect(token: string): Promise<void> {
    this.token = token;
    
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws?token=${token}`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('WebSocket connected');
          
          // Re-subscribe to all channels after reconnection
          if (this.listeners.size > 0) {
            this.listeners.forEach((_, type) => {
              this.sendMessage({
                action: 'subscribe',
                channel: type
              });
            });
          }
          
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
            const data = JSON.parse(event.data) as WebSocketMessage;
            const { type, payload } = data;
            
            if (this.listeners.has(type)) {
              const callbacks = this.listeners.get(type);
              if (callbacks) {
                callbacks.forEach(callback => callback(payload));
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reject(error);
      }
    });
  }

  subscribe(type: string, callback: MessageCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
      
      // Send subscription request to server if already connected
      if (this.isConnected) {
        this.sendMessage({
          action: 'subscribe',
          channel: type
        });
      }
    }
    
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.push(callback);
    }
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
          
          if (callbacks.length === 0) {
            this.listeners.delete(type);
            
            // Send unsubscribe request to server if connected
            if (this.isConnected) {
              this.sendMessage({
                action: 'unsubscribe',
                channel: type
              });
            }
          }
        }
      }
    };
  }

  sendMessage(data: any): void {
    if (this.isConnected && this.socket) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('Cannot send message: WebSocket not connected');
    }
  }

  disconnect(): void {
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

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect(this.token)
          .catch(error => {
            console.error('Reconnection failed:', error);
          });
      }, delay);
    } else {
      console.error('Maximum reconnection attempts reached');
      // You could dispatch a Redux action here to show a notification to the user
    }
  }
  
  // Utility methods for specific message types
  
  // Subscribe to market data updates for a symbol
  subscribeToMarketData(symbol: string, callback: MessageCallback): () => void {
    return this.subscribe(`market:${symbol}`, callback);
  }
  
  // Subscribe to order updates
  subscribeToOrderUpdates(userId: string, callback: MessageCallback): () => void {
    return this.subscribe(`orders:${userId}`, callback);
  }
  
  // Subscribe to portfolio updates
  subscribeToPortfolioUpdates(userId: string, callback: MessageCallback): () => void {
    return this.subscribe(`portfolio:${userId}`, callback);
  }
  
  // Place a trade order
  placeOrder(order: any): void {
    this.sendMessage({
      action: 'placeOrder',
      data: order
    });
  }
  
  // Cancel an order
  cancelOrder(orderId: string): void {
    this.sendMessage({
      action: 'cancelOrder',
      data: { orderId }
    });
  }
}

// Singleton instance
const websocketService = new WebSocketService();
export default websocketService;
