// display.js - Script for the counter display page
document.addEventListener('DOMContentLoaded', function() {
    // Get counter IDs from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const counterIds = urlParams.get('ids') ? urlParams.get('ids').split(',') : ['team-a', 'team-b'];
    
    // Get counter names from URL (or use default names)
    const counterNames = {};
    counterIds.forEach(id => {
        counterNames[id] = urlParams.get('name-' + id) || id;
    });
    
    // Show debug if requested
    if (urlParams.get('debug') === 'true') {
        document.getElementById('debug').style.display = 'block';
    }
    
    // Initialize the counter manager
    const counterManager = new CounterManager('ws://192.168.0.27:8765');
    
    // Get references to DOM elements
    const statusDiv = document.getElementById('statusDiv');
    const counterContainer = document.getElementById('counterContainer');
    const debug = document.getElementById('debug');
    
    // Set up debug logging
    counterManager.setDebugElement(debug);
    
    // Create counter boxes
    const counterValues = {};
    
    counterIds.forEach(id => {
        const counterBox = document.createElement('div');
        counterBox.className = 'counter-box';
        
        const label = document.createElement('div');
        label.className = 'counter-label';
        label.textContent = counterNames[id];
        
        const value = document.createElement('div');
        value.className = 'counter-value';
        value.textContent = '0';
        
        counterValues[id] = value;
        
        counterBox.appendChild(label);
        counterBox.appendChild(value);
        counterContainer.appendChild(counterBox);
    });
    
    // Handle connection changes
    counterManager.onConnectionChange = (connected) => {
        if (connected) {
            statusDiv.textContent = 'Connected';
            statusDiv.style.color = 'green';
        } else {
            statusDiv.textContent = 'Disconnected';
            statusDiv.style.color = 'red';
        }
    };
    
    // Handle counter updates
    counterManager.onCounterUpdate = (counters) => {
        counterIds.forEach(id => {
            const element = counterValues[id];
            const newValue = counters[id] || 0;
            
            // Update the counter value
            element.textContent = newValue;
            
            // Add a brief animation effect
            element.style.transform = 'scale(1.2)';
            element.style.transition = 'transform 0.2s ease-in-out';
            
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        });
    };
    
    // Connect to the server
    counterManager.connect();
});