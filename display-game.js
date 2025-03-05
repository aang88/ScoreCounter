// display-game.js - Script for the game display page
document.addEventListener('DOMContentLoaded', function() {
    // Get counter IDs from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const counterIds = urlParams.get('ids') ? urlParams.get('ids').split(',') : ['red', 'blue'];
    const roundDuration = parseInt(urlParams.get('duration') || '60', 10); // Default: 60 seconds
    const roundCount = parseInt(urlParams.get('rounds') || '3', 10); // Default: 3 rounds
    
    // Get counter names from URL (or use default names)
    const counterNames = {};
    counterIds.forEach(id => {
        counterNames[id] = urlParams.get('name-' + id) || id.charAt(0).toUpperCase() + id.slice(1);
    });
    
    // Show debug if requested
    if (urlParams.get('debug') === 'true') {
        document.getElementById('debug').style.display = 'block';
    }
    
    // Initialize the counter manager
    const counterManager = new CounterManager(SERVER_CONFIG.websocketUrl);
    
    // Get references to DOM elements
    const statusDiv = document.getElementById('statusDiv');
    const counterContainer = document.getElementById('counterContainer');
    const debug = document.getElementById('debug');
    const timerDisplay = document.getElementById('timer-display');
    const startPauseButton = document.getElementById('start-pause-button');
    const resetButton = document.getElementById('reset-button');
    const newGameButton = document.getElementById('new-game-button');
    const roundInfo = document.getElementById('round-info');
    
    // Set up debug logging
    counterManager.setDebugElement(debug);
    
    // Initialize timer
    const timerManager = new TimerManager(counterManager.socket);
    timerManager.setTimerElement(timerDisplay);
    timerManager.setDuration(roundDuration);
    
    // Initialize game state
    const gameState = new GameStateManager(counterManager, timerManager);
    
    // Set up timer controls
    startPauseButton.addEventListener('click', () => {
        if (timerManager.isRunning) {
            timerManager.pause();
            startPauseButton.textContent = 'Start';
        } else {
            timerManager.start();
            startPauseButton.textContent = 'Pause';
        }
    });
    
    resetButton.addEventListener('click', () => {
        timerManager.reset();
        startPauseButton.textContent = 'Start';
    });
    
    // Set up game controls
    newGameButton.addEventListener('click', () => {
        gameState.startGame(roundCount);
        startPauseButton.textContent = 'Pause';
    });
    
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
        
        // Apply team color to counter value
        if (id === 'red') {
            value.style.color = '#ea4335';
        } else if (id === 'blue') {
            value.style.color = '#4285f4';
        }
        
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
            startPauseButton.disabled = false;
            resetButton.disabled = false;
            newGameButton.disabled = gameState.gameInProgress;
        } else {
            statusDiv.textContent = 'Disconnected';
            statusDiv.style.color = 'red';
            startPauseButton.disabled = true;
            resetButton.disabled = true;
            newGameButton.disabled = true;
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
    
    // Add server message handler for game state and timer
    const originalOnMessage = counterManager.socket.onmessage;
    counterManager.socket.onmessage = function(event) {
        // Call original handler first
        if (originalOnMessage) {
            originalOnMessage.call(this, event);
        }
        
        try {
            const data = JSON.parse(event.data);
            
            // Handle timer messages
            if (data.type && data.type.startsWith('timer-')) {
                timerManager.handleServerMessage(data);
                startPauseButton.textContent = timerManager.isRunning ? 'Pause' : 'Start';
            }
            
            // Handle game state messages
            if (data.type === 'game-state') {
                // Handle game state updates
                if (data.gameInProgress !== undefined) {
                    gameState.gameInProgress = data.gameInProgress;
                }
                if (data.currentRound !== undefined) {
                    gameState.currentRound = data.currentRound;
                }
                if (data.maxRounds !== undefined) {
                    gameState.maxRounds = data.maxRounds;
                }
                
                // Update UI
                gameState.updateGameUI();
            }
        } catch (e) {
            console.error('Error handling server message:', e);
        }
    };
    
    // Connect to the server
    counterManager.connect();
});