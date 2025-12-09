  // State
  let players = [];
  let decks = [];
  let tournamentType = 'single';
  let rounds = []; // array of rounds; each round is array of matches {p1,p2,c1,c2,winner}
  let results = {
      players: {},
      decks: {}
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
  "players": [
    "Adlai",
    "Marina",
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
    "Tyler Stefancin",
    "Brett",
    "Deck 3",
    "Deck 4"
  ],
  "tournamentType": "roundrobin",
  "rounds": [
    [
      {
        "p1": "Adlai",
        "p2": "Patricia Huang",
        "c1": "Jacob",
        "c2": "Deck 4",
        "winner": null
      },
      {
        "p1": "Marina",
        "p2": "Alex Zettler",
        "c1": "Jason Kemichick",
        "c2": "Tyler Stefancin",
        "winner": null
      },
      {
        "p1": "Aaron Saunders",
        "p2": "Sophia Abraham",
        "c1": "Jacob F2",
        "c2": "Jacob F3",
        "winner": null
      },
      {
        "p1": "Kate Kemichick",
        "p2": "Rick Pease",
        "c1": "Brett",
        "c2": "Deck 3",
        "winner": null
      },
      {
        "p1": "Kelsey Lumsden",
        "p2": "Patrick Kenny",
        "c1": "Sean Kirschke",
        "c2": "Daryl",
        "winner": null
      },
      {
        "p1": "Garrett",
        "p2": "Maddy Goodman",
        "c1": "Trav",
        "c2": "Jacob F1",
        "winner": null
      }
    ],
    [
      {
        "p1": "Adlai",
        "p2": "Alex Zettler",
        "c1": "Jason Kemichick",
        "c2": "Deck 4",
        "winner": null
      },
      {
        "p1": "Patricia Huang",
        "p2": "Sophia Abraham",
        "c1": "Jacob",
        "c2": "Tyler Stefancin",
        "winner": null
      },
      {
        "p1": "Marina",
        "p2": "Rick Pease",
        "c1": "Jacob F2",
        "c2": "Jacob F3",
        "winner": null
      },
      {
        "p1": "Aaron Saunders",
        "p2": "Patrick Kenny",
        "c1": "Brett",
        "c2": "Deck 3",
        "winner": null
      },
      {
        "p1": "Kate Kemichick",
        "p2": "Maddy Goodman",
        "c1": "Sean Kirschke",
        "c2": "Daryl",
        "winner": null
      },
      {
        "p1": "Kelsey Lumsden",
        "p2": "Garrett",
        "c1": "Trav",
        "c2": "Jacob F1",
        "winner": null
      }
    ],
    [
      {
        "p1": "Adlai",
        "p2": "Sophia Abraham",
        "c1": "Jacob F2",
        "c2": "Deck 4",
        "winner": null
      },
      {
        "p1": "Alex Zettler",
        "p2": "Rick Pease",
        "c1": "Jacob",
        "c2": "Tyler Stefancin",
        "winner": null
      },
      {
        "p1": "Patricia Huang",
        "p2": "Patrick Kenny",
        "c1": "Jason Kemichick",
        "c2": "Jacob F3",
        "winner": null
      },
      {
        "p1": "Marina",
        "p2": "Maddy Goodman",
        "c1": "Brett",
        "c2": "Deck 3",
        "winner": null
      },
      {
        "p1": "Aaron Saunders",
        "p2": "Garrett",
        "c1": "Sean Kirschke",
        "c2": "Daryl",
        "winner": null
      },
      {
        "p1": "Kate Kemichick",
        "p2": "Kelsey Lumsden",
        "c1": "Trav",
        "c2": "Jacob F1",
        "winner": null
      }
    ],
    [
      {
        "p1": "Adlai",
        "p2": "Rick Pease",
        "c1": "Brett",
        "c2": "Deck 4",
        "winner": null
      },
      {
        "p1": "Sophia Abraham",
        "p2": "Patrick Kenny",
        "c1": "Jacob",
        "c2": "Tyler Stefancin",
        "winner": null
      },
      {
        "p1": "Alex Zettler",
        "p2": "Maddy Goodman",
        "c1": "Jason Kemichick",
        "c2": "Jacob F3",
        "winner": null
      },
      {
        "p1": "Patricia Huang",
        "p2": "Garrett",
        "c1": "Jacob F2",
        "c2": "Deck 3",
        "winner": null
      },
      {
        "p1": "Marina",
        "p2": "Kelsey Lumsden",
        "c1": "Sean Kirschke",
        "c2": "Daryl",
        "winner": null
      },
      {
        "p1": "Aaron Saunders",
        "p2": "Kate Kemichick",
        "c1": "Trav",
        "c2": "Jacob F1",
        "winner": null
      }
    ],
    [
      {
        "p1": "Adlai",
        "p2": "Patrick Kenny",
        "c1": "Sean Kirschke",
        "c2": "Deck 4",
        "winner": null
      },
      {
        "p1": "Rick Pease",
        "p2": "Maddy Goodman",
        "c1": "Jacob",
        "c2": "Tyler Stefancin",
        "winner": null
      },
      {
        "p1": "Sophia Abraham",
        "p2": "Garrett",
        "c1": "Jason Kemichick",
        "c2": "Jacob F3",
        "winner": null
      },
      {
        "p1": "Alex Zettler",
        "p2": "Kelsey Lumsden",
        "c1": "Jacob F2",
        "c2": "Deck 3",
        "winner": null
      },
      {
        "p1": "Patricia Huang",
        "p2": "Kate Kemichick",
        "c1": "Brett",
        "c2": "Daryl",
        "winner": null
      },
      {
        "p1": "Marina",
        "p2": "Aaron Saunders",
        "c1": "Trav",
        "c2": "Jacob F1",
        "winner": null
      }
    ],
    [
      {
        "p1": "Adlai",
        "p2": "Maddy Goodman",
        "c1": "Trav",
        "c2": "Deck 4",
        "winner": null
      },
      {
        "p1": "Patrick Kenny",
        "p2": "Garrett",
        "c1": "Jacob",
        "c2": "Tyler Stefancin",
        "winner": null
      },
      {
        "p1": "Rick Pease",
        "p2": "Kelsey Lumsden",
        "c1": "Jason Kemichick",
        "c2": "Jacob F3",
        "winner": null
      },
      {
        "p1": "Sophia Abraham",
        "p2": "Kate Kemichick",
        "c1": "Jacob F2",
        "c2": "Deck 3",
        "winner": null
      },
      {
        "p1": "Alex Zettler",
        "p2": "Aaron Saunders",
        "c1": "Brett",
        "c2": "Daryl",
        "winner": null
      },
      {
        "p1": "Patricia Huang",
        "p2": "Marina",
        "c1": "Sean Kirschke",
        "c2": "Jacob F1",
        "winner": null
      }
    ],
    [
      {
        "p1": "Adlai",
        "p2": "Garrett",
        "c1": "Jacob F1",
        "c2": "Deck 4",
        "winner": null
      },
      {
        "p1": "Maddy Goodman",
        "p2": "Kelsey Lumsden",
        "c1": "Jacob",
        "c2": "Tyler Stefancin",
        "winner": null
      },
      {
        "p1": "Patrick Kenny",
        "p2": "Kate Kemichick",
        "c1": "Jason Kemichick",
        "c2": "Jacob F3",
        "winner": null
      },
      {
        "p1": "Rick Pease",
        "p2": "Aaron Saunders",
        "c1": "Jacob F2",
        "c2": "Deck 3",
        "winner": null
      },
      {
        "p1": "Sophia Abraham",
        "p2": "Marina",
        "c1": "Brett",
        "c2": "Daryl",
        "winner": null
      },
      {
        "p1": "Alex Zettler",
        "p2": "Patricia Huang",
        "c1": "Sean Kirschke",
        "c2": "Trav",
        "winner": null
      }
    ],
    [
      {
        "p1": "Adlai",
        "p2": "Kelsey Lumsden",
        "c1": "Daryl",
        "c2": "Deck 4",
        "winner": null
      },
      {
        "p1": "Garrett",
        "p2": "Kate Kemichick",
        "c1": "Jacob",
        "c2": "Tyler Stefancin",
        "winner": null
      },
      {
        "p1": "Maddy Goodman",
        "p2": "Aaron Saunders",
        "c1": "Jason Kemichick",
        "c2": "Jacob F3",
        "winner": null
      },
      {
        "p1": "Patrick Kenny",
        "p2": "Marina",
        "c1": "Jacob F2",
        "c2": "Deck 3",
        "winner": null
      },
      {
        "p1": "Rick Pease",
        "p2": "Patricia Huang",
        "c1": "Brett",
        "c2": "Jacob F1",
        "winner": null
      },
      {
        "p1": "Sophia Abraham",
        "p2": "Alex Zettler",
        "c1": "Sean Kirschke",
        "c2": "Trav",
        "winner": null
      }
    ],
    [
      {
        "p1": "Adlai",
        "p2": "Kate Kemichick",
        "c1": "Deck 3",
        "c2": "Deck 4",
        "winner": null
      },
      {
        "p1": "Kelsey Lumsden",
        "p2": "Aaron Saunders",
        "c1": "Jacob",
        "c2": "Tyler Stefancin",
        "winner": null
      },
      {
        "p1": "Garrett",
        "p2": "Marina",
        "c1": "Jason Kemichick",
        "c2": "Jacob F3",
        "winner": null
      },
      {
        "p1": "Maddy Goodman",
        "p2": "Patricia Huang",
        "c1": "Jacob F2",
        "c2": "Daryl",
        "winner": null
      },
      {
        "p1": "Patrick Kenny",
        "p2": "Alex Zettler",
        "c1": "Brett",
        "c2": "Jacob F1",
        "winner": null
      },
      {
        "p1": "Rick Pease",
        "p2": "Sophia Abraham",
        "c1": "Sean Kirschke",
        "c2": "Trav",
        "winner": null
      }
    ],
    [
      {
        "p1": "Adlai",
        "p2": "Aaron Saunders",
        "c1": "Jacob F3",
        "c2": "Deck 4",
        "winner": null
      },
      {
        "p1": "Kate Kemichick",
        "p2": "Marina",
        "c1": "Jacob",
        "c2": "Tyler Stefancin",
        "winner": null
      },
      {
        "p1": "Kelsey Lumsden",
        "p2": "Patricia Huang",
        "c1": "Jason Kemichick",
        "c2": "Deck 3",
        "winner": null
      },
      {
        "p1": "Garrett",
        "p2": "Alex Zettler",
        "c1": "Jacob F2",
        "c2": "Daryl",
        "winner": null
      },
      {
        "p1": "Maddy Goodman",
        "p2": "Sophia Abraham",
        "c1": "Brett",
        "c2": "Jacob F1",
        "winner": null
      },
      {
        "p1": "Patrick Kenny",
        "p2": "Rick Pease",
        "c1": "Sean Kirschke",
        "c2": "Trav",
        "winner": null
      }
    ],
    [
      {
        "p1": "Adlai",
        "p2": "Marina",
        "c1": "Tyler Stefancin",
        "c2": "Deck 4",
        "winner": null
      },
      {
        "p1": "Aaron Saunders",
        "p2": "Patricia Huang",
        "c1": "Jacob",
        "c2": "Jacob F3",
        "winner": null
      },
      {
        "p1": "Kate Kemichick",
        "p2": "Alex Zettler",
        "c1": "Jason Kemichick",
        "c2": "Deck 3",
        "winner": null
      },
      {
        "p1": "Kelsey Lumsden",
        "p2": "Sophia Abraham",
        "c1": "Jacob F2",
        "c2": "Daryl",
        "winner": null
      },
      {
        "p1": "Garrett",
        "p2": "Rick Pease",
        "c1": "Brett",
        "c2": "Jacob F1",
        "winner": null
      },
      {
        "p1": "Maddy Goodman",
        "p2": "Patrick Kenny",
        "c1": "Sean Kirschke",
        "c2": "Trav",
        "winner": null
      }
    ]
  ],
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

  function resetState() {
      rounds = [];
      results = {
          players: {},
          decks: {}
      };
      tiebreakers = {
          first: null,
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