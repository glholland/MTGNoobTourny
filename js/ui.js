  // UI updates
function refreshLists() {
    // Update numeric counts
    document.getElementById("playerCount").textContent = players.length;
    document.getElementById("deckCount").textContent = decks.length;

    // Clear list display
    playerList.innerHTML = "";
    deckList.innerHTML = "";

    // --- PLAYERS LIST ---
    players.forEach((p, index) => {
        const row = document.createElement("div");
        row.className = "list-item";

        const label = document.createElement("span");
        label.textContent = p;

        const editBtn = document.createElement("button");
        editBtn.className = "mini-btn";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => {
            const newName = prompt("Rename player:", p);
            if (!newName || newName.trim() === "" || newName === p) return;

            players[index] = newName.trim();
            refreshLists();
            saveTournamentState();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "mini-btn danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => {
            if (!confirm(`Remove player "${p}"?`)) return;

            players.splice(index, 1);
            refreshLists();
            saveTournamentState();
        });

        row.appendChild(label);
        row.appendChild(editBtn);
        row.appendChild(deleteBtn);

        playerList.appendChild(row);
    });

    // --- DECK LIST ---
    decks.forEach((d, index) => {
        const row = document.createElement("div");
        row.className = "list-item";

        const label = document.createElement("span");
        label.textContent = d;

        const editBtn = document.createElement("button");
        editBtn.className = "mini-btn";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => {
            const newName = prompt("Rename deck:", d);
            if (!newName || newName.trim() === "" || newName === d) return;

            decks[index] = newName.trim();
            refreshLists();
            saveTournamentState();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "mini-btn danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => {
            if (!confirm(`Remove deck "${d}"?`)) return;

            decks.splice(index, 1);
            refreshLists();
            saveTournamentState();
        });

        row.appendChild(label);
        row.appendChild(editBtn);
        row.appendChild(deleteBtn);

        deckList.appendChild(row);
    });

    // --- PLAYER VIEW DROPDOWN ---
    if (typeof playerViewSelect !== "undefined" && playerViewSelect) {
        playerViewSelect.innerHTML =
            `<option value="">-- choose --</option>` +
            players.map(p => `<option value="${p}">${p}</option>`).join("");
    }
}



