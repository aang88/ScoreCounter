document.addEventListener('DOMContentLoaded', function() {
    // Initialize the counter manager
    const counterManager = new CounterManager('ws://192.168.2.61:8765');
    
    // Get references to DOM elements
    const addButton1 = document.getElementById('button1');
    const subtractButton1 = document.getElementById('subtractButton1');
    const addButton2 = document.getElementById('button2');
    const subtractButton2 = document.getElementById('subtractButton2');
    const value1 = document.getElementById('value1');
    const value2 = document.getElementById('value2');
    const statusDiv = document.getElementById('statusDiv');
    
    // Timer elements
    const timerDisplay = document.getElementById('timerDisplay');
    const startTimerBtn = document.getElementById('startTimerBtn');
    const pauseTimerBtn = document.getElementById('pauseTimerBtn');
    const resetTimerBtn = document.getElementById('resetTimerBtn');
    
    // Initialize timer manager with null socket - will update after connection
    const timerManager = new TimerManager(null);
    timerManager.setTimerElement(timerDisplay);
    timerManager.setDuration(60);
    
    // Function to update button states
    function updateButtonStates(isRunning) {
        console.log("Updating button states, isRunning:", isRunning);
        if (startTimerBtn) startTimerBtn.disabled = isRunning;
        if (pauseTimerBtn) pauseTimerBtn.disabled = !isRunning;
    }
    
    // Handle connection changes
    counterManager.onConnectionChange = function(connected) {
        if (connected) {
            statusDiv.textContent = 'Connected';
            statusDiv.style.color = 'green';
            
            // Update timer manager with connected socket
            timerManager.websocket = counterManager.socket;
            
            // Immediately request current timer state
            counterManager.socket.send(JSON.stringify({
                type: 'timer-sync-request'
            }));
            
            // Set up timer button events - these are local UI events
            if (startTimerBtn) {
                startTimerBtn.addEventListener('click', () => {
                    timerManager.start();
                    updateButtonStates(true);
                });
            }
            
            if (pauseTimerBtn) {
                pauseTimerBtn.addEventListener('click', () => {
                    timerManager.pause();
                    updateButtonStates(false);
                });
                pauseTimerBtn.disabled = true; // Initially disabled
            }
            
            if (resetTimerBtn) {
                resetTimerBtn.addEventListener('click', () => {
                    timerManager.reset();
                    updateButtonStates(false);
                });
            }
            
            // Enable counter buttons
            if (addButton1) addButton1.disabled = false;
            if (subtractButton1) subtractButton1.disabled = false;
            if (addButton2) addButton2.disabled = false;
            if (subtractButton2) subtractButton2.disabled = false;
        } else {
            statusDiv.textContent = 'Disconnected';
            statusDiv.style.color = 'red';
            
            // Disable all buttons when disconnected
            if (addButton1) addButton1.disabled = true;
            if (subtractButton1) subtractButton1.disabled = true;
            if (addButton2) addButton2.disabled = true;
            if (subtractButton2) subtractButton2.disabled = true;
            if (startTimerBtn) startTimerBtn.disabled = true;
            if (pauseTimerBtn) pauseTimerBtn.disabled = true;
            if (resetTimerBtn) resetTimerBtn.disabled = true;
        }
    };
    
    // THIS IS THE KEY FIX - Replace the WebSocket message handler
    // We're replacing the whole connect method to ensure we handle all messages properly
    counterManager.connect = function() {
        console.log('Creating WebSocket connection to:', this.serverUrl);
        
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
        
        // CRITICAL PART: Set up message handler to handle both counter and timer
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                console.log("Message received:", data);
                
                // First handle counter updates
                if (data.type === 'counters' && data.values) {
                    this.counters = data.values;
                    
                    // Update UI elements
                    if (value1) value1.textContent = this.counters.red || 0;
                    if (value2) value2.textContent = this.counters.blue || 0;
                    
                    if (this.onCounterUpdate) {
                        this.onCounterUpdate(this.counters);
                    }
                }
                
                // Then handle timer updates - THIS IS THE KEY PART FOR TIMER SYNC
                if (data.type && data.type.startsWith('timer-')) {
                    console.log("TIMER EVENT FROM SERVER:", data.type);
                    
                    // Ensure timer manager has latest socket reference
                    timerManager.websocket = this.socket;
                    
                    // Process the message in timer manager
                    timerManager.handleServerMessage(data);
                    
                    // Update button states based on the timer state
                    if (data.type === 'timer-start') {
                        console.log("Received start command from server");
                        updateButtonStates(true);
                    } else if (data.type === 'timer-pause' || data.type === 'timer-ended') {
                        console.log("Received pause/end command from server");
                        updateButtonStates(false);
                    } else if (data.type === 'timer-reset') {
                        console.log("Received reset command from server");
                        updateButtonStates(false);
                    } else if (data.type === 'timer-sync') {
                        console.log("Syncing timer state, isRunning:", data.isRunning);
                        updateButtonStates(!!data.isRunning);
                    }
                }
            } catch (e) {
                this.log(`Error parsing message: ${e.message}`);
                console.error("Error processing message:", e);
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
    };
    
    // Connect to the server
    counterManager.connect();
});