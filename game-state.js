// Comprehensive Game State Manager
class GameStateManager {
    constructor(counterManager, timerManager) {
        this.counterManager = counterManager;
        this.timerManager = timerManager;
        this.currentRound = 1;
        this.maxRounds = 3; // Default for Best of 3
        this.isGameOver = false;
        this.isGameInProgress = false; // New flag to prevent multiple game starts
        this.scores = {}; // Track scores by round
        this.roundWinners = []; // Track which team won each round
        this.roundInfoElement = null;
        this.duration = 60; // Default round duration in seconds
        
        // Bind timer end event
        this.timerManager.setOnTimerEnd(() => {
            console.log('Timer ended - calling handleRoundEnd');
            this.handleRoundEnd();
        });
    }
    
    // Set the element to display round information
    setRoundInfoElement(element) {
        this.roundInfoElement = element;
        return this;
    }

    updateRoundWinTracker() {
        // Count the number of rounds won by each player
        const winCounts = { Chung: 0, Hong: 0 };
        this.roundWinners.forEach(winner => {
            if (winner === 'Chung' || winner === 'Hong') {
                winCounts[winner]++;
            }
        });
        const winsNeeded = Math.ceil(this.maxRounds / 2);
        // Update the dots for each player
        ['Chung', 'Hong'].forEach(player => {
            const tracker = document.querySelector(`#${player}Team .round-win-tracker`);
            if (tracker) {
                tracker.innerHTML = '';
               
                for (let i = 0; i < winsNeeded; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'round-dot';
                    dot.style.width = '15px';
                    dot.style.height = '15px';
                    dot.style.borderRadius = '50%';
                    dot.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
                    
                    // Light up the dot if this win has been achieved
                    if (i < (winCounts[player] || 0)) {
                        dot.style.backgroundColor = player === 'Hong' ? '#ea4335' : '#4285f4';
                        dot.style.boxShadow = `0 0 10px ${player === 'Hong' ? '#ea4335' : '#4285f4'}`;
                    } else {
                        dot.style.backgroundColor = '#ccc';
                    }
                    
                    tracker.appendChild(dot);
                }
            }
        });
    }
    
    // Update round information display
    updateRoundInfo() {
        if (this.roundInfoElement) {
            // Count current wins
            const winCounts = {};
            for (const winner of this.roundWinners) {
                if (winner === 'Tie' || winner === 'None') continue;
                winCounts[winner] = (winCounts[winner] || 0) + 1;
            }
            
            // Format as "Round X - Team A: 1, Team B: 0"
            let infoText = `Round ${this.currentRound}`;
            
            
            this.roundInfoElement.textContent = infoText;
        }
    }

    
    
    // Save scores for the current round
    saveRoundScores() {
        // Get current counter values
        const roundScores = {};
        for (const [id, value] of Object.entries(this.counterManager.counters || {})) {
            roundScores[id] = value;
        }
        
        // Save for this round
        this.scores[`round${this.currentRound}`] = roundScores;
        
        console.log(`Round ${this.currentRound} scores saved:`, roundScores);
    }
    
    // Calculate total scores across all rounds
    calculateTotalScores() {
        const totalScores = {};
        
        // Sum scores from all rounds
        for (const roundScores of Object.values(this.scores)) {
            for (const [id, score] of Object.entries(roundScores)) {
                totalScores[id] = (totalScores[id] || 0) + score;
            }
        }
        
        return totalScores;
    }
    
    // Determine winner of a specific round
    determineRoundWinner(roundNum) {
        const roundScores = this.scores[`round${roundNum}`] || {};
        let highestScore = -1;
        let winner = 'None';
        
        for (const [team, score] of Object.entries(roundScores)) {
            if (score > highestScore) {
                highestScore = score;
                winner = team;
            } else if (score === highestScore && score > 0) {
                winner = 'Tie';
            }
        }
        
        return winner;
    }
    
    // Check if we have an overall winner based on best-of-N system
    checkForOverallWinner() {
        const winsNeeded = Math.ceil(this.maxRounds / 2);
        const winCounts = {};
        
        // Count wins for each team
        for (const winner of this.roundWinners) {
            if (winner === 'Tie') continue;
            winCounts[winner] = (winCounts[winner] || 0) + 1;
            
            // Check if anyone has enough wins
            if (winCounts[winner] >= winsNeeded) {
                return winner;
            }
        }
        
        return null; // No overall winner yet
    }
    
