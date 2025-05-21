// config.js - Central configuration for the counter application

// Server configuration
const SERVER_CONFIG = {
    // WebSocket server URL
    // Replace with your actual server IP address
    websocketUrl: 'ws://localhost:8765',
    
    // How often to send ping messages (in milliseconds)
    pingInterval: 30000
};

// Default counter IDs for the application
const DEFAULT_COUNTERS = {
    red: 'red',
    blue: 'blue'
};

// Expose configuration globally
window.SERVER_CONFIG = SERVER_CONFIG;
window.DEFAULT_COUNTERS = DEFAULT_COUNTERS;