function generateSingleElim(initialPlayers) {
    const realPlayers = initialPlayers.filter(p => p !== 'BYE');
    const arr = ensureEvenWithBye(shuffle(realPlayers));
    const shuffleddecks = shuffle(decks);
    const matches = [];
    // assign decks ensuring no duplicate in same round by popping decks
    const decksPool = shuffle(decks);
    for (let i = 0; i < arr.length; i += 2) {
        const p1 = arr[i];
        const p2 = arr[i + 1] || 'BYE';
        const c1 = (p1 !== 'BYE' && decksPool.length) ? decksPool.pop() : 'No deck';
        const c2 = (p2 !== 'BYE' && decksPool.length) ? decksPool.pop() : 'No deck';
        matches.push({
            p1,
            p2,
            c1,
            c2,
            winner: null
        });
    }
    return [matches];
}

function generateRoundRobin(playersList) {
    const temp = playersList.slice();
    if (temp.length % 2 === 1) temp.push("BYE");

    const roundsLocal = [];
    const n = temp.length;

    // Initialize global deck usage counter
    deckUseCount = {};
    decks.forEach(d => deckUseCount[d] = 0);

    // Deck assignment function using GLOBAL balancing
    function getDeckForPlayer(player) {
        if (player === "BYE") return "No deck";

        // Convert deckUseCount into sortable list
        const entries = Object.entries(deckUseCount);

        // Find MIN usage count among all decks
        const minUse = Math.min(...entries.map(([_, c]) => c));

        // Build list of all decks tied for minimum usage
        const leastUsedDecks = entries
            .filter(([_, c]) => c === minUse)
            .map(([d, _]) => d);

        // Randomly choose from them
        const chosen = leastUsedDecks[Math.floor(Math.random() * leastUsedDecks.length)];

        // Update global deck usage count
        deckUseCount[chosen]++;

        return chosen;
    }

    // Generate full Round Robin pairings
    for (let r = 0; r < n - 1; r++) {
        const roundMatches = [];

        for (let i = 0; i < n / 2; i++) {
            const p1 = temp[i];
            const p2 = temp[n - 1 - i];

            const c1 = getDeckForPlayer(p1);
            const c2 = getDeckForPlayer(p2);

            roundMatches.push({
                p1,
                p2,
                c1,
                c2,
                winner: null
            });
        }

        roundsLocal.push(roundMatches);

        // Standard Round Robin rotation (keep index 0 fixed)
        temp.splice(1, 0, temp.pop());
    }

    return roundsLocal;
}


// Match generation ensuring deck uniqueness per round
function assigndecksForRound(matchPlayers) {
    const available = shuffle(decks);
    const assignments = {};
    let idx = 0;
    matchPlayers.forEach(p => {
        if (p === 'BYE') {
            assignments[p] = 'No deck';
            return;
        }
        assignments[p] = available[idx % available.length] || 'No deck';
        idx++;
    });
    return assignments;
}

function pickWinner(roundIndex, matchIndex, winner, deck) {
    const match = rounds[roundIndex][matchIndex];

    // Prevent selecting a winner again unless undone
    if (match.winner) return;

    // Prevent picking a winner for BYE matches
    if (match.p1 === 'BYE' || match.p2 === 'BYE') return;

    // Set winner
    match.winner = winner;

    // Update results
    results.players[winner] = (results.players[winner] || 0) + 1;
    if (deck && deck !== 'No deck') {
        results.decks[deck] = (results.decks[deck] || 0) + 1;
    }

    // Handle advancement for single elimination
    if (tournamentType !== 'roundrobin') {
        const currentRound = rounds[roundIndex];

        const allDecided = currentRound.every(m =>
            m.winner || m.p1 === 'BYE' || m.p2 === 'BYE'
        );

        if (allDecided) {
            const nextPlayers = currentRound
                .map(m => m.winner)
                .filter(p => p && p !== 'BYE');

            if (nextPlayers.length > 1) {
                const nextRound = generateSingleElim(nextPlayers)[0];
                rounds.push(nextRound);
            }
        }
    }

    updateLeaderboards();
    renderBracket();
    renderPlayerView();
    saveTournamentState();
    renderDeckMatrix();

}

function undoWinner(roundIndex, matchIndex) {
    const match = rounds[roundIndex][matchIndex];
    if (!match.winner) return;

    const previousWinner = match.winner;

    // Remove the player's win
    if (results.players[previousWinner]) {
        results.players[previousWinner]--;
        if (results.players[previousWinner] <= 0) {
            delete results.players[previousWinner];
        }
    }

    // Remove the deck's win
    const usedDeck =
        previousWinner === match.p1 ? match.c1 :
        previousWinner === match.p2 ? match.c2 : null;

    if (usedDeck && usedDeck !== 'No deck') {
        if (results.decks[usedDeck]) {
            results.decks[usedDeck]--;
            if (results.decks[usedDeck] <= 0) {
                delete results.decks[usedDeck];
            }
        }
    }

    // Clear winner
    match.winner = null;

    updateLeaderboards();
    renderBracket();
    renderPlayerView();
    saveTournamentState();
    renderDeckMatrix();
}