    // Start a new game
    startGame(maxRounds = 3, duration = 60) {
        // Prevent multiple game starts
        if (this.isGameInProgress) {
            console.warn('A game is already in progress');
            return;
        }
    
        // Close any existing modals
        this.closeExistingModals();
        this.duration = duration; // Default to 60 seconds if not provided
        this.currentRound = 1;
        this.maxRounds = maxRounds;
        this.isGameOver = false;
        this.isGameInProgress = true; // Set game in progress
        this.scores = {};
        this.roundWinners = [];

        // Set timer duration (2 minutes per round)
        this.timerManager.setDuration(duration);
        
        // Reset counters via WebSocket
        this.resetAllCounters();
        
        // Reset timer
        this.timerManager.reset();
        

        
        // Start timer for first round
        this.timerManager.start();
        
        // Update round info
        this.updateRoundInfo();
        this.updateRoundWinTracker();
        
        // Announce game start
        this.announceGameState(`Game started! Best of ${this.maxRounds} rounds`);
    }
    
    // Close any existing modal dialogs
    closeExistingModals() {
        const existingModals = document.querySelectorAll('.scores-modal');
        existingModals.forEach(modal => {
            document.body.removeChild(modal);
        });
    }
    
    // Handle round end
    handleRoundEnd() {
        // Prevent multiple round end calls
        if (!this.isGameInProgress || this.isGameOver) {
            console.log('Ignoring round end - game not in progress or already over');
            return;
        }


        // Add flag to prevent multiple calls
        if (this.processingRoundEnd) {
            console.log('Already processing round end');
            return;
        }
        this.processingRoundEnd = true;
        this.saveRoundScores();
        // Determine round winner
        const roundWinner = this.determineRoundWinner(this.currentRound);
        this.roundWinners.push(roundWinner);
        this.updateRoundWinTracker();
        
        // Announce round result
        this.announceGameState(`Round ${this.currentRound} complete! Winner:  ${this.getPlayerName(roundWinner)}`);
        
        // Check if we have an overall winner
        const overallWinner = this.checkForOverallWinner();
        
        if (overallWinner || this.currentRound >= this.maxRounds) {
            // We have a winner or reached max rounds, show round summary then end game
            this.displayRoundSummary(true, overallWinner);
        } else {
            // No winner yet, show round summary and continue
            this.displayRoundSummary(false);
        }

        this.processingRoundEnd = false;
    }
    
    // Start the next round
    startNextRound() {
        // Ensure we don't go beyond max rounds
        if (this.currentRound >= this.maxRounds) {
            this.endGame();
            return;
        }


        this.currentRound++;
        
        // Reset counters for new round
        this.resetAllCounters();
       
        // Reset and start timer
        this.timerManager.reset();
        this.timerManager.start();
        
        // Update round info
        this.updateRoundInfo();
        
        //Broadcast round start via WebSocket
        if (this.counterManager.socket && this.counterManager.socket.readyState === WebSocket.OPEN) {
            this.counterManager.socket.send(JSON.stringify({
                type: 'round-start'
            }));
        }

        // Announce new round
        this.announceGameState(`Round ${this.currentRound} started!`);
    }
    
    // Reset all counters to zero
    resetAllCounters() {
        // Send reset message via WebSocket
        if (this.counterManager.socket && this.counterManager.socket.readyState === WebSocket.OPEN) {
            this.counterManager.socket.send(JSON.stringify({
                type: 'reset-counters'
            }));
        }
    }

    
    
    // Announce game state changes
    announceGameState(message) {
        console.log(message);
        
        // Create or update announcement element
        let announcementElement = document.getElementById('game-announcement');
        if (!announcementElement) {
            announcementElement = document.createElement('div');
            announcementElement.id = 'game-announcement';
            announcementElement.className = 'game-announcement';
            document.body.appendChild(announcementElement);
        }
        
        announcementElement.textContent = message;
        announcementElement.style.opacity = '1';
        
        // Fade out after 3 seconds
        setTimeout(() => {
            announcementElement.style.opacity = '0';
        }, 3000);
    }

