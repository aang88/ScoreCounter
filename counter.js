// counter.js - Reusable counter module

class CounterManager {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.socket = null;
        this.counters = {};
        this.onConnectionChange = null;
        this.onCounterUpdate = null;
        this.connected = false;
        this.debugElement = null;
        
        // For tap handling
        this.tapping = false;
    }
    
    // Initialize the WebSocket connection
    connect() {
        this.log('Connecting to WebSocket server...');
        
        this.socket = new WebSocket(this.serverUrl);
        
        this.socket.onopen = () => {
            this.connected = true;
            this.log('Connected to server');
            if (this.onConnectionChange) {
                this.onConnectionChange(true);
            }
        };
        
        this.socket.onclose = () => {
            this.connected = false;
            this.log('Disconnected from server');
            if (this.onConnectionChange) {
                this.onConnectionChange(false);
            }
            
            // Try to reconnect after 3 seconds
            setTimeout(() => this.connect(), 3000);
        };
        
        this.socket.onerror = (error) => {
            this.log('WebSocket error');
        };
        
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.log(`Received: ${JSON.stringify(data)}`);
                
                if (data.type === 'counters' && data.values) {
                    this.counters = data.values;
                    if (this.onCounterUpdate) {
                        this.onCounterUpdate(this.counters);
                    }
                }
            } catch (e) {
                this.log(`Error parsing message: ${e.message}`);
            }
        };
        
        // Start ping interval to keep connection alive
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
        }
        
        this._pingInterval = setInterval(() => {
            if (this.connected) {
                this.sendPing();
            }
        }, 30000);
    }
    
    // Set up a counter button
    setupButton(buttonElement, counterId) {
        // Set data attribute
        buttonElement.setAttribute('data-counter-id', counterId);
        
        // Add event listeners with debouncing to prevent double counting
        buttonElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.tapping) {
                this.tapping = true;
                this.log(`Button ${counterId} touched`);
                this.incrementCounter(counterId);
                
                setTimeout(() => {
                    this.tapping = false;
                }, 300);
            }
        });
        
        buttonElement.addEventListener('click', (e) => {
            if (!this.tapping) {
                this.log(`Button ${counterId} clicked`);
                this.incrementCounter(counterId);
            }
        });
        
        return this;
    }
    
    // Increment a counter
    incrementCounter(counterId,value) {
        if (!this.connected) {
            this.log(`Cannot increment ${counterId} - not connected`);
            return;
        }
        
        this.log(`Incrementing counter: ${counterId}`);
        this.socket.send(JSON.stringify({
            type: 'increment',
            counterId: counterId,
            value: value || 1
        }));
    }

    decrementCounter(counterId) {
        if (!this.connected) {
            this.log(`Cannot decrement ${counterId} - not connected`);
            return;
        }
        
        this.log(`Decrementing counter: ${counterId}`);
        this.socket.send(JSON.stringify({
            type: 'subtract-counter',
            counterId: counterId,
        }));
    }
    
    // Get current value of a counter
    getCounterValue(counterId) {
        return this.counters[counterId] || 0;
    }
    
    // Send ping to keep connection alive
    sendPing() {
        if (this.connected) {
            this.socket.send(JSON.stringify({
                type: 'ping'
            }));
            this.log('Ping sent');
        }
    }
    
    // Set debug element for logging
    setDebugElement(element) {
        this.debugElement = element;
        return this;
    }
    
    // Log a message to the debug element if available
    log(message) {
        if (this.debugElement) {
            const time = new Date().toLocaleTimeString();
            this.debugElement.innerHTML += `[${time}] ${message}<br>`;
            this.debugElement.scrollTop = this.debugElement.scrollHeight;
        }
        console.log(message);
    }
    
    // Clean up resources
    disconnect() {
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
        }
        if (this.socket) {
            this.socket.close();
        }
    }
}

// Export the CounterManager class
window.CounterManager = CounterManager;