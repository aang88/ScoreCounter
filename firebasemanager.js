class FirebaseManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }
    
    async initialize() {
        try {
            // Wait for Firebase to be available
            while (!window.firebaseDb) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            this.db = window.firebaseDb;
            this.isInitialized = true;
            console.log("✅ Firebase client initialized");
            return true;
        } catch (error) {
            console.error("❌ Firebase initialization failed:", error);
            return false;
        }
    }
    
    async getMatchHistory(limit = 10) {
        if (!this.isInitialized) {
            console.warn("Firebase not initialized");
            return [];
        }
        
        try {
            const { collection, query, orderBy, limit: limitFunc, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            const q = query(
                collection(this.db, 'match_replays'),
                orderBy('timestamp', 'desc'),
                limitFunc(limit)
            );
            
            const querySnapshot = await getDocs(q);
            const matches = [];
            
            querySnapshot.forEach((doc) => {
                matches.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📊 Retrieved ${matches.length} matches from Firebase`);
            return matches;
            
        } catch (error) {
            console.error("Error getting match history:", error);
            return [];
        }
    }
    
    async getRoundHistory(limit = 20) {
        if (!this.isInitialized) {
            console.warn("Firebase not initialized");
            return [];
        }
        
        try {
            const { collection, query, orderBy, limit: limitFunc, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            const q = query(
                collection(this.db, 'round_results'),
                orderBy('timestamp', 'desc'),
                limitFunc(limit)
            );
            
            const querySnapshot = await getDocs(q);
            const rounds = [];
            
            querySnapshot.forEach((doc) => {
                rounds.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📊 Retrieved ${rounds.length} rounds from Firebase`);
            return rounds;
            
        } catch (error) {
            console.error("Error getting round history:", error);
            return [];
        }
    }
    
    async getScoringEvents(limit = 50) {
        if (!this.isInitialized) {
            console.warn("Firebase not initialized");
            return [];
        }
        
        try {
            const { collection, query, orderBy, limit: limitFunc, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            const q = query(
                collection(this.db, 'scoring_events'),
                orderBy('timestamp', 'desc'),
                limitFunc(limit)
            );
            
            const querySnapshot = await getDocs(q);
            const events = [];
            
            querySnapshot.forEach((doc) => {
                events.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📊 Retrieved ${events.length} scoring events from Firebase`);
            return events;
            
        } catch (error) {
            console.error("Error getting scoring events:", error);
            return [];
        }
    }
    
    // Real-time listener for live updates
    async listenToMatches(callback) {
        if (!this.isInitialized) {
            console.warn("Firebase not initialized");
            return null;
        }
        
        try {
            const { collection, query, orderBy, limit, onSnapshot } = 
                await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            const q = query(
                collection(this.db, 'match_replays'),
                orderBy('timestamp', 'desc'),
                limit(10)
            );
            
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const matches = [];
                querySnapshot.forEach((doc) => {
                    matches.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(matches);
            });
            
            return unsubscribe; // Return function to stop listening
            
        } catch (error) {
            console.error("Error setting up real-time listener:", error);
            return null;
        }
    }

    async getAllPlayerNames() {
        if (!this.isInitialized) {
            console.warn("Firebase not initialized");
            return [];
        }
        
        try {
            const { collection, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            return getDocs(collection(this.db, 'players'))
                .then(snapshot => {
                    const playerNames = [];
                    snapshot.forEach(doc => {
                        playerNames.push(doc.data().name);
                    });
                    return playerNames;
                })
                .catch(error => {
                    console.error("Error getting player names:", error);
                    return [];
                });
        } catch (error) {
            console.error("Error in getAllPlayerNames:", error);
            return [];
        }
    }

    async addPlayer(playerName) {
        if (!this.isInitialized) {
            console.warn("Firebase not initialized");
            return false;
        }
        
        try {
            const { collection, addDoc } = 
                await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            await addDoc(collection(this.db, 'players'), {
                name: playerName,
                height: 0,
                weight: 0,
                wins: 0,
                losses: 0,
                matches: []
            });
            console.log(`✅ Player ${playerName} added successfully`);
            return true;
        } catch (error) {
            console.error("Error adding player:", error);
            return false;
        }
    }

    async getPlayerStats(playerName) {
        if (!this.isInitialized) {
            console.warn("Firebase not initialized");
            return null;
        }
        
        try {
            const { collection, query, where, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            const q = query(
                collection(this.db, 'players'),
                where('name', '==', playerName)
            );
            
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                console.warn(`No player found with name: ${playerName}`);
                return null;
            }
            
            const playerData = querySnapshot.docs[0].data();
            console.log(`📊 Retrieved stats for player ${playerName}`);
            return playerData;
            
        } catch (error) {
            console.error("Error getting player stats:", error);
            return null;
        }
    }

    async getMatchStats(matchId) {
        if (!this.isInitialized) {
            console.warn("Firebase not initialized");
            return null;
        }
        try {
            const { doc, getDoc } = 
                await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            const matchDoc = doc(this.db, 'match_replays', matchId);
            const matchSnapshot = await getDoc(matchDoc);
            
            if (!matchSnapshot.exists()) {
                console.warn(`No match found with ID: ${matchId}`);
                return null;
            }
            
            const matchData = matchSnapshot.data();
            console.log(`📊 Retrieved stats for match ${matchId}`);
            return matchData;
            
        } catch (error) {
            console.error("Error getting match stats:", error);
            return null;
        }
    }
    async getAllMatches() {
        if (!this.isInitialized) {
            console.warn("Firebase not initialized");
            return [];
        }
        
        try {
            const { collection, getDocs,orderBy,query } = 
                await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            const q = query(
                collection(this.db, 'match_replays'),
                orderBy('timestamp', 'desc')
            );
            const matchesSnapshot = await getDocs(q);
            const matches = [];
            
            matchesSnapshot.forEach((doc) => {
                matches.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📊 Retrieved ${matches.length} matches from Firebase`);
            return matches;
            
        } catch (error) {
            console.error("Error getting all matches:", error);
            return [];
        }
    }

}