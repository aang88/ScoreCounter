// game-state.js - Game state management
class GameStateManager {
    constructor(counterManager, timerManager) {
        this.counterManager = counterManager;
        this.timerManager = timerManager;
        this.currentRound = 0;
        this.maxRounds = 3; // Default, can be configured
        this.isGameOver = false;
        this.scores = {}; // Track scores by round
        this.gameInProgress = false;
        
        // Bind timer end event
        this.timerManager.setOnTimerEnd(() => this.handleRoundEnd());
    }
    
    // Start a new game
    startGame(maxRounds = 3) {
        this.currentRound = 1;
        this.maxRounds = maxRounds;
        this.isGameOver = false;
        this.scores = {};
        this.gameInProgress = true;
        
        // Reset counters via WebSocket
        this.resetAllCounters();
        
        // Reset and start timer for first round
        this.timerManager.reset();
        this.timerManager.start();
        
        // Announce game start
        this.announceGameState(`Game started! Round 1 of ${this.maxRounds}`);
        
        // Update UI
        this.updateGameUI();
    }
    
    // Handle round end
    handleRoundEnd() {
        if (!this.gameInProgress) return;
        
        // Save scores for this round
        this.saveRoundScores();
        
        if (this.currentRound >= this.maxRounds) {
            this.endGame();
        } else {
            this.startNextRound();
        }
    }
    
    // Save scores for the current round
    saveRoundScores() {
        // Get current counter values
        const roundScores = {};
        for (const [id, value] of Object.entries(this.counterManager.counters)) {
            roundScores[id] = value;
        }
        
        // Save for this round
        this.scores[`round${this.currentRound}`] = roundScores;
        
        console.log(`Round ${this.currentRound} scores saved:`, roundScores);
    }
    
    // Start the next round
    startNextRound() {
        this.currentRound++;
        
        // Reset counters for new round
        this.resetAllCounters();
        
        // Reset and start timer
        this.timerManager.reset();
        this.timerManager.start();
        
        // Announce new round
        this.announceGameState(`Round ${this.currentRound} of ${this.maxRounds} started!`);
        
        // Update UI
        this.updateGameUI();
    }
    
    // End the game
    endGame() {
        this.isGameOver = true;
        this.gameInProgress = false;
        this.timerManager.pause();
        
        // Calculate final scores
        const finalScores = this.calculateFinalScores();
        const winner = this.determineWinner(finalScores);
        
        // Announce winner
        this.announceGameState(`Game Over! Winner: ${winner}`);
        
        // Display final scores and summary
        this.displayGameSummary(finalScores, winner);
        
        // Update UI
        this.updateGameUI();
    }
    
    // Calculate final scores across all rounds
    calculateFinalScores() {
        const finalScores = {};
        
        // Sum scores from all rounds
        for (const roundScores of Object.values(this.scores)) {
            for (const [id, score] of Object.entries(roundScores)) {
                finalScores[id] = (finalScores[id] || 0) + score;
            }
        }
        
        return finalScores;
    }
    
    // Determine the winner based on final scores
    determineWinner(finalScores) {
        let winner = 'None';
        let highestScore = -1;
        
        for (const [id, score] of Object.entries(finalScores)) {
            if (score > highestScore) {
                highestScore = score;
                winner = id.charAt(0).toUpperCase() + id.slice(1); // Capitalize
            } else if (score === highestScore) {
                winner = `Tie between ${winner} and ${id.charAt(0).toUpperCase() + id.slice(1)}`;
            }
        }
        
        return winner;
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
    
    // Update game UI elements
    updateGameUI() {
        // Update round info if element exists
        const roundInfoElement = document.getElementById('round-info');
        if (roundInfoElement) {
            if (this.gameInProgress) {
                roundInfoElement.textContent = `Round ${this.currentRound} of ${this.maxRounds}`;
            } else if (this.isGameOver) {
                roundInfoElement.textContent = 'Game Over';
            } else {
                roundInfoElement.textContent = 'Press New Game to start';
            }
        }
        
        // Update game controls if they exist
        const newGameButton = document.getElementById('new-game-button');
        if (newGameButton) {
            newGameButton.disabled = this.gameInProgress;
        }
    }
    
    // Display game summary
    displayGameSummary(finalScores, winner) {
        // Create summary container
        let summaryElement = document.getElementById('game-summary');
        if (!summaryElement) {
            summaryElement = document.createElement('div');
            summaryElement.id = 'game-summary';
            summaryElement.className = 'game-summary';
            document.body.appendChild(summaryElement);
        }
        
        // Generate summary HTML
        let summaryHTML = `
            <h2>Game Summary</h2>
            <h3>Winner: ${winner}</h3>
            <h4>Final Scores:</h4>
            <ul>
        `;
        
        for (const [id, score] of Object.entries(finalScores)) {
            const teamName = id.charAt(0).toUpperCase() + id.slice(1); // Capitalize
            summaryHTML += `<li>${teamName}: ${score}</li>`;
        }
        
        summaryHTML += `</ul><h4>Round Breakdown:</h4>`;
        
        for (let i = 1; i <= this.maxRounds; i++) {
            const roundScores = this.scores[`round${i}`] || {};
            summaryHTML += `<h5>Round ${i}:</h5><ul>`;
            
            for (const [id, score] of Object.entries(roundScores)) {
                const teamName = id.charAt(0).toUpperCase() + id.slice(1); // Capitalize
                summaryHTML += `<li>${teamName}: ${score}</li>`;
            }
            
            summaryHTML += `</ul>`;
        }
        
        summaryHTML += `<button id="close-summary">Close</button>`;
        
        // Set content and show
        summaryElement.innerHTML = summaryHTML;
        summaryElement.style.display = 'block';
        
        // Add close button handler
        document.getElementById('close-summary').addEventListener('click', () => {
            summaryElement.style.display = 'none';
        });
    }
}

// Make GameStateManager available globally
window.GameStateManager = GameStateManager;