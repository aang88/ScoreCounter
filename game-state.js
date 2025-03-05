// Improved game-state.js - Game state management with Best of 3 system
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
        
        // Bind timer end event
        this.timerManager.setOnTimerEnd(() => this.handleRoundEnd());
    }
    
    // Set the element to display round information
    setRoundInfoElement(element) {
        this.roundInfoElement = element;
        return this;
    }
    
    // Start a new game
    startGame(maxRounds = 3) {
        // Prevent multiple game starts
        if (this.isGameInProgress) {
            console.warn('A game is already in progress');
            return;
        }

        // Close any existing modals
        this.closeExistingModals();

        this.currentRound = 1;
        this.maxRounds = maxRounds;
        this.isGameOver = false;
        this.isGameInProgress = true; // Set game in progress
        this.scores = {};
        this.roundWinners = [];
        
        // Reset counters via WebSocket
        this.resetAllCounters();
        
        // Set timer duration (2 minutes per round)
        this.timerManager.setDuration(120);
        
        // Start timer for first round
        this.timerManager.reset();
        this.timerManager.start();
        
        // Update round info
        this.updateRoundInfo();
        
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
        if (!this.isGameInProgress) return;

        // Save scores for this round
        this.saveRoundScores();
        
        // Determine round winner
        const roundWinner = this.determineRoundWinner(this.currentRound);
        this.roundWinners.push(roundWinner);
        
        // Announce round result
        this.announceGameState(`Round ${this.currentRound} complete! Winner: ${roundWinner}`);
        
        // Check if we have an overall winner
        const overallWinner = this.checkForOverallWinner();
        
        if (overallWinner || this.currentRound >= this.maxRounds) {
            // We have a winner or reached max rounds, show round summary then end game
            this.displayRoundSummary(true, overallWinner);
        } else {
            // No winner yet, show round summary and continue
            this.displayRoundSummary(false);
        }
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
        
        // Announce new round
        this.announceGameState(`Round ${this.currentRound} started!`);
    }
    
    // End the game
    endGame(overallWinner = null) {
        // Prevent multiple end game calls
        if (!this.isGameInProgress) return;

        this.isGameOver = true;
        this.isGameInProgress = false; // Mark game as not in progress
        this.timerManager.pause();
        
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
        
        // Announce winner
        this.announceGameState(`Game Over! Winner: ${overallWinner}`);
        
        // Display final scores
        console.log("Final match results:", this.roundWinners);
        
        // Display final scores table
        this.displayFinalScores(overallWinner);
    }

    // [All other methods remain the same as in the previous implementation]

    // In the displayFinalScores method, modify the New Game button:
    displayFinalScores(overallWinner) {
        // ... existing code ...

        const newGameBtn = document.createElement('button');
        newGameBtn.className = 'continue-button';
        newGameBtn.textContent = 'Start New Game';
        newGameBtn.onclick = () => {
            modal.style.display = 'none';
            
            // Only start a new game if not already in progress
            if (!this.isGameInProgress) {
                const rounds = parseInt(prompt('How many rounds (for best of N)?', '3')) || 3;
                this.startGame(rounds);
            }
        };

        // ... rest of the existing code ...
    }
}

// Make GameStateManager available globally
window.GameStateManager = GameStateManager;