// timer.js - Timer module with countdown functionality
class TimerManager {
    constructor(websocket) {
        this.websocket = websocket;
        this.isRunning = false;
        this.startTime = 0;
        this.pausedTimeRemaining = 0;
        this.timerElement = null;
        this.intervalId = null;
        this.onTimerUpdate = null;
        this.onTimerEnd = null;
        this.duration = 60; // Default 60 seconds
    }


    set websocket(ws) {
        console.log("Setting timer websocket:", ws ? "connected" : "null");
        this._websocket = ws;
    }
    
    get websocket() {
        return this._websocket;
    }
    
    // Set the timer duration in seconds
    setDuration(seconds) {
        this.duration = seconds;
        // Update display initially to show full time
        this.updateTimerDisplay(this.duration * 1000);
        return this;
    }

    // Set the HTML element where the timer will be displayed
    setTimerElement(element) {
        this.timerElement = element;
        // Update display initially
        if (this.timerElement) {
            this.updateTimerDisplay(this.pausedTimeRemaining || this.duration * 1000);
        }
        return this;
    }

    // Register a callback for when the timer updates
    setOnTimerUpdate(callback) {
        this.onTimerUpdate = callback;
        return this;
    }

    // Register a callback for when the timer ends
    setOnTimerEnd(callback) {
        this.onTimerEnd = callback;
        return this;
    }

    // Start the timer
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // If we were paused, resume from saved remaining time
        if (this.pausedTimeRemaining > 0) {
            this.startTime = Date.now() - (this.duration * 1000 - this.pausedTimeRemaining);
        } else {
            this.startTime = Date.now();
            this.pausedTimeRemaining = 0;
        }
        
        this.intervalId = setInterval(() => this.updateTimer(), 100);
        
        // Notify server if websocket is available
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'timer-start',
                startTime: this.startTime,
                duration: this.duration,
                pausedTimeRemaining: this.pausedTimeRemaining // Include for better sync
            }));
        }
        
        return this;
    }
    
    // Pause the timer
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        // Calculate remaining time
        const elapsed = Date.now() - this.startTime;
        this.pausedTimeRemaining = Math.max(0, this.duration * 1000 - elapsed);
        
        clearInterval(this.intervalId);
        
        // Notify server if websocket is available
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'timer-pause',
                pausedTimeRemaining: this.pausedTimeRemaining,
                pausedTime: this.pausedTimeRemaining // Include both for compatibility
            }));
        }
        
        return this;
    }
    
    // Reset the timer
    reset() {
        this.isRunning = false;
        this.startTime = 0;
        this.pausedTimeRemaining = 0;
        clearInterval(this.intervalId);
        
        // Show full duration
        this.updateTimerDisplay(this.duration * 1000);
        
        // Notify server if websocket is available
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'timer-reset',
                duration: this.duration  // Include duration for better sync
            }));
        }
        
        return this;
    }
    
    // Toggle the timer between running and paused
    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
        return this;
    }
    
    // Update the timer
    updateTimer() {
        if (!this.isRunning) return;
        
        const elapsed = Date.now() - this.startTime;
        const remaining = Math.max(0, this.duration * 1000 - elapsed);
        
        this.updateTimerDisplay(remaining);
        
        if (this.onTimerUpdate) {
            this.onTimerUpdate(remaining);
        }
        
        // Check if timer has reached zero
        if (remaining <= 0) {
            this.pause();
            if (this.onTimerEnd) {
                this.onTimerEnd();
            }
        }
    }
    
    // Update the timer display with validation to prevent NaN
    updateTimerDisplay(timeRemainingInMs) {
        if (!this.timerElement) return;
        
        // Validate input to prevent NaN
        if (typeof timeRemainingInMs !== 'number' || isNaN(timeRemainingInMs)) {
            console.error('Invalid timer value:', timeRemainingInMs);
            timeRemainingInMs = this.duration * 1000; // Fall back to duration
        }
        
        const seconds = Math.ceil(Math.max(0, timeRemainingInMs) / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        this.timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Handle timer messages from the server
    handleServerMessage(data) {
        console.log('Timer message received:', data);
        
        if (data.type === 'timer-start') {
            this.isRunning = true;
            
            // Validate startTime
            if (data.startTime && !isNaN(data.startTime)) {
                this.startTime = parseInt(data.startTime);
            } else {
                this.startTime = Date.now();
            }
            
            // Validate duration
            if (data.duration && !isNaN(data.duration)) {
                this.duration = parseFloat(data.duration);
            }
            
            // Clear any existing interval to prevent duplicates
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => this.updateTimer(), 100);
            
            // Force a display update
            this.updateTimer();
            
            console.log("Timer started with startTime:", this.startTime);
        }
        else if (data.type === 'timer-pause') {
            this.isRunning = false;
            
            // Check both pausedTimeRemaining and pausedTime with strong validation
            let pausedTime = null;
            if (typeof data.pausedTimeRemaining === 'number' && !isNaN(data.pausedTimeRemaining)) {
                pausedTime = data.pausedTimeRemaining;
            } else if (typeof data.pausedTime === 'number' && !isNaN(data.pausedTime)) {
                pausedTime = data.pausedTime;
            }
            
            // Validate the time value
            if (pausedTime !== null && pausedTime > 0) {
                this.pausedTimeRemaining = pausedTime;
            } else {
                // If no valid time received, calculate it locally
                if (this.startTime > 0) {
                    const elapsed = Date.now() - this.startTime;
                    this.pausedTimeRemaining = Math.max(0, this.duration * 1000 - elapsed);
                } else {
                    // Fallback if we don't have a valid startTime
                    this.pausedTimeRemaining = this.duration * 1000;
                }
            }
            
            clearInterval(this.intervalId);
            
            // Always provide a valid value to updateTimerDisplay
            const timeToDisplay = this.pausedTimeRemaining > 0 ? 
                                 this.pausedTimeRemaining : 
                                 this.duration * 1000;
            this.updateTimerDisplay(timeToDisplay);
        }
        else if (data.type === 'timer-reset') {
            this.isRunning = false;
            this.startTime = 0;
            
            // Get duration from message
            if (typeof data.duration === 'number' && !isNaN(data.duration)) {
                this.duration = data.duration;
            }
            
            // Set pausedTimeRemaining to full duration to prepare for next start
            this.pausedTimeRemaining = data.pausedTimeRemaining || this.duration * 1000;
            
            clearInterval(this.intervalId);
            
            // Update display with the pausedTimeRemaining
            this.updateTimerDisplay(this.pausedTimeRemaining);
        }
        else if (data.type === 'timer-sync') {
            // For full sync of timer state
            this.isRunning = !!data.isRunning;
            
            if (data.duration && !isNaN(data.duration)) {
                this.duration = data.duration;
            }
            
            if (this.isRunning) {
                if (data.startTime && !isNaN(data.startTime)) {
                    this.startTime = data.startTime;
                } else {
                    this.startTime = Date.now();
                }
                
                clearInterval(this.intervalId);
                this.intervalId = setInterval(() => this.updateTimer(), 100);
            } else {
                let pausedTime = data.pausedTimeRemaining || data.pausedTime;
                
                if (pausedTime && !isNaN(pausedTime)) {
                    this.pausedTimeRemaining = pausedTime;
                } else {
                    this.pausedTimeRemaining = this.duration * 1000;
                }
                
                clearInterval(this.intervalId);
                this.updateTimerDisplay(this.pausedTimeRemaining);
            }
        }
    }
}

// Expose the TimerManager globally
window.TimerManager = TimerManager;