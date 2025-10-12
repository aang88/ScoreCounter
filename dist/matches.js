document.addEventListener('DOMContentLoaded', async function() {
    try {
        const firebaseManager = new FirebaseManager();
        await firebaseManager.initialize();
        
        console.log('Firebase initialized, getting matches...');
        const matches = await firebaseManager.getAllMatches();
        console.log('Retrieved matches:', matches.length);
        
        const matchList = document.getElementById('matchList');
        if (!matchList) {
            console.error('matchList element not found!');
            return;
        }
        
        // Process matches one by one
        for (const match of matches) {
            console.log('Creating card for match:', match.id);
            const matchCard = new MatchCard(match.id, firebaseManager);
            const cardElement = await matchCard.createCard();
            
            if (cardElement) {
                matchList.appendChild(cardElement);
            } else {
                console.error('Failed to create card for match:', match.id);
            }
        }
        
    } catch (error) {
        console.error('Error loading matches:', error);
    }


});