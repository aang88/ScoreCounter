// display.js - Complete implementation with timer and game management
document.addEventListener('DOMContentLoaded', function() {
    // Get counter IDs from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const counterIds = urlParams.get('ids') ? urlParams.get('ids').split(',') : ['Chung', 'Hong'];
    
    // Get counter names from URL (or use default names)
    const counterNames = {};
    counterIds.forEach(id => {
        counterNames[id] = urlParams.get('name-' + id) || id;
    });
    
   
    // Create game controls if they don't exist
    let gameControls = document.getElementById('gameControls');
    if (!gameControls) {
        gameControls = document.createElement('div');
        gameControls.id = 'gameControls';
        gameControls.className = 'game-controls';
        gameControls.style.display = 'flex';
        gameControls.style.justifyContent = 'center ';
        gameControls.style.alignItems = 'center';
        gameControls.style.width = '99%';
        gameControls.style.backgroundColor = '#f0f0f0';
        gameControls.style.borderRadius = '8px';
        gameControls.style.padding = '15px';
        gameControls.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        gameControls.style.marginRight = 'auto';
        gameControls.style.marginLeft = 'auto';
        gameControls.style.gap = '200px';
        
        const newGameButton = document.createElement('button');
        newGameButton.id = 'newGameButton';
        newGameButton.className = 'game-button';
        newGameButton.textContent = 'New Game';
        newGameButton.style.padding = '10px 20px';
        newGameButton.style.backgroundColor = '#4285f4';
        newGameButton.style.color = 'white';
        newGameButton.style.border = 'none';
        newGameButton.style.borderRadius = '5px';
        newGameButton.style.cursor = 'pointer';
        newGameButton.style.fontSize = '16px';

        const logo = document.createElement('div');
        logo.id = 'roundInfo';
        logo.textContent = 'Western Taekwondo';
        logo.style.fontSize = '18px';
        logo.style.fontWeight = 'bold';
        logo.style.textAlign = 'center';
        logo.style.marginLeft = '60px';
        
        const roundInfo = document.createElement('div');
        roundInfo.id = 'roundInfo';
        roundInfo.className = 'round-info';
        roundInfo.textContent = 'Press New Game to start';
        roundInfo.style.fontSize = '18px';
        roundInfo.style.fontWeight = 'bold';
        
        gameControls.appendChild(newGameButton);
        gameControls.appendChild(logo);
        gameControls.appendChild(roundInfo);
        document.body.appendChild(gameControls);
    }
    
    // Create timer container if it doesn't exist
    let timerContainer = document.getElementById('timerContainer');
    if (!timerContainer) {
        timerContainer = document.createElement('div');
        timerContainer.id = 'timerContainer';
        timerContainer.className = 'timer-container';
 
        timerContainer.style.padding = '15px';
        timerContainer.style.marginLeft = '-20px';
        timerContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        timerContainer.display = 'flex';
        timerContainer.style.flexDirection = 'column';
        timerContainer.style.backgroundColor = '#f8f8f8';
        timerContainer.style.borderRadius = '10px';
        timerContainer.style.textAlign = 'center';
        timerContainer.style.width = '100%';
        timerContainer.style.marginRight = 'auto';
        
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'timerDisplay';
        timerDisplay.className = 'timer-display';
        timerDisplay.textContent = '00:00';
        timerDisplay.style.fontSize = '48px';
        timerDisplay.style.fontWeight = 'bold';
        timerDisplay.style.marginBottom = '15px';
        timerDisplay.style.fontFamily = 'monospace';
        
        const timerControls = document.createElement('div');
        timerControls.className = 'timer-controls';
        timerControls.style.display = 'flex';
        timerControls.style.justifyContent = 'center';
        timerControls.style.gap = '15px';
        
        const startPauseButton = document.createElement('button');
        startPauseButton.id = 'startPauseButton';
        startPauseButton.className = 'timer-button';
        startPauseButton.textContent = 'Start';
        startPauseButton.style.padding = '10px 20px';
        startPauseButton.style.fontSize = '16px';
        startPauseButton.style.border = 'none';
        startPauseButton.style.borderRadius = '5px';
        startPauseButton.style.backgroundColor = '#4285f4';
        startPauseButton.style.color = 'white';
        startPauseButton.style.cursor = 'pointer';
        
        const resetButton = document.createElement('button');
        resetButton.id = 'resetButton';
        resetButton.className = 'timer-button';
        resetButton.textContent = 'Reset';
        resetButton.style.padding = '10px 20px';
        resetButton.style.fontSize = '16px';
        resetButton.style.border = 'none';
        resetButton.style.borderRadius = '5px';
        resetButton.style.backgroundColor = '#4285f4';
        resetButton.style.color = 'white';
        resetButton.style.cursor = 'pointer';
        
        timerControls.appendChild(startPauseButton);
        timerControls.appendChild(resetButton);
        timerContainer.appendChild(timerDisplay);
        timerContainer.appendChild(timerControls);
        document.body.appendChild(timerContainer);
    }
    
    // Create status div if it doesn't exist
    let statusDiv = document.getElementById('statusDiv');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'statusDiv';
        statusDiv.className = 'status';
        statusDiv.textContent = 'Connecting...';
        statusDiv.style.margin = '20px 0';
        statusDiv.style.fontSize = '16px';
        statusDiv.style.textAlign = 'center';
        document.body.appendChild(statusDiv);
    }

    // Create counter container if it doesn't exist
    let counterContainer = document.getElementById('counterContainer');
    if (!counterContainer) {
        counterContainer = document.createElement('div');
        counterContainer.id = 'counterContainer';
        counterContainer.className = 'counter-container';
        counterContainer.style.width = '90%';
        
        counterContainer.style.height = '150%';
        counterContainer.style.marginLeft = 'auto';
        counterContainer.style.marginRight = 'auto';
        counterContainer.style.display = 'flex';
        counterContainer.style.flexDirection = 'row';
        counterContainer.style.justifyContent = 'center';
        counterContainer.style.gap = '40px';
        counterContainer.style.paddingLeft = '20px'; // Add padding to counteract any margin issues
        counterContainer.style.paddingRight = '20px'; // Add padding to counteract any margin issues
        
        document.body.appendChild(counterContainer);
    }

    // Create debug div if it doesn't exist
    let debug = document.getElementById('debug');
    if (!debug) {
        debug = document.createElement('div');
        debug.id = 'debug';
        debug.style.marginTop = '30px';
        debug.style.padding = '10px';
        debug.style.border = '1px solid #ccc';
        debug.style.backgroundColor = '#f5f5f5';
        debug.style.textAlign = 'left';
        debug.style.maxWidth = '600px';
        debug.style.marginLeft = 'auto';
        debug.style.marginRight = 'auto';
        debug.style.height = '150px';
        debug.style.overflowY = 'auto';
        debug.style.fontFamily = 'monospace';
        debug.style.fontSize = '12px';
        debug.style.display = urlParams.get('debug') === 'true' ? 'block' : 'none';
        document.body.appendChild(debug);
    }
    
    // Initialize the counter manager
    const wsHost = window.location.hostname || 'localhost';
    const wsPort = '8765'; // Keep the same port
    const wsUrl = `ws://${wsHost}:${wsPort}`;
    const counterManager = new CounterManager(wsUrl);
    console.log("CounterManager WebSocket:", counterManager.socket);
    counterManager.connect();

    // Set up debug logging
    counterManager.setDebugElement(debug);
    
    // Create counter boxes
    const counterValues = {};
    
    counterContainer.innerHTML = ''; // Clear container
    
    counterIds.forEach(id => {
        const counterBox = document.createElement('div');
        counterBox.className = 'counter-box';
        counterBox.id = id + 'Team';
        counterBox.style.margin = '15px 0';
        counterBox.style.padding = '20px';
        counterBox.style.borderRadius = '10px';
        counterBox.style.backgroundColor = '#f8f8f8';
        counterBox.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        counterBox.style.display = 'flex';
        counterBox.style.justifyContent = 'space-between';
        counterBox.style.width = '60%';
        counterBox.style.height = 'auto'; // Allow height to adjust
        counterBox.style.minHeight = '300px'; // Minimum height
        counterBox.style.boxSizing = 'border-box';
        counterBox.style.height = 'auto'
        counterBox.style.flexDirection = 'column';
        counterBox.style.justifyContent = 'center';
        counterBox.style.alignItems = 'center';
        
        const label = document.createElement('div');
        label.className = 'counter-label';
        label.textContent = counterNames[id];
        label.style.fontSize = '24px';
        label.style.fontWeight = 'bold';
        label.style.color = id === 'Hong' ? '#ea4335' : '#4285f4';
        
        const value = document.createElement('div');
        value.className = 'counter-value';
        value.textContent = '0';
        value.style.fontSize = '2000%';
        value.style.fontWeight = 'bold';
        value.style.width = '100%'; // Take up full width of parent
        value.style.display = 'flex'; // Use flexbox for centering
        value.style.justifyContent = 'center'; // Center horizontally
        value.style.alignItems = 'center'; // Center vertically
        value.style.textAlign = 'center';
        value.style.color = id === 'Hong' ? '#ea4335' : '#4285f4';
        value.style.lineHeight = '1'; // Tighten line height
        value.style.margin = '0'; // Remove any margin
        value.style.padding = '0'; // Remove any padding    
        
        counterValues[id] = value;
        
        counterBox.appendChild(label);
        counterBox.appendChild(value);
        counterContainer.appendChild(counterBox);
    });
    
    // Initialize timer manager
    const timerManager = new TimerManager(counterManager.socket);

    console.log("TimerManager initialized with WebSocket:", timerManager.websocket);
    const timerDisplay = document.getElementById('timerDisplay');
    timerManager.setTimerElement(timerDisplay);
    timerManager.setDuration(60); // 2 minutes

    // Initialize game state manager
    const gameState = new GameStateManager(counterManager, timerManager);
    const roundInfo = document.getElementById('roundInfo');
    gameState.setRoundInfoElement(roundInfo);
    
    // Set up timer button events
    const startPauseButton = document.getElementById('startPauseButton');
    const resetButton = document.getElementById('resetButton');
    console.log("here");
    if (startPauseButton) {
        // printf("Setting up start/pause button event listener");
        startPauseButton.addEventListener('click', () => {
            if (timerManager.isRunning) {
                console.log("Pausing timer");
                timerManager.pause();
                startPauseButton.textContent = 'Start';
            } else {
                timerManager.start();
                console.log("Starting timer");
                startPauseButton.textContent = 'Pause';
            }
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            timerManager.reset();
            startPauseButton.textContent = 'Start';
        });
    }
    
    // Set up new game button event
    const newGameButton = document.getElementById('newGameButton');
    if (newGameButton) {
        newGameButton.addEventListener('click', () => {
            if (!gameState.isGameInProgress) {
                const rounds = parseInt(prompt('How many rounds (for best of N)?', '3')) || 3;
                gameState.startGame(rounds);
                startPauseButton.textContent = 'Pause';
            }
        });
    }
    
    // Override the onmessage handler after connection
    const originalConnect = counterManager.connect;
    counterManager.connect = function() {
        // Call the original connect method
        originalConnect.call(this);
        
        // Replace the message handler after a small delay to ensure socket is created
        setTimeout(() => {
            if (this.socket) {
                // Store the original handler
                const originalOnMessage = this.socket.onmessage;
                
                // Replace with our enhanced handler
                this.socket.onmessage = (event) => {
                    console.log("Raw message received:", event.data);
                    
                    try {
                        const data = JSON.parse(event.data);
                        this.log(`Received message: ${event.data}`);
                        
                        // Handle counters update with direct DOM manipulation
                        if (data.type === 'counters' && data.values) {
                            console.log("Counter update received:", data.values);
                            this.counters = data.values;
                            
                            // Update counter displays
                            for (const [id, value] of Object.entries(data.values)) {
                                const element = counterValues[id];
                                if (element) {
                                    console.log(`Updating ${id} to ${value}`);
                                    element.textContent = value;
                                    
                                    // Animation
                                    element.style.transform = 'scale(1.2)';
                                    element.style.transition = 'transform 0.2s';
                                    setTimeout(() => {
                                        element.style.transform = 'scale(1)';
                                    }, 200);
                                }
                            }
                            
                            // Also call the original handler if it exists
                            if (this.onCounterUpdate) {
                                this.onCounterUpdate(this.counters);
                            }
                        }
                        // Handle timer messages
                        else if (data.type && data.type.startsWith('timer-')) {
                            timerManager.handleServerMessage(data);
                            if (startPauseButton) {
                                startPauseButton.textContent = timerManager.isRunning ? 'Pause' : 'Start';
                            }
                        }
                        // For other message types, just call the original handler
                        else if (originalOnMessage) {
                            originalOnMessage(event);
                        }
                    } catch (e) {
                        console.error("Error processing message:", e);
                        this.log(`Error parsing message: ${e.message}`);
                    }
                };
            }
        }, 100);
    };
    
    // Handle connection changes
    counterManager.onConnectionChange = (connected) => {
        if (statusDiv) {
            if (connected) {
                statusDiv.textContent = 'Connected';
                statusDiv.style.color = 'green';
                
                // Enable buttons when connected
                if (startPauseButton) startPauseButton.disabled = false;
                if (resetButton) resetButton.disabled = false;
                if (newGameButton) newGameButton.disabled = false;
            } else {
                statusDiv.textContent = 'Disconnected';
                statusDiv.style.color = 'red';
                
                // Disable buttons when disconnected
                if (startPauseButton) startPauseButton.disabled = true;
                if (resetButton) resetButton.disabled = true;
                if (newGameButton) newGameButton.disabled = true;
            }
        }
    };
    
    // Game announcement styling
    const style = document.createElement('style');
    style.textContent = `
        .game-announcement {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            transition: opacity 0.5s;
            z-index: 1000;
            opacity: 0;
        }
        .scores-modal {
            display: none;
            position: fixed;
            z-index: 1001;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
        }
        .scores-modal-content {
            background-color: white;
            margin: 10% auto;
            padding: 20px;
            border-radius: 10px;
            width: 80%;
            max-width: 600px;
            position: relative;
        }
        .winner-announcement {
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
            padding: 10px;
            background-color: #d4edda;
            border-radius: 5px;
            color: #155724;
        }
        .continue-button {
            display: block;
            width: 100%;
            padding: 12px;
            margin-top: 20px;
            background-color: #4285f4;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            text-align: center;
        }
        .scores-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .scores-table th, .scores-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
        }
        .scores-table .winner {
            background-color: #d4edda;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
    
    // Connect to the server
    counterManager.connect();
});