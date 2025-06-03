class MatchCard {
    constructor(matchID=null,firebaseManager = null) {
        this.matchID = matchID;
        this.firebaseManager = firebaseManager;
        this.element = null;
        this.matchData = null;
    }

    async getMatchData() {
        if (!this.matchID) {
            console.error("Match ID is not set");
            return null;
        }
        if (!this.firebaseManager) {
            console.error("Firebase manager is not initialized");
            return null;
        }
        try {
            this.matchData = await this.firebaseManager.getMatchStats(this.matchID);
            return this.matchData;
        } catch (error) {
            console.error("Error getting match data:", error);
            return null;
        }
    }

    getPlayerName(playerNumber){
        if (playerNumber == "Player1"){
            return this.matchData.chung;
        }
        if (playerNumber == "Player2"){
            return this.matchData.hong;
        }
    }

    async createCard() {
        if (!this.matchID) {
            console.error("Match ID is not set");
            return null;
        }
        if (!this.firebaseManager) {
            console.error("Firebase manager is not initialized");
            return null;
        }
        await this.getMatchData();
        
        if (!this.matchData) {
            console.error("Match data is not available");
            return null;
        }

        // Create main card container
        const cardContainer = document.createElement('div');
        cardContainer.className = 'match-card-container';

        // Create the clickable card with correct field names
        this.element = document.createElement('div');
        this.element.className = 'match-card';
        this.element.style.cursor = 'pointer';
        this.element.innerHTML = `
            <h3>Match ID: ${this.matchID}</h3>
            <p>Date: ${this.formatTimestamp(this.matchData.timestamp)}</p>
            <p>Players: ${this.matchData.chung} vs ${this.matchData.hong}</p>
            <p>Winner: ${this.getWinnerName(this.matchData.game_winner)}</p>
            <p>Score: ${this.matchData.final_score.Chung} - ${this.matchData.final_score.Hong}</p>
            <div class="expand-arrow">▼</div>
        `;

        // Create the toggle-able replay section
        const replaySection = document.createElement('div');
        replaySection.className = 'replay-section';
        replaySection.style.display = 'none';
        replaySection.innerHTML = `
            <div class="replay-content">
                <h4>Match Replay</h4>
                <div id="replay-data-${this.matchID}">Click to load replay...</div>
            </div>
        `;

        // Add click event to toggle replay section
        this.element.addEventListener('click', () => {
            this.toggleReplay(replaySection);
        });

        // Append both to container
        cardContainer.appendChild(this.element);
        cardContainer.appendChild(replaySection);

        return cardContainer;
    }

    // Add helper method to format Firebase timestamp
    formatTimestamp(timestamp) {
        if (!timestamp) return 'Unknown date';
        
        // Handle Firebase timestamp
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString();
        }
        
        // Handle regular date string
        try {
            return new Date(timestamp).toLocaleDateString();
        } catch (error) {
            return 'Invalid date';
        }
    }

    // Update getPlayerName to handle the actual winner field
    getWinnerName(winner) {
        if (winner === "Chung") {
            return this.matchData.chung;
        }
        if (winner === "Hong") {
            return this.matchData.hong;
        }
        return winner; // fallback
    }

    // Add toggle method
    toggleReplay(replaySection) {
        const arrow = this.element.querySelector('.expand-arrow');
        
        if (replaySection.style.display === 'none') {
            // Show replay section
            replaySection.style.display = 'block';
            arrow.textContent = '▲';
            
            // Load replay data if not already loaded
            this.loadReplayData(replaySection);
        } else {
            // Hide replay section
            replaySection.style.display = 'none';
            arrow.textContent = '▼';
        }
    }

    // Add replay data loading
    async loadReplayData(replaySection) {
        const replayContainer = replaySection.querySelector(`#replay-data-${this.matchID}`);
        
        try {
            if (this.matchData.replay_data) {
                // Parse the JSON string from Firebase
                const replayEvents = JSON.parse(this.matchData.replay_data);
                replayContainer.innerHTML = this.formatReplayData(replayEvents);
            } else {
                replayContainer.innerHTML = '<p>No replay data available</p>';
            }
        } catch (error) {
            console.error('Error loading replay data:', error);
            replayContainer.innerHTML = '<p>Error loading replay data</p>';
        }
    }

    // Format the replay events for display
    formatReplayData(replayEvents) {
        if (!replayEvents || replayEvents.length === 0) {
            return '<p>No events recorded</p>';
        }
        
        return replayEvents.map(event => `
            <div class="replay-event" style="
                display: flex; 
                justify-content: space-between; 
                padding: 5px 0; 
                border-bottom: 1px solid #eee;
            ">
                <span class="round">Round ${event.round}</span>
                <span class="player">${this.getPlayerName(event.player)}</span>
                <span class="technique">${event.technique}</span>
                <span class="time">${new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
        `).join('');
    }


}