    getPlayerName(color) {
        // Check if we're getting a player name directly from overrides
        console.log("Getting player name for color:", color);

        if (this.playerNames && this.playerNames[color]) {
            return this.playerNames[color];
        }

        console.log("No player name found for color:", color);
        
        // Get player names from global scope (fallback)
        if (window.player1Name && window.player2Name) {
            if (color === 'Chung') {
                return window.player1Name;
            } else if (color === 'Hong') {
                return window.player2Name;
            }
        }
        
        // Last resort fallback to color name
        return color;
    }

    // Add this method to GameStateManager to set player names directly:
    setPlayerNames(chung, hong) {
        this.playerNames = {
            'Chung': chung,
            'Hong': hong
        };
        console.log("Game state player names set:", this.playerNames);
        return this;
    }
    
    // Display round summary
    displayRoundSummary(isFinalRound, overallWinner = null) {
        const roundScores = this.scores[`round${this.currentRound}`] || {};
        const roundWinner = this.roundWinners[this.currentRound - 1] || 'None';
        
        // Create modal for round summary
        const modal = document.createElement('div');
        modal.className = 'scores-modal';
        modal.style.display = 'block';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'scores-modal-content';
        
        const title = document.createElement('h2');
        title.textContent = `Round ${this.currentRound} Complete`;
        
        // Round winner announcement
        const winnerAnnouncement = document.createElement('div');
        winnerAnnouncement.className = 'winner-announcement';
        winnerAnnouncement.textContent = `Round Winner: ${this.getPlayerName(roundWinner)}`;
        
        // Match standings
        const standings = document.createElement('div');
        standings.className = 'match-standings';
        
        // Calculate wins for each team
        const winCounts = {};
        for (const winner of this.roundWinners) {
            if (winner === 'Tie' || winner === 'None') continue;
            winCounts[winner] = (winCounts[winner] || 0) + 1;
        }
        
        // Create standings text
        let standingsText = "Match Standing: ";
        for (const [team, wins] of Object.entries(winCounts)) {
            standingsText += `${this.getPlayerName(team)} (${wins} wins) `;
        }
        standings.textContent = standingsText;
        
        const scoresList = document.createElement('div');
        scoresList.className = 'round-scores';
        
        // Add scores for each team
        for (const [team, score] of Object.entries(roundScores)) {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            if (team === roundWinner) {
                scoreItem.classList.add('winner');
            }
            const playerName = this.getPlayerName(team);
            scoreItem.innerHTML = `<span class="team-name">${playerName}</span>: <span class="team-score">${score}</span>`;
            scoresList.appendChild(scoreItem);
        }
        
        // Create button to start next round or end game
        const continueButton = document.createElement('button');
        continueButton.className = 'continue-button';
        
        if (isFinalRound) {
            continueButton.textContent = 'Show Final Results';
            continueButton.onclick = () => {
                modal.style.display = 'none';
                document.body.removeChild(modal);
                this.endGame(overallWinner);
            };
        } else {
            continueButton.textContent = 'Start Next Round';
            continueButton.onclick = () => {
                modal.style.display = 'none';
                document.body.removeChild(modal);
                this.startNextRound();
            };
        }
        
        // Assemble modal
        modalContent.appendChild(title);
        modalContent.appendChild(winnerAnnouncement);
        modalContent.appendChild(standings);
        modalContent.appendChild(scoresList);
        modalContent.appendChild(continueButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }
    
    // End the game
    endGame(overallWinner = null) {
        // Prevent multiple end game calls
        if (!this.isGameInProgress) return;

        this.isGameOver = true;
        this.isGameInProgress = false; // Mark game as not in progress
        //this.timerManager.pause();
        
        // If no winner was passed, calculate final scores and determine winner
        if (!overallWinner) {
            // Calculate based on match wins
            const winCounts = {};
            for (const winner of this.roundWinners) {
                if (winner === 'Tie' || winner === 'None') continue;
                winCounts[winner] = (winCounts[winner] || 0) + 1;
            }
            
            let highestWins = 0;
            overallWinner = 'None';
            
            for (const [team, wins] of Object.entries(winCounts)) {
                if (wins > highestWins) {
                    highestWins = wins;
                    overallWinner = team;
                } else if (wins === highestWins) {
                    overallWinner = 'Tie';
                }
            }
        }
        
        // Update round info
        if (this.roundInfoElement) {
            this.roundInfoElement.textContent = `Game Over! Winner: ${overallWinner}`;
        }

        //Send final scores to WebSocket
        if (this.counterManager.socket && this.counterManager.socket.readyState === WebSocket.OPEN) {
            this.counterManager.socket.send(JSON.stringify({
                type: 'game-over',
                game_winner: overallWinner,
                scores: this.calculateTotalScores(),
            }));
        }
        
        // Announce winner
        this.announceGameState(`Game Over! Winner: ${overallWinner}`);
        
        // Display final scores
        console.log("Final match results:", this.roundWinners);
        
        // Display final scores table
        this.displayFinalScores(overallWinner);
    }
    
    // Display final scores
    displayFinalScores(overallWinner) {
        const totalScores = this.calculateTotalScores();
        
        // Create modal for final scores
        const modal = document.createElement('div');
        modal.className = 'scores-modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'scores-modal-content';
        
        const title = document.createElement('h2');
        title.textContent = 'Final Results';
        
        const winnerAnnouncement = document.createElement('div');
        winnerAnnouncement.className = 'final-winner-announcement';
        winnerAnnouncement.textContent = `Match Winner: ${this.getPlayerName(overallWinner)}`;
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-button';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => modal.style.display = 'none';
        
        const newGameBtn = document.createElement('button');
        newGameBtn.className = 'continue-button';
        newGameBtn.textContent = 'Start New Game';
        newGameBtn.onclick = () => {
            // Close the modal
            modal.style.display = 'none';
            document.body.removeChild(modal);
            
            // Ensure we're not already in a game
            if (!this.isGameInProgress) {
                // Prompt for rounds
                const rounds = parseInt(prompt('How many rounds (for best of N)?', '3')) || 3;
                const duration = parseInt(prompt('Round duration in seconds (default 60):', '60')) || 60;
                // Start the new game
                this.startGame(rounds,duration);
            }
        };
        
        // Create table for final scores
        const table = document.createElement('table');
        table.className = 'scores-table';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const teamHeader = document.createElement('th');
        teamHeader.textContent = 'Team';
        headerRow.appendChild(teamHeader);
        
        // Add headers for each round
        for (let i = 1; i <= this.currentRound; i++) {
            const roundHeader = document.createElement('th');
            roundHeader.textContent = `Round ${i}`;
            headerRow.appendChild(roundHeader);
        }
        
        const winnerHeader = document.createElement('th');
        winnerHeader.textContent = 'Round Wins';
        headerRow.appendChild(winnerHeader);
        
        const totalHeader = document.createElement('th');
        totalHeader.textContent = 'Total Points';
        headerRow.appendChild(totalHeader);
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        // Get all team names
        const teams = new Set();
        for (let i = 1; i <= this.currentRound; i++) {
            const roundScores = this.scores[`round${i}`] || {};
            for (const team of Object.keys(roundScores)) {
                teams.add(team);
            }
        }
        
        // Count wins per team
        const winCounts = {};
        for (const winner of this.roundWinners) {
            if (winner === 'Tie' || winner === 'None') continue;
            winCounts[winner] = (winCounts[winner] || 0) + 1;
        }
        
        // Process each team's scores
        for (const team of teams) {
            const row = document.createElement('tr');
            
            // Team name cell
            const teamCell = document.createElement('td');
            const playerName = this.getPlayerName(team);
            teamCell.textContent = playerName;
            teamCell.className = team === overallWinner ? 'winner' : '';
            row.appendChild(teamCell);
            
            // Round scores cells
            for (let i = 1; i <= this.currentRound; i++) {
                const roundCell = document.createElement('td');
                const roundScores = this.scores[`round${i}`] || {};
                const roundScore = roundScores[team] || 0;
                const roundWinner = this.roundWinners[i-1];
                
                roundCell.textContent = roundScore;
                if (roundWinner === team) {
                    roundCell.className = 'round-winner';
                }
                
                row.appendChild(roundCell);
            }
            
            // Round wins cell
            const winsCell = document.createElement('td');
            winsCell.textContent = winCounts[team] || 0;
            winsCell.className = 'wins-count';
            row.appendChild(winsCell);
            
            // Total score cell
            const totalCell = document.createElement('td');
            totalCell.textContent = totalScores[team] || 0;
            totalCell.className = 'total-score';
            row.appendChild(totalCell);
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        
        // Assemble modal
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(winnerAnnouncement);
        modalContent.appendChild(table);
        modalContent.appendChild(newGameBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Show modal
        modal.style.display = 'block';
    }
}

// Make GameStateManager available globally
window.GameStateManager = GameStateManager;