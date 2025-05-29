
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
        gameControls.style.backgroundColor = '#8163a5';
        gameControls.style.fontFamily = 'Nunito Sans, sans-serif';
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
        newGameButton.style.backgroundColor = '#422d5e';
        newGameButton.style.color = 'white';
        newGameButton.style.border = 'none';
        newGameButton.style.fontFamily = 'Nunito Sans, sans-serif';
        newGameButton.style.borderRadius = '5px';
        newGameButton.style.cursor = 'pointer';
        newGameButton.style.fontSize = '16px';

        const logo = document.createElement('div');
        logo.id = 'roundInfo';
        logo.style.fontFamily = 'Bebas Neue, sans-serif';
        logo.textContent = 'Western Taekwondo';
        logo.style.fontSize = '36px';
        logo.style.fontWeight = 'bold';
        logo.style.textAlign = 'center';
        logo.style.marginLeft = '60px';
        logo.style.color = '#fff';
        
        const roundInfo = document.createElement('div');
        roundInfo.id = 'roundInfo';
        roundInfo.className = 'round-info';
        roundInfo.textContent = 'Press New Game to start';
        roundInfo.style.fontSize = '18px';
        roundInfo.style.fontWeight = 'bold';
        roundInfo.style.color = '#fff';
        
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
 
            // timerContainer.style.padding = '-15px';
        timerContainer.style.paddingTop = '15px';
        timerContainer.style.paddingBottom = '15px';
        timerContainer.style.marginLeft = '-40px';
        timerContainer.style.boxShadow = '0 4px 8px rgb(0, 0, 0)';
        timerContainer.style.backgroundColor = '#543977';
        timerContainer.style.display = 'flex';
        timerContainer.style.flexDirection = 'column';
        timerContainer.style.borderRadius = '10px';
        timerContainer.style.textAlign = 'center';
        timerContainer.style.justifyContent = 'center';
        timerContainer.style.alignItems = 'center';
        timerContainer.style.width = '100%';
        timerContainer.style.marginRight = 'auto';
        timerContainer.style.marginLeft = 'auto';
        // timerContainer.style.position = 'relative';
        // timerContainer.style.overflow = 'hidden';

        // Create gradient overlay for left corner
        const leftGradient = document.createElement('div');
        leftGradient.style.position = 'absolute';
        leftGradient.style.top = '0';
        leftGradient.style.left = '0';
        leftGradient.style.width = '25%';
        leftGradient.style.height = '100%';
        leftGradient.style.background = 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)';
        leftGradient.style.pointerEvents = 'none'; // Make it non-interactive
        leftGradient.style.borderTopLeftRadius = '10px';
        leftGradient.style.borderBottomLeftRadius = '10px';
        
        // Create gradient overlay for right corner
        const rightGradient = document.createElement('div');
        rightGradient.style.position = 'absolute';
        rightGradient.style.top = '0';
        rightGradient.style.right = '0';
        rightGradient.style.width = '25%';
        rightGradient.style.height = '100%';
        rightGradient.style.background = 'linear-gradient(270deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)';
        rightGradient.style.pointerEvents = 'none'; // Make it non-interactive
        rightGradient.style.borderTopRightRadius = '10px';
        rightGradient.style.borderBottomRightRadius = '10px';
        
        // Add these gradient overlays to the timer container
        timerContainer.appendChild(leftGradient);
        timerContainer.appendChild(rightGradient);
        
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'timerDisplay';
        timerDisplay.className = 'timer-display';
        timerDisplay.textContent = '00:00';
        timerDisplay.style.fontFamily = 'Bebas Neue, sans-serif';
        timerDisplay.style.fontSize = '80px';
        timerDisplay.style.fontWeight = 'bold';
        timerDisplay.style.fontStyle = 'italic';
        timerDisplay.style.marginBottom = '15px';
        timerDisplay.style.width = '25%';
        timerDisplay.style.paddingRight = '10px';
        timerDisplay.style.borderRadius = '10px';
        timerDisplay.style.backgroundColor = '#422d5e';
        timerDisplay.style.color = '#fff';
        timerDisplay.style.boxShadow = 'inset 0 0 10px rgb(21, 3, 43)';
        
        const timerControls = document.createElement('div');
        timerControls.className = 'timer-controls';
        timerControls.style.display = 'flex';
        timerControls.style.justifyContent = 'center';
        timerControls.style.gap = '15px';
        timerControls.style.fontFamily = 'Nunito Sans, sans-serif';
        
        const startPauseButton = document.createElement('button');
        startPauseButton.id = 'startPauseButton';
        startPauseButton.className = 'timer-button';
        startPauseButton.innerHTML = '<i class="fa-solid fa-play"></i>'; // Icon only, no text
        startPauseButton.style.padding = '10px 20px';
        startPauseButton.style.fontSize = '16px';
        startPauseButton.style.border = 'none';
        startPauseButton.style.borderRadius = '5px';
        startPauseButton.style.backgroundColor = '#422d5e';
        startPauseButton.style.color = 'white';
        startPauseButton.style.cursor = 'pointer';
        startPauseButton.style.fontFamily = 'Nunito Sans, sans-serif';
        
        const resetButton = document.createElement('button');
        resetButton.id = 'resetButton';
        resetButton.className = 'timer-button';
        resetButton.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
        resetButton.style.padding = '10px 20px';
        resetButton.style.fontSize = '16px';
        resetButton.style.border = 'none';
        resetButton.style.borderRadius = '5px';
        resetButton.style.backgroundColor = '#422d5e';
        resetButton.style.color = 'white';
        resetButton.style.cursor = 'pointer';
        resetButton.style.fontFamily = 'Nunito Sans, sans-serif';
        
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
        counterBox.style.fontFamily = 'Bebas Neue, sans-serif';
        counterBox.style.fontStyle = '24px';
        counterBox.style.marginBottom = '30px';
        
        const label = document.createElement('div');
        label.className = 'counter-label';
        label.textContent = counterNames[id];
        label.style.fontSize = '48px';
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
    timerManager.setDuration(this.duration); // 2 minutes

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
                startPauseButton.innerHTML = '<i class="fa-solid fa-play"></i>';
            } else {
                timerManager.start();
                console.log("Starting timer");
                startPauseButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
            }
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            timerManager.reset();
            startPauseButton.innerHTML = '<i class="fa-solid fa-play"></i>';
        });
    }
    
    // Set up new game button event
    const newGameButton = document.getElementById('newGameButton');
    if (newGameButton) {
        newGameButton.addEventListener('click', () => {
            if (!gameState.isGameInProgress) {
                const rounds = parseInt(prompt('How many rounds (for best of N)?', '3')) || 3;
                const duration = parseInt(prompt('How long per round (in seconds)', '60')) || 60;

                // Get Player names from text field with drop down

                showPlayerSelectionPopup((player1, player2) => {
                    console.log(`Starting new game with ${rounds} rounds of ${duration} seconds each`);
                    console.log(`Players: ${player1} vs ${player2}`);
                    
                    // // Update counter names
                    // counterNames['Chung'] = player1;
                    // counterNames['Hong'] = player2;
                    
                    // // Update the displayed labels
                    // const chungLabel = document.querySelector('#ChungTeam .counter-label');
                    // const hongLabel = document.querySelector('#HongTeam .counter-label');
                    // if (chungLabel) chungLabel.textContent = player1;
                    // if (hongLabel) hongLabel.textContent = player2;
                    
                    gameState.startGame(rounds, duration);
                    startPauseButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
                });
            }
        });
    }

    async function showPlayerSelectionPopup(callback) {
        const firebaseManager = new FirebaseManager();
        firebaseManager.initialize();
        let playerNames = [];

        let selectedPlayer1 = '';
        let selectedPlayer2 = '';
         try {
            
            const firebaseNames =  await firebaseManager.getAllPlayerNames();
            
            if (Array.isArray(firebaseNames) && firebaseNames.length > 0) {
                // Merge default names with Firebase names, remove duplicates
                playerNames = [...new Set([...playerNames, ...firebaseNames])];
                console.log("Loaded player names from Firebase:", playerNames);
            } else {
                console.log("No players found in Firebase, using defaults");
            }
        } catch (error) {
            console.log("Firebase error, using default player names:", error);
        }
        console.log("Available player names:", playerNames);
       
        // Create popup HTML
        const popupHTML = `
            <div id="playerPopup" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 2000;
                display: flex;
                justify-content: center;
                align-items: center;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    width: 400px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                ">
                    <h3 style="margin-top: 0; text-align: center; color: #422d5e;">Select Players</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Player 1 (Blue):</label>
                        <div style="position: relative;">
                            <input type="text" id="player1Input" placeholder="Enter player name" style="
                                width: 100%;
                                padding: 10px;
                                border: 2px solid #ddd;
                                border-radius: 5px;
                                font-size: 16px;
                                box-sizing: border-box;
                            ">
                            <div id="player1Dropdown" style="
                                position: absolute;
                                top: 100%;
                                left: 0;
                                right: 0;
                                background: white;
                                border: 1px solid #ddd;
                                border-top: none;
                                max-height: 150px;
                                overflow-y: auto;
                                display: none;
                                z-index: 2001;
                            "></div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Player 2 (Red):</label>
                        <div style="position: relative;">
                            <input type="text" id="player2Input" placeholder="Enter player name" style="
                                width: 100%;
                                padding: 10px;
                                border: 2px solid #ddd;
                                border-radius: 5px;
                                font-size: 16px;
                                box-sizing: border-box;
                            ">
                            <div id="player2Dropdown" style="
                                position: absolute;
                                top: 100%;
                                left: 0;
                                right: 0;
                                background: white;
                                border: 1px solid #ddd;
                                border-top: none;
                                max-height: 150px;
                                overflow-y: auto;
                                display: none;
                                z-index: 2001;
                            "></div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button id="cancelBtn" style="
                            padding: 10px 20px;
                            background: #ccc;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">Cancel</button>
                        <button id="okBtn" style="
                            padding: 10px 20px;
                            background: #422d5e;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">OK</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add popup to page
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        
        const popup = document.getElementById('playerPopup');
        const player1Input = document.getElementById('player1Input');
        const player2Input = document.getElementById('player2Input');
        const player1Dropdown = document.getElementById('player1Dropdown');
        const player2Dropdown = document.getElementById('player2Dropdown');
        const cancelBtn = document.getElementById('cancelBtn');
        const okBtn = document.getElementById('okBtn');

        function checkOkButton() {
            console.log('Checking OK button status:');
            console.log('selectedPlayer1:', selectedPlayer1);
            console.log('selectedPlayer2:', selectedPlayer2);
            
            if (selectedPlayer1 && selectedPlayer2 && selectedPlayer1 !== selectedPlayer2) {
                okBtn.disabled = false;
                okBtn.style.background = '#422d5e';
                okBtn.style.color = 'white';
                okBtn.style.cursor = 'pointer';
                console.log('OK button enabled');
            } else {
                okBtn.disabled = true;
                okBtn.style.background = '#ccc';
                okBtn.style.color = '#666';
                okBtn.style.cursor = 'not-allowed';
                console.log('OK button disabled');
            }
        }
        
        // Dropdown functionality
        function setupDropdown(input, dropdown) {
            input.addEventListener('input', () => {
                const value = input.value.toLowerCase();
                const filtered = playerNames.filter(name => {
                    if (typeof name !== 'string') {
                        return false;
                    }
                    return name.toLowerCase().includes(value)
                });

                // console.log(`Filtering for "${value}":`, filtered);
                
                if (filtered.length > 0 && input.value.length > 0) {
                    dropdown.innerHTML = filtered.map(name => 
                        `<div style="padding: 8px 10px; cursor: pointer; border-bottom: 1px solid #eee;" 
                            onmouseover="this.style.backgroundColor='#f0f0f0'" 
                            onmouseout="this.style.backgroundColor='white'"
                            onclick="selectPlayer('${name}', '${input.id}')">${name}</div>`
                    ).join('');
                    dropdown.style.display = 'block';
                } else if (input.value.trim() && filtered.length === 0) {
                    // Show button to add new player if no matches found
                    console.log(`No matches found for "${value}" - showing add option`);
                    dropdown.innerHTML = `<div style="
                        padding: 8px 10px; 
                        cursor: pointer; 
                        text-align: center;
                        background-color: #e8f5e8;
                        color: #2e7d32;
                        border-bottom: 1px solid #eee;
                    " onclick="addPlayer('${input.value.trim()}', '${input.id}')">Add "${input.value.trim()}"</div>`;
                    dropdown.style.display = 'block'; // <- This was missing!
                } else {
                    dropdown.style.display = 'none';
                }

                if (input.id === 'player1Input') {
                    selectedPlayer1 = '';
                } else if (input.id === 'player2Input') {
                    selectedPlayer2 = '';
                }
                checkOkButton();
            });
            
            input.addEventListener('blur', () => {
                setTimeout(() => dropdown.style.display = 'none', 200);
            });
        }

        window.addPlayer = function(name, inputId) {
            if (name.trim() === '') return;
            
            // Add new player to Firebase
            const firebaseManager = new FirebaseManager();
            firebaseManager.initialize();
            firebaseManager.addPlayer(name).then(() => {
                console.log(`Added new player: ${name}`);
                
                // Update dropdowns
                playerNames.push(name);
                setupDropdown(player1Input, player1Dropdown);
                setupDropdown(player2Input, player2Dropdown);
                
                // Select the new player
                selectPlayer(name, inputId);
            }).catch(error => {
                console.error("Error adding player:", error);
            });
        }

        
        // Global function for selecting from dropdown
        window.selectPlayer = function(name, inputId) {
            const targetInput = document.getElementById(inputId);
            if (targetInput) {
                targetInput.value = name;
                
                // Hide the correct dropdown
                if (inputId === 'player1Input') {
                    selectedPlayer1 = name;
                    player1Dropdown.style.display = 'none';
                } else if (inputId === 'player2Input') {
                    selectedPlayer2 = name;
                    player2Dropdown.style.display = 'none';
                }

                checkOkButton(); 
                
                // Focus the other input if this one is filled and the other is empty
                if (inputId === 'player1Input'  && !selectedPlayer2) {
                    player2Input.focus();
                } else if (inputId === 'player2Input' && !selectedPlayer1) {
                    player1Input.focus();
                }
            }
        };
        
        setupDropdown(player1Input, player1Dropdown);
        setupDropdown(player2Input, player2Dropdown);
        
        // Set default values
        player1Input.value = 'Chung';
        player2Input.value = 'Hong';
        selectedPlayer1 = 'Chung';  // Mark as selected
        selectedPlayer2 = 'Hong';   // Mark as selected
        checkOkButton(); 
        // Button events
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(popup);
            delete window.selectPlayer;
        });
        
        okBtn.addEventListener('click', () => {
            const p1 = player1Input.value.trim() || 'Player 1';
            const p2 = player2Input.value.trim() || 'Player 2';
            
            document.body.removeChild(popup);
            delete window.selectPlayer;
            callback(p1, p2);
        });
        
        // ESC key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(popup);
                delete window.selectPlayer;
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Focus first input
        setTimeout(() => player1Input.focus(), 100);
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
                        else if (data.type === 'reset-counters') {
                            console.log("Reset counters message received - zeroing all counters");
                            // Reset all counter displays to zero
                            for (const id of counterIds) {
                                const element = counterValues[id];
                                if (element) {
                                    console.log(`Resetting ${id} to 0`);
                                    element.textContent = '0';
                                    
                                    // Add animation for reset
                                    element.style.transform = 'scale(0.8)';
                                    element.style.transition = 'transform 0.3s';
                                    setTimeout(() => {
                                        element.style.transform = 'scale(1)';
                                    }, 300);
                                }
                            }
                            
                            // Also reset our local counters object
                            this.counters = {};
                        }
                        // Handle timer messages
                        else if (data.type && data.type.startsWith('timer-')) {
                            timerManager.handleServerMessage(data);
                            if (startPauseButton) {
                                startPauseButton.innerHTML = timerManager.isRunning ? '<i class="fa-solid fa-pause"></i>' : 
            '<i class="fa-solid fa-play"></i>';
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

        .game-button, .timer-button {
            transition: all 0.2s ease;
            position: relative;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .game-button:hover, .timer-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            background-color: #5a3e7f !important; /* Slightly lighter shade */
        }
        
        .game-button:active, .timer-button:active {
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            background-color: #362449 !important; /* Slightly darker shade */
        }
    `;
    document.head.appendChild(style);
    
    // Connect to the server
    counterManager.connect();
});