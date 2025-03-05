// timer.js - Timer module for the counter application

class TimerManager {
    constructor(websocket) {
        this.websocket = websocket;
        this.isRunning = false;
        this.startTime = 0;
        this.pausedTime = 0;
        this.timerElement = null;
        this.intervalId = null;
        this.onTimerUpdate = null;
        this.onTimerEnd = null;
        this.duration = 60; // Default 60 seconds
    }

    // Set the timer duration in seconds
    setDuration(seconds) {
        this.duration = seconds;
        return this;
    }

    // Set the HTML element where the timer will be displayed
    setTimerElement(element) {
        this.timerElement = element;
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
        
        // If we were paused, resume from that time
        if (this.pausedTime > 0) {
            this.startTime = Date.now() - this.pausedTime;
        } else {
            this.startTime = Date.now();
        }
        
        this.intervalId = setInterval(() => this.updateTimer(), 100);
        
        // Notify server if websocket is available
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'timer-start',
                startTime: this.startTime
            }));
        }
        
        return this;
    }
    
    // Pause the timer
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.pausedTime = Date.now() - this.startTime;
        clearInterval(this.intervalId);
        
        // Notify server if websocket is available
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'timer-pause',
                pausedTime: this.pausedTime
            }));
        }
        
        return this;
    }
    
    // Reset the timer
    reset() {
        this.isRunning = false;
        this.startTime = 0;
        this.pausedTime = 0;
        clearInterval(this.intervalId);
        this.updateTimerDisplay(0);
        
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
        
        const elapsedTime = Date.now() - this.startTime;
        this.updateTimerDisplay(elapsedTime);
        
        // Check if timer has reached its duration
        if (Math.floor(elapsedTime / 1000) >= this.duration) {
            this.pause();
            if (this.onTimerEnd) {
                this.onTimerEnd();
            }
        }
        
        if (this.onTimerUpdate) {
            this.onTimerUpdate(elapsedTime);
        }
    }
    
    // Update the timer display
    updateTimerDisplay(timeInMs) {
        if (!this.timerElement) return;
        
        const seconds = Math.floor(timeInMs / 1000);
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
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => this.updateTimer(), 100);
        }
        else if (data.type === 'timer-pause') {
            this.isRunning = false;
            this.pausedTime = data.pausedTime;
            clearInterval(this.intervalId);
            this.updateTimerDisplay(this.pausedTime);
        }
        else if (data.type === 'timer-reset') {
            this.reset();
        }
        else if (data.type === 'timer-sync') {
            // For full sync of timer state
            this.isRunning = data.isRunning;
            
            if (this.isRunning) {
                this.startTime = data.startTime;
                clearInterval(this.intervalId);
                this.intervalId = setInterval(() => this.updateTimer(), 100);
            } else {
                this.pausedTime = data.pausedTime;
                clearInterval(this.intervalId);
                this.updateTimerDisplay(this.pausedTime);
            }
        }
    }
}

// Expose the TimerManager globally
window.TimerManager = TimerManager;