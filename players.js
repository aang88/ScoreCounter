document.addEventListener('DOMContentLoaded', function(){
    const playerSearch = document.getElementById('playerSearch');
    const playerDropdown = document.getElementById('playerDropdown');
    var selectedPlayer = '';
    let playerNames = [];
    
    function setupDropdown(input, dropdown) {
            input.addEventListener('input', () => {
        
                let filtered;
                const value = input.value.toLowerCase();
                if (value.length === 0) {
                    // Show all players in alphabetical order when input is empty
                    filtered = [...playerNames].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                } else {
                    // Filter players based on input
                    filtered = playerNames.filter(name => {
                        if (typeof name !== 'string') {
                            return false;
                        }
                        return name.toLowerCase().includes(value);
                    }).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                }

                if (filtered.length > 0) {
                dropdown.innerHTML = filtered.map(name => 
                    `<div style="padding: 8px 10px; cursor: pointer; border-bottom: 1px solid #eee;" 
                        onmouseover="this.style.backgroundColor='#f0f0f0'" 
                        onmouseout="this.style.backgroundColor='white'"
                        onclick="selectPlayer('${name}', '${input.id}')">${name}</div>`
                ).join('');
                dropdown.style.display = 'block';            } else if (input.value.trim() && filtered.length === 0) {
                // Show button to add new player if no matches found and input has text
                console.log(`No matches found for "${value}" - showing add option`);
                dropdown.innerHTML = `<div style="
                    padding: 8px 10px; 
                    cursor: pointer; 
                    text-align: center;
                    background-color: #ffeaea;
                    color: rgb(199, 32, 32);
                    border-bottom: 1px solid #eee;
                ">No results for "${input.value.trim()}"</div>`;
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }

            if (input.id === 'playerSearch') {
                selectedPlayer = '';
            } 
        });
        
        // Show all players when clicking on the input field
        input.addEventListener('focus', () => {
            if (input.value.trim() === '') {
                // Trigger the input event to show all players
                input.dispatchEvent(new Event('input'));
            }
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => dropdown.style.display = 'none', 200);
        });
        }
        
        window.selectPlayer = function(name, inputId) {
            const targetInput = document.getElementById(inputId);
            if (targetInput) {
                targetInput.value = name;
                
                // Hide the correct dropdown
                if (inputId === 'playerSearch') {
                    selectedPlayer = name;
                    createPlayerCard(name);
                    console.log(`Selected player: ${selectedPlayer}`);
                    playerDropdown.style.display = 'none';
                }
            }
        };

        async function getAllPlayerNames() {
            const firebaseManager = new FirebaseManager();
            firebaseManager.initialize();
            try{
               await firebaseManager.getAllPlayerNames().then(names => {
                    playerNames = names;
                    console.log('Player names loaded:', playerNames);
                });
            }
            catch (error) {
                console.error('Error loading player names:', error);
            }
        }

        function getPlayerStats(playerName) {
            const firebaseManager = new FirebaseManager();
            firebaseManager.initialize();
            return firebaseManager.getPlayerStats(playerName)
                .then(stats => {
                    if (stats) {
                        console.log(`Stats for ${playerName}:`, stats);
                        return stats;
                    } else {
                        console.warn(`No stats found for ${playerName}`);
                        return null;
                    }
                })
                .catch(error => {
                    console.error(`Error getting stats for ${playerName}:`, error);
                    return null;
                });
        }        function createPlayerCard(playerName) {
            getPlayerStats(playerName).then(stats => {
                if (stats) {
                    // Clear existing cards first
                    const playerCardsContainer = document.getElementById('playerCards');
                    playerCardsContainer.innerHTML = '';
                    
                    const card = document.createElement('div');
                    card.className = 'player-card';
                    card.style.cssText = `
                        background: white;
                        border: 2px solid #ddd;
                        border-radius: 10px;
                        padding: 15px;
                        min-width: 200px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                    `;
                    card.innerHTML = `
                        <h3 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px;">${playerName}</h3>
                        <p style="margin: 5px 0; color: #666;"><strong>Height:</strong> ${stats.height || 'N/A'}</p>
                        <p style="margin: 5px 0; color: #666;"><strong>Weight:</strong> ${stats.weight || 'N/A'}</p>
                        <p style="margin: 5px 0; color: #28a745;"><strong>Wins:</strong> ${stats.wins || 0}</p>
                        <p style="margin: 5px 0; color: #dc3545;"><strong>Losses:</strong> ${stats.losses || 0}</p>
                    `;
                    
                    // Add hover effects
                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'translateY(-2px)';
                        card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    });
                    
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'translateY(0)';
                        card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                    });
                    
                    playerCardsContainer.appendChild(card);
                } else {
                    console.warn(`No stats available for ${playerName}`);
                }
            });
        }

    
    
        getAllPlayerNames().then(() => {
            // Initialize dropdowns after player names are loaded
            setupDropdown(playerSearch, playerDropdown);
            
            // Check if a player is already selected
            if (selectedPlayer) {
                playerSearch.value = selectedPlayer;
                playerDropdown.style.display = 'none';
            } else {
                playerSearch.value = '';
                playerDropdown.style.display = 'none';
            }
        }

        );

});
