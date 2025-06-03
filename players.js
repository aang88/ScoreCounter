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
                    displayRecentMatches(stats);
                } else {
                    console.warn(`No stats available for ${playerName}`);
                }
            });
        }

        
        
        async function displayRecentMatches(stats) {
            const matches = stats.matches || [];
            const recentMatchesContainer = document.getElementById('recentMatches');
            
            if (!recentMatchesContainer) {
                console.error('recentMatches container not found');
                return;
            }
            
            // Clear existing matches
            recentMatchesContainer.innerHTML = '<h3>Recent Matches</h3>';
            
            const firebaseManager = new FirebaseManager();
            await firebaseManager.initialize();
            
            for (const matchMedia of matches) {
                // Create main match card container
                const matchContainer = document.createElement('div');
                matchContainer.className = 'match-container';
                
                // Create the clickable match card
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';
                matchCard.style.cssText = `
                    background: white;
                    border: 2px solid #ddd;
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 10px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                matchCard.innerHTML = `
                    <h4 style="margin: 0; color: #333;">Match ID: ${matchMedia.match_id}</h4>
                    <p style="margin: 5px 0; color: #666;"><strong>Opponent:</strong> ${matchMedia.opponent}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Score:</strong> ${matchMedia.score.Chung} - ${matchMedia.score.Hong}</p>
                    <p style="margin: 5px 0; color: ${matchMedia.result === 'win' ? '#28a745' : '#dc3545'};"><strong>Result:</strong> ${matchMedia.result.toUpperCase()}</p>
                    <div class="expand-arrow" style="float: right; font-weight: bold; color: #666;">▼</div>
                `;

                // Create the hidden replay section
                const replaySection = document.createElement('div');
                replaySection.className = 'replay-section';
                replaySection.style.cssText = `
                    display: none;
                    background: #f8f9fa;
                    border: 1px solid #ddd;
                    border-top: none;
                    border-radius: 0 0 10px 10px;
                    padding: 15px;
                `;
                replaySection.innerHTML = '<div class="loading">Loading replay data...</div>';

                // Add click event to toggle replay
                matchCard.addEventListener('click', async () => {
                    const arrow = matchCard.querySelector('.expand-arrow');
                    
                    if (replaySection.style.display === 'none') {
                        // Show replay section
                        replaySection.style.display = 'block';
                        arrow.textContent = '▲';
                        
                        // Load replay data if not already loaded
                        if (replaySection.innerHTML.includes('Loading replay data...')) {
                            try {
                                // Get full match data from Firebase
                                const fullMatchData = await firebaseManager.getMatchStats(matchMedia.match_id);
                                
                                if (fullMatchData) {
                                    // Use your existing MatchCard methods
                                    const tempMatchCard = new MatchCard(matchMedia.match_id, firebaseManager);
                                    const standaloneReplay = tempMatchCard.createStandaloneReplaySection(fullMatchData);
                                    
                                    // Replace loading content with actual replay
                                    replaySection.innerHTML = '';
                                    replaySection.appendChild(standaloneReplay);
                                } else {
                                    replaySection.innerHTML = '<p>No replay data available</p>';
                                }
                            } catch (error) {
                                console.error('Error loading replay:', error);
                                replaySection.innerHTML = '<p>Error loading replay data</p>';
                            }
                        }
                    } else {
                        // Hide replay section
                        replaySection.style.display = 'none';
                        arrow.textContent = '▼';
                    }
                });

                // Add hover effects
                matchCard.addEventListener('mouseenter', () => {
                    matchCard.style.transform = 'translateY(-2px)';
                    matchCard.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                });
                
                matchCard.addEventListener('mouseleave', () => {
                    matchCard.style.transform = 'translateY(0)';
                    matchCard.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                });

                // Append everything to container
                matchContainer.appendChild(matchCard);
                matchContainer.appendChild(replaySection);
                recentMatchesContainer.appendChild(matchContainer);
            }
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
