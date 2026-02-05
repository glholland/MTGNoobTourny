  // Export / Import
  function exportState() {
      const data = {
          players,
          decks,
          tournamentType,
          rounds,
          results,
          tiebreakers
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], {
          type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tournament_data.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      }, 500);
  }

  function importState(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
          try {
              const data = JSON.parse(String(reader.result));
              players = Array.isArray(data.players) ? data.players : (Array.isArray(data.setA) ? data.setA : []);
              decks = Array.isArray(data.decks) ? data.decks : (Array.isArray(data.setB) ? data.setB : []);
              tournamentType = data.tournamentType || 'single';
              rounds = Array.isArray(data.rounds) ? data.rounds : (Array.isArray(data.bracket) ? data.bracket : []);
              results = data.results || {
                  players: {},
                  decks: {},
                  playerLosses: {},
                  deckLosses: {}
              };
              tiebreakers = data.tiebreakers || {
                  first: null,
                  second: null,
                  third: null
              };
              // sync UI
              tournamentTypeSelect.value = tournamentType;
              refreshLists();
              renderBracket();
              updateLeaderboards();
              renderTiebreakers();
              renderDeckMatrix();
          } catch (err) {
              alert('Import failed: invalid file.');
          }
      };
      reader.onerror = () => alert('Failed to read file.');
      reader.readAsText(file);
  }


  function importTournamentObject(obj) {
      players = Array.isArray(obj.players) ? obj.players : [];
      decks = Array.isArray(obj.decks) ? obj.decks : [];
      tournamentType = obj.tournamentType || 'roundrobin';

      rounds = Array.isArray(obj.rounds) ? obj.rounds : [];
      results = obj.results || {
          players: {},
          decks: {},
          playerLosses: {},
          deckLosses: {}
      };
      tiebreakers = obj.tiebreakers || {
          first: null,
          second: null,
          third: null
      };

      refreshLists();
      renderBracket();
      updateLeaderboards();
      renderTiebreakers();
      renderPlayerView();
      renderDeckMatrix();
  }