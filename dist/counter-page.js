// counter-page.js - Script for the single counter page
document.addEventListener('DOMContentLoaded', function() {
    // Get counter ID from URL parameter (or use default)
    const urlParams = new URLSearchParams(window.location.search);
    const counterId = urlParams.get('id') || 'default-counter';
    const counterName = urlParams.get('name') || 'Counter';
    
    // Set counter name in UI
    document.getElementById('counterName').textContent = counterName;
    document.getElementById('buttonLabel').textContent = counterName;
    document.title = counterName;
    
    // Show debug if requested
    if (urlParams.get('debug') === 'true') {
        document.getElementById('debug').style.display = 'block';
    }
    
    // Initialize the counter manager
    const wsHost = window.location.hostname || 'localhost';
    const wsPort = '8765'; // Keep the same port
    const wsUrl = `ws://${wsHost}:${wsPort}`;
    
    // Initialize the counter manager with dynamic WebSocket URL
    const counterManager = new CounterManager(wsUrl);
    
    // Get references to DOM elements
    const counterButton = document.getElementById('counterButton');
    const counterValue = document.getElementById('counterValue');
    const statusDiv = document.getElementById('statusDiv');
    const debug = document.getElementById('debug');
    
    // Set up debug logging
    counterManager.setDebugElement(debug);
    
    // Handle connection changes
    counterManager.onConnectionChange = (connected) => {
        if (connected) {
            statusDiv.textContent = 'Connected';
            statusDiv.style.color = 'green';
            counterButton.disabled = false;
        } else {
            statusDiv.textContent = 'Disconnected';
            statusDiv.style.color = 'red';
            counterButton.disabled = true;
        }
    };
    
    // Handle counter updates
    counterManager.onCounterUpdate = (counters) => {
        counterValue.textContent = counters[counterId] || 0;
    };
    
    // Set up the button
    counterManager.setupButton(counterButton, counterId);
    
    // Connect to the server
    counterManager.connect();
});