function updateLeaderboards() {
    playerLeaderboard.innerHTML = '';
    deckLeaderboard. innerHTML = '';
    
    const sortedPlayers = Object.entries(results.players).sort((a, b) => b[1] - a[1]);
    sortedPlayers.forEach(([p, w]) => {
        const li = document.createElement('li');
        const losses = results.playerLosses[p] || 0;
        li. textContent = `${p}: ${w}W-${losses}L`;
        playerLeaderboard.appendChild(li);
    });
    
    const sorteddecks = Object.entries(results.decks).sort((a, b) => b[1] - a[1]);
    sorteddecks.forEach(([c, w]) => {
        const li = document.createElement('li');
        const losses = results. deckLosses[c] || 0;
        li. textContent = `${c}: ${w}W-${losses}L`;
        deckLeaderboard.appendChild(li);
    });
}

  // Render bracket rounds
  function renderBracket() {
      bracketArea.innerHTML = '';

      rounds.forEach((roundMatches, rIdx) => {
          const card = document.createElement('div');
          card.className = 'card';

          const h = document.createElement('h3');
          h.textContent = 'Round ' + (rIdx + 1);
          card.appendChild(h);

          const grid = document.createElement('div');
          grid.className = 'grid';

          roundMatches.forEach((m, mIdx) => {
              const matchDiv = document.createElement('div');
              matchDiv.className = 'match';

              const left = document.createElement('div');
              left.innerHTML = `<strong>${m.p1}</strong> <span class="muted">(${m.c1})</span>`;

              const right = document.createElement('div');
              right.innerHTML = `<strong>${m.p2}</strong> <span class="muted">(${m.c2})</span>`;

              matchDiv.appendChild(left);
              matchDiv.appendChild(document.createElement('div')).textContent = 'vs';
              matchDiv.appendChild(right);

              // BYE match
              if (m.p1 === 'BYE' || m.p2 === 'BYE') {
                  const bye = document.createElement('div');
                  bye.className = 'muted';
                  bye.textContent = 'BYE - No winner assigned';
                  matchDiv.appendChild(bye);
              } else {
                  const btns = document.createElement('div');
                  btns.className = 'match-btns';

                  const b1 = document.createElement('button');
                  b1.textContent = 'Winner: ' + m.p1;
                  b1.disabled = !!m.winner;
                  b1.addEventListener('click', () =>
                      pickWinner(rIdx, mIdx, m.p1, m.c1)
                  );

                  const b2 = document.createElement('button');
                  b2.textContent = 'Winner: ' + m.p2;
                  b2.disabled = !!m.winner;
                  b2.addEventListener('click', () =>
                      pickWinner(rIdx, mIdx, m.p2, m.c2)
                  );

                  btns.appendChild(b1);
                  btns.appendChild(b2);
                  matchDiv.appendChild(btns);
              }

              // Winner display + UNDO button
              if (m.winner) {
                  const win = document.createElement('div');
                  win.className = 'winner';
                  win.textContent = 'Winner: ' + m.winner;
                  matchDiv.appendChild(win);

                  // UNDO button
                  const undoBtn = document.createElement('button');
                  undoBtn.textContent = 'Undo';
                  undoBtn.className = 'undo-btn';
                  undoBtn.addEventListener('click', () =>
                      undoWinner(rIdx, mIdx)
                  );

                  matchDiv.appendChild(undoBtn);
              }

              grid.appendChild(matchDiv);
          });

          card.appendChild(grid);
          bracketArea.appendChild(card);
      });
      renderDeckMatrix();

  }


  function renderPlayerView() {
      playerOpponents.innerHTML = '';
      const selected = playerViewSelect.value;
      if (!selected) return;
      const list = [];
      rounds.forEach((r, idx) => {
          r.forEach(m => {
              if (m.p1 === selected || m.p2 === selected) {
                  const opponent = (m.p1 === selected) ? m.p2 : m.p1;
                  const deck = (m.p1 === selected) ? m.c1 : m.c2;
                  const oppdeck = (m.p1 === selected) ? m.c2 : m.c1;
                  list.push({
                      round: idx + 1,
                      opponent,
                      deck,
                      oppdeck
                  });
              }
          });
      });
      if (list.length === 0) playerOpponents.textContent = 'No matches yet';
      list.forEach(it => {
          const card = document.createElement('div');
          card.className = 'small-card';
          card.innerHTML = `<strong>Round ${it.round}</strong><div>Opponent: ${it.opponent} ${it.opponent==='BYE' ? '(BYE)' : ''} <span class="muted">(${it.oppdeck})</span></div><div>Your deck: <span class="muted">${it.deck}</span></div>`;
          playerOpponents.appendChild(card);
      });
  }

  function renderDeckMatrix() {
      const container = document.getElementById("deckMatrix");
      if (!container) return;

      // Clear previous
      container.innerHTML = "";

      if (!players.length || !decks.length) {
          container.textContent = "Matrix unavailable.";
          return;
      }

      // Track counts
      const usage = {};
      players.forEach(p => usage[p] = {});
      players.forEach(p => decks.forEach(d => usage[p][d] = 0));

      // Scan all rounds to fill usage matrix
      rounds.forEach(round => {
          round.forEach(match => {
              if (match.p1 !== "BYE" && match.c1 !== "No deck") {
                  usage[match.p1][match.c1]++;
              }
              if (match.p2 !== "BYE" && match.c2 !== "No deck") {
                  usage[match.p2][match.c2]++;
              }
          });
      });

      // Create table
      const table = document.createElement("table");
      table.className = "usage-table";

      // Header row
      const headerRow = document.createElement("tr");
      headerRow.innerHTML = `<th>Player</th>` + decks.map(d => `<th>${d}</th>`).join("");
      table.appendChild(headerRow);

      // Player rows
      players.forEach(p => {
          const row = document.createElement("tr");
          let html = `<td><strong>${p}</strong></td>`;
          decks.forEach(d => {
              const count = usage[p][d];
              html += `<td class="usage-cell">${count}</td>`;
          });
          row.innerHTML = html;
          table.appendChild(row);
      });
	  
	      const totalRow = document.createElement("tr");
    let totalHTML = `<td><strong>Total</strong></td>`;

    decks.forEach(d => {
        let total = 0;
        players.forEach(p => {
            total += usage[p][d];
        });
        totalHTML += `<td class="usage-total"><strong>${total}</strong></td>`;
    });

    totalRow.innerHTML = totalHTML;
    table.appendChild(totalRow);

      container.appendChild(table);
  }