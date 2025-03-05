// buttons.js - Script for the multiple buttons page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the counter manager
    const counterManager = new CounterManager('ws://192.168.0.27:8765');
    
    // Get references to DOM elements
    const button1 = document.getElementById('button1');
    const button2 = document.getElementById('button2');
    const value1 = document.getElementById('value1');
    const value2 = document.getElementById('value2');
    const statusDiv = document.getElementById('statusDiv');
    const debug = document.getElementById('debug');
    
    // Show debug if requested
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
        debug.style.display = 'block';
    }
    
    // Set up debug logging
    counterManager.setDebugElement(debug);
    
    // Handle connection changes
    counterManager.onConnectionChange = (connected) => {
        if (connected) {
            statusDiv.textContent = 'Connected';
            statusDiv.style.color = 'green';
            button1.disabled = false;
            button2.disabled = false;
        } else {
            statusDiv.textContent = 'Disconnected';
            statusDiv.style.color = 'red';
            button1.disabled = true;
            button2.disabled = true;
        }
    };
    
    // Handle counter updates
    counterManager.onCounterUpdate = (counters) => {
        value1.textContent = counters['red'] || 0;
        value2.textContent = counters['blue'] || 0;
    };
    
    // Set up the buttons
    counterManager.setupButton(button1, 'red');
    counterManager.setupButton(button2, 'blue');
    
    // Connect to the server
    counterManager.connect();
});