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
                duration: this.duration
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
                pausedTimeRemaining: this.pausedTimeRemaining
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
                type: 'timer-reset'
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
    
    // Update the timer display
    updateTimerDisplay(timeRemainingInMs) {
        if (!this.timerElement) return;
        
        const seconds = Math.ceil(timeRemainingInMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        this.timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Handle timer messages from the server
    handleServerMessage(data) {
        if (data.type === 'timer-start') {
            this.isRunning = true;
            this.startTime = data.startTime;
            this.duration = data.duration || this.duration;
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => this.updateTimer(), 100);
        }
        else if (data.type === 'timer-pause') {
            this.isRunning = false;
            this.pausedTimeRemaining = data.pausedTimeRemaining;
            clearInterval(this.intervalId);
            this.updateTimerDisplay(this.pausedTimeRemaining);
        }
        else if (data.type === 'timer-reset') {
            this.reset();
        }
        else if (data.type === 'timer-sync') {
            // For full sync of timer state
            this.isRunning = data.isRunning;
            this.duration = data.duration || this.duration;
            
            if (this.isRunning) {
                this.startTime = data.startTime;
                clearInterval(this.intervalId);
                this.intervalId = setInterval(() => this.updateTimer(), 100);
            } else {
                this.pausedTimeRemaining = data.pausedTimeRemaining || (this.duration * 1000);
                clearInterval(this.intervalId);
                this.updateTimerDisplay(this.pausedTimeRemaining);
            }
        }
    }
}

// Expose the TimerManager globally
window.TimerManager = TimerManager;