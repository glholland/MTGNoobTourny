// Helper functions
export const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);

export const ensureEvenWithBye = (arr) => {
  const copy = arr.slice();
  if (copy.length % 2 === 1) copy.push('BYE');
  return copy;
};

// Generate single elimination bracket
export const generateSingleElim = (initialPlayers, decks) => {
  const realPlayers = initialPlayers.filter(p => p !== 'BYE');
  const arr = ensureEvenWithBye(shuffle(realPlayers));
  const matches = [];
  const decksPool = shuffle(decks);
  
  for (let i = 0; i < arr.length; i += 2) {
    const p1 = arr[i];
    const p2 = arr[i + 1] || 'BYE';
    const c1 = (p1 !== 'BYE' && decksPool.length) ? decksPool.pop() : 'No deck';
    const c2 = (p2 !== 'BYE' && decksPool.length) ? decksPool.pop() : 'No deck';
    matches.push({ p1, p2, c1, c2, winner: null });
  }
  
  return [matches];
};

// Generate round robin bracket
export const generateRoundRobin = (playersList, decks, deckHistory, setDeckHistory) => {
  const temp = playersList.slice();
  if (temp.length % 2 === 1) temp.push('BYE');
  const roundsLocal = [];
  const n = temp.length;
  
  // Initialize history tracking
  const newDeckHistory = { ...deckHistory };
  temp.forEach(p => {
    if (p !== 'BYE' && !newDeckHistory[p]) newDeckHistory[p] = new Set();
  });
  
  for (let r = 0; r < n - 1; r++) {
    const roundMatches = [];
    const availableDecks = [...decks];
    
    // Assign decks to players in this round
    const getDeckForPlayer = (player) => {
      if (player === 'BYE') return 'No deck';
      
      // Filter out decks this player has already used
      const unusedDecks = availableDecks.filter(d => !newDeckHistory[player].has(d));
      let chosen = null;
      
      if (unusedDecks.length > 0) {
        // Prefer unused deck
        const shuffled = shuffle(unusedDecks);
        chosen = shuffled.pop();
      } else {
        // All decks used — repeats now allowed
        const shuffled = shuffle(availableDecks);
        chosen = shuffled.pop();
      }
      
      // Remove from available pool
      const idx = availableDecks.indexOf(chosen);
      if (idx !== -1) availableDecks.splice(idx, 1);
      
      // Remember assignment
      newDeckHistory[player].add(chosen);
      return chosen;
    };
    
    // Build matches
    for (let i = 0; i < n / 2; i++) {
      const p1 = temp[i];
      const p2 = temp[n - 1 - i];
      const c1 = getDeckForPlayer(p1);
      const c2 = getDeckForPlayer(p2);
      roundMatches.push({ p1, p2, c1, c2, winner: null });
    }
    
    roundsLocal.push(roundMatches);
    
    // Rotate array (Round Robin algorithm)
    temp.splice(1, 0, temp.pop());
  }
  
  setDeckHistory(newDeckHistory);
  return roundsLocal;
};

// Default tournament data
export const DEFAULT_TOURNAMENT = {
  "players": [
    "Adlai",
    "Brett",
    "Aaron Saunders",
    "Kate Kemichick",
    "Kelsey Lumsden",
    "Garrett",
    "Maddy Goodman",
    "Patrick Kenny",
    "Rick Pease",
    "Sophia Abraham",
    "Alex Zettler",
    "Patricia Huang"
  ],
  "decks": [
    "Jason Kemichick",
    "Sean Kirschke",
    "Trav",
    "Jacob",
    "Jacob F1",
    "Jacob F2",
    "Jacob F3",
    "Daryl",
    "Deck 1",
    "Deck 2",
    "Deck 3",
    "Deck 4"
  ],
  "tournamentType": "roundrobin",
  "rounds": [],
  "results": {
    "players": {},
    "decks": {}
  },
  "tiebreakers": {
    "first": null,
    "second": null,
    "third": null
  }
};
