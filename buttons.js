document.addEventListener('DOMContentLoaded', function() {
    // Initialize the counter manager
    const counterManager = new CounterManager('ws://172.20.10.3:8765');
    
    // Get references to DOM elements
    const addButton1 = document.getElementById('button1');
    const subtractButton1 = document.getElementById('subtractButton1');
    const addButton2 = document.getElementById('button2');
    const subtractButton2 = document.getElementById('subtractButton2');
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
    
    // Error checking for buttons
    if (!addButton1 || !subtractButton1 || !addButton2 || !subtractButton2) {
        console.error('One or more buttons are missing:');
        console.error('Add Button 1:', addButton1);
        console.error('Subtract Button 1:', subtractButton1);
        console.error('Add Button 2:', addButton2);
        console.error('Subtract Button 2:', subtractButton2);
        
        // Optional: Create buttons dynamically if they don't exist
        if (!addButton1) {
            const newAddButton1 = document.createElement('button');
            newAddButton1.id = 'button1';
            newAddButton1.textContent = '+1 Red';
            document.body.appendChild(newAddButton1);
        }
        
        if (!subtractButton1) {
            const newSubtractButton1 = document.createElement('button');
            newSubtractButton1.id = 'subtractButton1';
            newSubtractButton1.textContent = '-1 Red';
            document.body.appendChild(newSubtractButton1);
        }
        
        // Repeat for blue team buttons
        // ... similar code for addButton2 and subtractButton2
    }
    
    // Handle connection changes
    counterManager.onConnectionChange = (connected) => {
        if (connected) {
            statusDiv.textContent = 'Connected';
            statusDiv.style.color = 'green';
            
            // Null check before disabling
            if (addButton1) addButton1.disabled = false;
            if (subtractButton1) subtractButton1.disabled = false;
            if (addButton2) addButton2.disabled = false;
            if (subtractButton2) subtractButton2.disabled = false;
        } else {
            statusDiv.textContent = 'Disconnected';
            statusDiv.style.color = 'red';
            
            // Null check before disabling
            if (addButton1) addButton1.disabled = true;
            if (subtractButton1) subtractButton1.disabled = true;
            if (addButton2) addButton2.disabled = true;
            if (subtractButton2) subtractButton2.disabled = true;
        }
    };
    
    // Handle counter updates
    counterManager.onCounterUpdate = (counters) => {
        if (value1) value1.textContent = counters['red'] || 0;
        if (value2) value2.textContent = counters['blue'] || 0;
    };
    
    // Custom function to subtract points
    function subtractPoints(counterId) {
        if (counterManager.socket && counterManager.socket.readyState === WebSocket.OPEN) {
            counterManager.socket.send(JSON.stringify({
                type: 'subtract-counter',
                id: counterId,
                value: 1 // Subtract 1 point
            }));
        }
    }
    
    // Set up the buttons with null checks
    if (addButton1) {
        counterManager.setupButton(addButton1, 'red');
    }
    
    // Add subtraction button event with null check
    if (subtractButton1) {
        subtractButton1.addEventListener('click', () => {
            subtractPoints('red');
        });
    }
    
    if (addButton2) {
        counterManager.setupButton(addButton2, 'blue');
    }
    
    // Add subtraction button event with null check
    if (subtractButton2) {
        subtractButton2.addEventListener('click', () => {
            subtractPoints('blue');
        });
    }
    
    // Connect to the server
    counterManager.connect();
});