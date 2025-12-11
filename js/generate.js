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
    const N = playersList.length;

    // Must have equal number of decks
    if (decks.length !== N) {
        alert("You must have exactly as many decks as players for no-repeat mode.");
        return [];
    }

    // FIXED unchanging player order
    const fixedPlayers = playersList.slice();

    // ROTATING list for pairings only
    const rotating = playersList.slice();
    if (rotating.length % 2 === 1) rotating.push("BYE");

    // Randomize deck starting order ONCE
    const deckOrder = shuffle([...decks]);

    const roundsLocal = [];

    for (let r = 0; r < N - 1; r++) {
        const roundMatches = [];

        for (let i = 0; i < N / 2; i++) {
            const p1 = rotating[i];
            const p2 = rotating[N - 1 - i];

            const idx1 = fixedPlayers.indexOf(p1);
            const idx2 = fixedPlayers.indexOf(p2);

            const d1 = p1 === "BYE" ? "No deck" : deckOrder[(idx1 + r) % N];
            const d2 = p2 === "BYE" ? "No deck" : deckOrder[(idx2 + r) % N];

            roundMatches.push({
                p1,
                p2,
                c1: d1,
                c2: d2,
                winner: null
            });
        }

        roundsLocal.push(roundMatches);

        // Standard Round-Robin rotation for PAIRINGS ONLY
        rotating.splice(1, 0, rotating.pop());
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

    // Update winner results
    results.players[winner] = (results.players[winner] || 0) + 1;
    if (deck && deck !== 'No deck') {
        results.decks[deck] = (results.decks[deck] || 0) + 1;
    }

    // Track loser (THIS IS THE NEW PART!)
    const loser = (winner === match.p1) ? match.p2 : match.p1;
    const loserDeck = (winner === match.p1) ? match.c2 : match.c1;

    results.playerLosses[loser] = (results.playerLosses[loser] || 0) + 1;
    if (loserDeck && loserDeck !== 'No deck') {
        results.deckLosses[loserDeck] = (results.deckLosses[loserDeck] || 0) + 1;
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
    const previousLoser = (previousWinner === match.p1) ? match.p2 : match.p1;
    const loserDeck = (previousWinner === match.p1) ? match.c2 : match.c1;

    // Remove winner's win
    if (results.players[previousWinner]) {
        results.players[previousWinner]--;
        if (results.players[previousWinner] <= 0) {
            delete results.players[previousWinner];
        }
    }

    // Remove loser's loss
    if (results.playerLosses[previousLoser]) {
        results.playerLosses[previousLoser]--;
        if (results.playerLosses[previousLoser] <= 0) {
            delete results.playerLosses[previousLoser];
        }
    }

    // Remove winner deck's win
    const usedDeck = previousWinner === match.p1 ? match.c1 : match.c2;
    if (usedDeck && usedDeck !== 'No deck') {
        if (results.decks[usedDeck]) {
            results.decks[usedDeck]--;
            if (results.decks[usedDeck] <= 0) {
                delete results.decks[usedDeck];
            }
        }
    }

    // Remove loser deck's loss
    if (loserDeck && loserDeck !== 'No deck') {
        if (results.deckLosses[loserDeck]) {
            results.deckLosses[loserDeck]--;
            if (results.deckLosses[loserDeck] <= 0) {
                delete results.deckLosses[loserDeck];
            }
        }
    }

    match.winner = null;
    updateLeaderboards();
    renderBracket();
    renderPlayerView();
    saveTournamentState();
    renderDeckMatrix();
}