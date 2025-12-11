  // State
  let players = [];
  let decks = [];
  let tournamentType = 'single';
  let rounds = []; // array of rounds; each round is array of matches {p1,p2,c1,c2,winner}
let results = {
    players: {},
    decks: {},
    playerLosses: {},
    deckLosses: {}
};
  let tiebreakers = {
      first: null,
      second: null,
      third: null
  }; // each is {players,decks,rounds}
  let deckUseCount = {};
  decks.forEach(d => deckUseCount[d] = 0);


  // Elements
  const playerList = document.getElementById('playerList');
  const deckList = document.getElementById('deckList');
  const playerInput = document.getElementById('playerInput');
  const deckInput = document.getElementById('deckInput');
  const addPlayerBtn = document.getElementById('addPlayerBtn');
  const adddeckBtn = document.getElementById('adddeckBtn');
  const generateBtn = document.getElementById('generateBtn');
  const resetBtn = document.getElementById('resetBtn');
  const bracketArea = document.getElementById('bracketArea');
  const playerViewSelect = document.getElementById('playerViewSelect');
  const playerOpponents = document.getElementById('playerOpponents');
  const playerLeaderboard = document.getElementById('playerLeaderboard');
  const deckLeaderboard = document.getElementById('deckLeaderboard');
  const generateTiebreakersBtn = document.getElementById('generateTiebreakersBtn');
  const tiebreakerArea = document.getElementById('tiebreakerArea');
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');
  const tournamentTypeSelect = document.getElementById('tournamentType');


  // Helpers
  const uniquePush = (arr, v) => {
      if (!arr.includes(v)) arr.push(v);
  };
  const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);
  const ensureEvenWithBye = (arr) => {
      const copy = arr.slice();
      if (copy.length % 2 === 1) copy.push('BYE');
      return copy;
  };
const DEFAULT_TOURNAMENT = {
  "players": [],
  "decks": [],
  "tournamentType": "roundrobin",
  "rounds": [],
  "results": {
    "players":  {},
    "decks": {},
    "playerLosses":  {},
    "deckLosses": {}
  },
  "tiebreakers": {
    "first": null,
    "second": null,
    "third": null
  }
};

function resetState() {
    rounds = [];
    results = {
        players: {},
        decks:  {},
        playerLosses: {},
        deckLosses:  {}
    };
    tiebreakers = {
        first:  null,
        second: null,
        third: null
    };
    bracketArea.innerHTML = '';
    tiebreakerArea.innerHTML = '';
    updateLeaderboards();
    renderPlayerView();
}

  function addParticipantToState() {
      const raw = (playerInput.value || '').trim();
      if (!raw) return;

      // Split on newlines → trim → remove empty → remove duplicates
      const names = raw
          .split(/\r?\n/)
          .map(n => n.trim())
          .filter(n => n && !players.includes(n));

      // Add them all
      players.push(...names);

      // Clear input and refresh
      playerInput.value = '';
      refreshLists();
  }

  function adddeckToState() {
      const raw = (deckInput.value || '').trim();
      if (!raw) return;

      const names = raw
          .split(/\r?\n/)
          .map(n => n.trim())
          .filter(n => n && !decks.includes(n));

      decks.push(...names);

      deckInput.value = '';
      refreshLists();
  }