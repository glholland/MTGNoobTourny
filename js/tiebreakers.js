  // Tiebreakers: create minimal single-elim brackets for tied groups
  function generateTiebreakers() {
      const playerScores = Object.entries(results.players);
      const deckScores = Object.entries(results.decks);

      function topThreeTies(entries) {
          if (!entries || entries.length === 0) return {
              first: [],
              second: [],
              third: []
          };
          const sorted = entries.slice().sort((a, b) => b[1] - a[1]);
          const scores = [...new Set(sorted.map(e => e[1]))];
          return {
              first: sorted.filter(e => e[1] === scores[0]).map(e => e[0] || []).filter(Boolean),
              second: scores[1] ? sorted.filter(e => e[1] === scores[1]).map(e => e[0]) : [],
              third: scores[2] ? sorted.filter(e => e[1] === scores[2]).map(e => e[0]) : []
          };
      }
      const pTies = topThreeTies(playerScores);
      const cTies = topThreeTies(deckScores);

      function buildTB(groupPlayers, groupdecks) {
          if (!groupPlayers || groupPlayers.length <= 1) return null;
          // minimal single-elim: if odd, add BYE but BYE not allowed to win; decks assigned per round fairly
          const pool = groupPlayers.slice();
          if (pool.length % 2 === 1) pool.push('BYE');
          const roundsLocal = [];
          let current = pool.slice();
          while (current.length > 1) {
              const matches = [];
              const deckPool = shuffle(groupdecks || decks);
              for (let i = 0; i < current.length; i += 2) {
                  const p1 = current[i],
                      p2 = current[i + 1] || 'BYE';
                  const c1 = (p1 !== 'BYE' && deckPool.length) ? deckPool.pop() : 'No deck';
                  const c2 = (p2 !== 'BYE' && deckPool.length) ? deckPool.pop() : 'No deck';
                  matches.push({
                      p1,
                      p2,
                      c1,
                      c2,
                      winner: null
                  });
              }
              roundsLocal.push(matches);
              // prepare next: winners unknown yet - use placeholders; we'll not auto-advance until user picks winners
              current = matches.map(m => m.winner || null).filter(Boolean);
              if (current.length === 0) break; // stop building deeper rounds now, will build as winners selected
          }
          return roundsLocal;
      }
      tiebreakers.first = {
          players: pTies.first,
          decks: cTies.first,
          rounds: buildTB(pTies.first, cTies.first)
      };
      tiebreakers.second = {
          players: pTies.second,
          decks: cTies.second,
          rounds: buildTB(pTies.second, cTies.second)
      };
      tiebreakers.third = {
          players: pTies.third,
          decks: cTies.third,
          rounds: buildTB(pTies.third, cTies.third)
      };
      renderTiebreakers();
  }

  function renderTiebreakers() {
      tiebreakerArea.innerHTML = '';
      ['first', 'second', 'third'].forEach(place => {
          const tb = tiebreakers[place];
          if (!tb || !tb.players || tb.players.length === 0) return;
          const card = document.createElement('div');
          card.className = 'card';
          const h = document.createElement('h3');
          h.textContent = place.toUpperCase() + ' Place Tiebreaker';
          card.appendChild(h);
          const p = document.createElement('p');
          p.textContent = 'Players: ' + (tb.players.join(', ') || '—');
          card.appendChild(p);
          const pc = document.createElement('p');
          pc.textContent = 'decks: ' + (tb.decks.join(', ') || '—');
          card.appendChild(pc);
          if (tb.rounds && tb.rounds.length) {
              tb.rounds.forEach((r, ri) => {
                  const sub = document.createElement('div');
                  sub.className = 'small-card';
                  sub.innerHTML = `<strong>Round ${ri+1}</strong>`;
                  r.forEach((m, mi) => {
                      const mdiv = document.createElement('div');
                      mdiv.className = 'match';
                      mdiv.innerHTML = `<div>${m.p1} <span class="muted">(${m.c1})</span> vs ${m.p2} <span class="muted">(${m.c2})</span></div>`;
                      sub.appendChild(mdiv);
                  });
                  card.appendChild(sub);
              });
          } else {
              const note = document.createElement('div');
              note.className = 'muted';
              note.textContent = 'No tiebreaker matches generated yet — winners will be chosen in tiebreaker UI when available.';
              card.appendChild(note);
          }
          tiebreakerArea.appendChild(card);
      });
  }