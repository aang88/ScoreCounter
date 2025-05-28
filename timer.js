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
        if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
            console.error("Invalid duration provided:", seconds);
            return this; // Ignore invalid durations
        }
        console.log("Setting timer duration to:", seconds);
        this.duration = seconds;
        this.updateTimerDisplay(this.duration * 1000); // Update display
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
        console.log("Starting timer with duration:", this.duration);
        if (this.isRunning) return;
    
        this.isRunning = true;
        if (this.pausedTimeRemaining) {
            console.log("Resuming timer from paused state with remaining time:", this.pausedTimeRemaining);
            // Fix: Calculate start time correctly based on remaining time
            this.startTime = Date.now() - (this.duration * 1000 - this.pausedTimeRemaining);
            console.log("New calculated start time:", this.startTime);
            // Don't clear pausedTimeRemaining yet to allow it to be sent to server
        } else {
            // Start fresh if not resuming
            this.startTime = Date.now();
        }
        this.intervalId = setInterval(() => this.updateTimer(), 100);
    
        // Wait for WebSocket to be ready
        if (this.websocket) {
            if (this.websocket.readyState === WebSocket.OPEN) {
                this.sendTimerStartMessage();
            } else {
                console.warn("WebSocket not ready. Retrying...");
                const retryInterval = setInterval(() => {
                    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                        clearInterval(retryInterval);
                        this.sendTimerStartMessage();
                    } else if (!this.websocket || this.websocket.readyState === WebSocket.CLOSED) {
                        clearInterval(retryInterval);
                        console.error("WebSocket connection failed");
                    }
                }, 100); // Retry every 100ms
            }
        } else {
            console.error("WebSocket is not initialized!");
        }
    }
    
    sendTimerStartMessage() {
        console.log("Sending timer start message to server");
        
        // Calculate elapsed time if we're resuming from pause
        const elapsedTime = this.pausedTimeRemaining ? 
            (this.duration * 1000 - this.pausedTimeRemaining) : 0;
            
        this.websocket.send(JSON.stringify({
            type: 'timer-start',
            startTime: this.startTime,
            duration: this.duration,
            elapsedTime: elapsedTime, // Add this to help with synchronization
            pausedTimeRemaining: this.pausedTimeRemaining
        }));
        
        // Now that we've sent the message, clear pausedTimeRemaining
        this.pausedTimeRemaining = null;
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
        console.log(`Resetting timer to duration: ${this.duration}`);
        
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            const resetMessage = {
                type: 'timer-reset',
                duration: this.duration  // Make sure this is included
            };
            
            console.log(`Timer reset message sent to server with duration: ${this.duration}`);
            this.websocket.send(JSON.stringify(resetMessage));
        }
        
        this.isRunning = false;
        this.startTime = 0;
        this.pausedTime = this.duration * 1000;
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

    getCurrentTime() {
        //Get the current timer time formatted as 00:00
        if (!this.isRunning) {
            return this.formatTime(this.pausedTimeRemaining || this.duration * 1000);
        }
    }
    
    // Handle timer messages from the server
    handleServerMessage(data) {
        console.log('Timer message received:', data);
        
        // Always prioritize duration updates to ensure consistency
        if (data.duration && !isNaN(data.duration)) {
            console.log(`Updating duration from ${this.duration} to ${parseFloat(data.duration)}`);
            this.duration = parseFloat(data.duration);
        }
        
        if (data.type === 'timer-start') {
            console.log(`Timer started with duration: ${data.duration || 'not specified'}, startTime: ${data.startTime || 'not specified'}, elapsedTime: ${data.elapsedTime || 'not specified'}`);
            this.isRunning = true;
            
            // Calculate start time consistently across devices
            if (typeof data.elapsedTime === 'number' && !isNaN(data.elapsedTime)) {
                // Use elapsed time to calculate local start time (most reliable)
                this.startTime = Date.now() - data.elapsedTime;
                console.log(`Using elapsedTime ${data.elapsedTime}ms to calculate startTime: ${this.startTime}`);
            } else if (data.startTime && !isNaN(data.startTime)) {
                // Less reliable: using server's startTime directly
                // This can cause sync issues due to network latency
                this.startTime = parseInt(data.startTime);
                console.log(`Using startTime directly: ${this.startTime}`);
            } else {
                // Fallback, least reliable
                this.startTime = Date.now();
                console.log(`No time data provided, using current time: ${this.startTime}`);
            }
            
            // Clear any existing interval to prevent duplicates
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => this.updateTimer(), 100);
            
            // Force a display update
            this.updateTimer();
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