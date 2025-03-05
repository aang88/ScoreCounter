// Simple script to fix counter display issues - save as display-fix.js
document.addEventListener('DOMContentLoaded', function() {
    // Get counter elements
    const redCounterElement = document.querySelector('.counter-value:nth-of-type(1)');
    const blueCounterElement = document.querySelector('.counter-value:nth-of-type(2)');
    
    // Create direct WebSocket connection for display
    const socket = new WebSocket('ws://192.168.0.27:8765');
    
    // Connection opened
    socket.onopen = function() {
        console.log('WebSocket connection established');
        document.getElementById('statusDiv').textContent = 'Connected';
        document.getElementById('statusDiv').style.color = 'green';
    };
    
    // Connection closed
    socket.onclose = function() {
        console.log('WebSocket connection closed');
        document.getElementById('statusDiv').textContent = 'Disconnected - Reconnecting...';
        document.getElementById('statusDiv').style.color = 'red';
        
        // Try to reconnect after 3 seconds
        setTimeout(function() {
            window.location.reload();
        }, 3000);
    };
    
    // Direct message handling
    socket.onmessage = function(event) {
        console.log('Message received:', event.data);
        
        try {
            const data = JSON.parse(event.data);
            
            // Check if this is a counter update
            if (data.type === 'counters' && data.values) {
                console.log('Counter update received:', data.values);
                
                // Update red counter
                if (data.values.red !== undefined && redCounterElement) {
                    redCounterElement.textContent = data.values.red;
                    highlight(redCounterElement);
                }
                
                // Update blue counter
                if (data.values.blue !== undefined && blueCounterElement) {
                    blueCounterElement.textContent = data.values.blue;
                    highlight(blueCounterElement);
                }
            }
        } catch (e) {
            console.error('Error processing message:', e);
        }
    };
    
    // Function to highlight counter that changed
    function highlight(element) {
        element.style.transform = 'scale(1.2)';
        element.style.transition = 'transform 0.2s';
        
        setTimeout(function() {
            element.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Keep-alive ping
    setInterval(function() {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({type: 'ping'}));
        }
    }, 30000);
});