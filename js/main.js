/*************************************************
 * MAIN.JS — CORE INITIALIZATION & GLOBAL SAVE/LOAD
 *************************************************/

/* -----------------------------------------------
   AUTO-SAVE SYSTEM
-------------------------------------------------*/

// Save everything into localStorage
function saveTournamentState() {
    const state = {
        players,
        decks,
        tournamentType,
        rounds,
        results,
        tiebreakers
    };
    localStorage.setItem("savedTournamentState", JSON.stringify(state));
}

// Load saved state (returns true if successful)
function loadSavedTournamentState() {
    const raw = localStorage.getItem("savedTournamentState");
    if (!raw) return false;

    try {
        const obj = JSON.parse(raw);
        console.log("Loading saved tournament:", obj);
        importTournamentObject(obj);
        return true;
    } catch (e) {
        console.error("Could not load saved state:", e);
        return false;
    }
}


/* -----------------------------------------------
   INITIALIZATION ON PAGE LOAD
-------------------------------------------------*/

/* -----------------------------------------------
   INITIALIZATION ON PAGE LOAD
-------------------------------------------------*/

window.addEventListener("DOMContentLoaded", async () => {
    // Try to load saved tournament first
    if (!loadSavedTournamentState()) {
        // Otherwise load default from external file
        console.log("Loading DEFAULT tournament from file...");
        try {
            const response = await fetch('tournament_data.json');
            if (! response.ok) {
                throw new Error(`HTTP error! status: ${response. status}`);
            }
            const defaultTournament = await response.json();
            console.log("Loaded default tournament:", defaultTournament);
            importTournamentObject(defaultTournament);
        } catch (error) {
            console. error("Could not load default tournament file:", error);
            console.log("Using fallback empty tournament");
            // Fallback to empty tournament from DEFAULT_TOURNAMENT constant
            importTournamentObject(DEFAULT_TOURNAMENT);
        }
    }

    refreshLists();
    renderBracket();
    updateLeaderboards();
    renderTiebreakers();
});


/* -----------------------------------------------
   EVENT LISTENERS (UNCHANGED)
-------------------------------------------------*/

addPlayerBtn.addEventListener('click', addParticipantToState);
adddeckBtn.addEventListener('click', adddeckToState);

playerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addParticipantToState();
});

deckInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') adddeckToState();
});

generateBtn.addEventListener('click', () => {
    tournamentType = tournamentTypeSelect.value;

    if (tournamentType === 'roundrobin') {
        rounds = generateRoundRobin(players.slice());
    } else {
        rounds = generateSingleElim(players.slice());
    }

    results = {
    players: {},
    decks: {},
    playerLosses: {},
    deckLosses: {}
};
    tiebreakers = {
        first: null,
        second: null,
        third: null
    };

    renderBracket();
    updateLeaderboards();
    renderTiebreakers();
    saveTournamentState(); // Save after generation
});

resetBtn.addEventListener('click', () => {
    players = [];
    decks = [];
    rounds = [];
    results = {
    players: {},
    decks: {},
    playerLosses: {},
    deckLosses: {}
};
    tiebreakers = {
        first: null,
        second: null,
        third: null
    };

    refreshLists();
    renderBracket();
    updateLeaderboards();
    renderTiebreakers();

    saveTournamentState(); // Save reset
});

playerViewSelect.addEventListener('change', renderPlayerView);

generateTiebreakersBtn.addEventListener('click', () => {
    generateTiebreakers();
    renderTiebreakers();
    saveTournamentState();
});

exportBtn.addEventListener('click', exportState);

importFile.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        importState(e.target.files[0]);
    }
});


/* -----------------------------------------------
   EXPOSE STATE FOR DEBUGGING
-------------------------------------------------*/

window._tournament = {
    getState: () => ({
        players,
        decks,
        tournamentType,
        rounds,
        results,
        tiebreakers
    })
};