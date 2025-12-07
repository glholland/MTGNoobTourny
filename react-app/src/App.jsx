import { useState, useEffect, useRef } from 'react';
import './App.css';
import Logo from './components/Logo';
import { 
  shuffle, 
  ensureEvenWithBye, 
  generateSingleElim, 
  generateRoundRobin,
  DEFAULT_TOURNAMENT 
} from './utils/tournamentUtils';

function App() {
  const [players, setPlayers] = useState([]);
  const [decks, setDecks] = useState([]);
  const [tournamentType, setTournamentType] = useState('single');
  const [rounds, setRounds] = useState([]);
  const [results, setResults] = useState({ players: {}, decks: {} });
  const [tiebreakers, setTiebreakers] = useState({ first: null, second: null, third: null });
  const [playerInput, setPlayerInput] = useState('');
  const [deckInput, setDeckInput] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [deckHistory, setDeckHistory] = useState({});
  const [theme, setTheme] = useState('default');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'tree'
  const importFileRef = useRef(null);

  // Load default tournament on mount
  useEffect(() => {
    importTournamentObject(DEFAULT_TOURNAMENT);
  }, []);

  // Apply theme to body
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const importTournamentObject = (obj) => {
    setPlayers(Array.isArray(obj.players) ? obj.players : []);
    setDecks(Array.isArray(obj.decks) ? obj.decks : []);
    setTournamentType(obj.tournamentType || 'roundrobin');
    setRounds(Array.isArray(obj.rounds) ? obj.rounds : []);
    setResults(obj.results || { players: {}, decks: {} });
    setTiebreakers(obj.tiebreakers || { first: null, second: null, third: null });
  };

  const addParticipantToState = () => {
    const raw = playerInput.trim();
    if (!raw) return;

    const names = raw
      .split(/\r?\n/)
      .map(n => n.trim())
      .filter(n => n && !players.includes(n));

    setPlayers([...players, ...names]);
    setPlayerInput('');
  };

  const addDeckToState = () => {
    const raw = deckInput.trim();
    if (!raw) return;

    const names = raw
      .split(/\r?\n/)
      .map(n => n.trim())
      .filter(n => n && !decks.includes(n));

    setDecks([...decks, ...names]);
    setDeckInput('');
  };

  const handleGenerateTournament = () => {
    let newRounds;
    if (tournamentType === 'roundrobin') {
      newRounds = generateRoundRobin(players, decks, deckHistory, setDeckHistory);
    } else {
      newRounds = generateSingleElim(players, decks);
    }
    setRounds(newRounds);
    setResults({ players: {}, decks: {} });
    setTiebreakers({ first: null, second: null, third: null });
  };

  const handleReset = () => {
    setPlayers([]);
    setDecks([]);
    setRounds([]);
    setResults({ players: {}, decks: {} });
    setTiebreakers({ first: null, second: null, third: null });
    setDeckHistory({});
  };

  const pickWinner = (roundIndex, matchIndex, winner, deck) => {
    const match = rounds[roundIndex][matchIndex];
    if (match.winner || match.p1 === 'BYE' || match.p2 === 'BYE') return;

    const newRounds = JSON.parse(JSON.stringify(rounds));
    newRounds[roundIndex][matchIndex].winner = winner;

    const newResults = { ...results };
    newResults.players[winner] = (newResults.players[winner] || 0) + 1;
    if (deck && deck !== 'No deck') {
      newResults.decks[deck] = (newResults.decks[deck] || 0) + 1;
    }

    // Handle elimination advancement
    if (tournamentType !== 'roundrobin') {
      const current = newRounds[roundIndex];
      const allDecided = current.every(m => m.winner || m.p2 === 'BYE');
      if (allDecided) {
        const nextPlayers = current.map(m => m.winner).filter(p => p && p !== 'BYE');
        if (nextPlayers.length > 0) {
          const nextRound = generateSingleElim(nextPlayers, decks)[0];
          newRounds.push(nextRound);
        }
      }
    }

    setRounds(newRounds);
    setResults(newResults);
  };

  const exportState = () => {
    const data = { players, decks, tournamentType, rounds, results, tiebreakers };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
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
  };

  const importState = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        importTournamentObject(data);
      } catch (err) {
        alert('Import failed: invalid file.');
      }
    };
    reader.onerror = () => alert('Failed to read file.');
    reader.readAsText(file);
  };

  const generateTiebreakersFn = () => {
    const playerScores = Object.entries(results.players);
    const deckScores = Object.entries(results.decks);

    const topThreeTies = (entries) => {
      if (!entries || entries.length === 0) return { first: [], second: [], third: [] };
      const sorted = entries.slice().sort((a, b) => b[1] - a[1]);
      const scores = [...new Set(sorted.map(e => e[1]))];
      return {
        first: sorted.filter(e => e[1] === scores[0]).map(e => e[0]).filter(Boolean),
        second: scores[1] ? sorted.filter(e => e[1] === scores[1]).map(e => e[0]) : [],
        third: scores[2] ? sorted.filter(e => e[1] === scores[2]).map(e => e[0]) : []
      };
    };

    const pTies = topThreeTies(playerScores);
    const cTies = topThreeTies(deckScores);

    const buildTB = (groupPlayers, groupDecks) => {
      if (!groupPlayers || groupPlayers.length <= 1) return null;
      const pool = groupPlayers.slice();
      if (pool.length % 2 === 1) pool.push('BYE');
      const roundsLocal = [];
      let current = pool.slice();
      while (current.length > 1) {
        const matches = [];
        const deckPool = shuffle(groupDecks || decks);
        for (let i = 0; i < current.length; i += 2) {
          const p1 = current[i], p2 = current[i + 1] || 'BYE';
          const c1 = (p1 !== 'BYE' && deckPool.length) ? deckPool.pop() : 'No deck';
          const c2 = (p2 !== 'BYE' && deckPool.length) ? deckPool.pop() : 'No deck';
          matches.push({ p1, p2, c1, c2, winner: null });
        }
        roundsLocal.push(matches);
        current = matches.map(m => m.winner || null).filter(Boolean);
        if (current.length === 0) break;
      }
      return roundsLocal;
    };

    setTiebreakers({
      first: { players: pTies.first, decks: cTies.first, rounds: buildTB(pTies.first, cTies.first) },
      second: { players: pTies.second, decks: cTies.second, rounds: buildTB(pTies.second, cTies.second) },
      third: { players: pTies.third, decks: cTies.third, rounds: buildTB(pTies.third, cTies.third) }
    });
  };

  const getPlayerView = () => {
    if (!selectedPlayer) return [];
    const list = [];
    rounds.forEach((r, idx) => {
      r.forEach(m => {
        if (m.p1 === selectedPlayer || m.p2 === selectedPlayer) {
          const opponent = (m.p1 === selectedPlayer) ? m.p2 : m.p1;
          const deck = (m.p1 === selectedPlayer) ? m.c1 : m.c2;
          const oppdeck = (m.p1 === selectedPlayer) ? m.c2 : m.c1;
          list.push({ round: idx + 1, opponent, deck, oppdeck });
        }
      });
    });
    return list;
  };

  const resetToDefaults = () => {
    if (confirm('Reset to default players and decks? This will clear your current tournament.')) {
      importTournamentObject(DEFAULT_TOURNAMENT);
    }
  };

  const sortedPlayers = Object.entries(results.players).sort((a, b) => b[1] - a[1]);
  const sortedDecks = Object.entries(results.decks).sort((a, b) => b[1] - a[1]);
  const playerView = getPlayerView();

  return (
    <div className="container">
      <h1>
        <Logo theme={theme} />
        <span>Tournament Bracket Generator</span>
      </h1>

      <section className="row">
        <div className="card">
          <h2>Import / Export</h2>
          <div className="controls">
            <button onClick={exportState}>Export Bracket</button>
            <input
              ref={importFileRef}
              type="file"
              accept="application/json"
              onChange={(e) => importState(e.target.files && e.target.files[0])}
            />
            <button onClick={resetToDefaults} style={{ marginLeft: 'auto' }}>
              Reset to Defaults
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Sets</h2>
          <div className="two-col">
            <div>
              <h3>Players (<span>{players.length}</span>)</h3>
              <textarea
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                placeholder="Paste players here, one per line"
                onKeyDown={(e) => e.key === 'Enter' && addParticipantToState()}
              />
              <button onClick={addParticipantToState}>Add</button>
              <ul>
                {players.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Decks (<span>{decks.length}</span>)</h3>
              <textarea
                value={deckInput}
                onChange={(e) => setDeckInput(e.target.value)}
                placeholder="Paste decks here, one per line"
                onKeyDown={(e) => e.key === 'Enter' && addDeckToState()}
              />
              <button onClick={addDeckToState}>Add</button>
              <ul>
                {decks.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Options</h2>
          <label>
            Theme:
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="default">Default</option>
              <option value="white">White</option>
              <option value="blue">Blue</option>
              <option value="black">Black</option>
              <option value="red">Red</option>
              <option value="green">Green</option>
            </select>
          </label>
          <label>
            View Mode:
            <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
              <option value="grid">Grid View</option>
              <option value="tree">Tree View</option>
            </select>
          </label>
          <label>
            Tournament type:
            <select value={tournamentType} onChange={(e) => setTournamentType(e.target.value)}>
              <option value="single">Single Elimination</option>
              <option value="double">Double Elimination (not fully supported)</option>
              <option value="roundrobin">Round Robin</option>
            </select>
          </label>
          <div className="controls">
            <button onClick={handleGenerateTournament}>Generate Tournament</button>
            <button onClick={handleReset}>Reset</button>
          </div>
        </div>
      </section>

      <section id="bracketArea">
        {viewMode === 'grid' ? (
          // Grid view - existing layout
          rounds.map((roundMatches, rIdx) => (
            <div key={rIdx} className="card">
              <h3>Round {rIdx + 1}</h3>
              <div className="grid">
                {roundMatches.map((m, mIdx) => (
                  <div key={mIdx} className="match">
                    <div>
                      <strong>{m.p1}</strong> <span className="muted">({m.c1})</span>
                    </div>
                    <div>vs</div>
                    <div>
                      <strong>{m.p2}</strong> <span className="muted">({m.c2})</span>
                    </div>
                    {m.p1 === 'BYE' || m.p2 === 'BYE' ? (
                      <div className="muted">BYE - No winner assigned</div>
                    ) : (
                      <div className="match-btns">
                        <button
                          onClick={() => pickWinner(rIdx, mIdx, m.p1, m.c1)}
                          disabled={!!m.winner}
                        >
                          Winner: {m.p1}
                        </button>
                        <button
                          onClick={() => pickWinner(rIdx, mIdx, m.p2, m.c2)}
                          disabled={!!m.winner}
                        >
                          Winner: {m.p2}
                        </button>
                      </div>
                    )}
                    {m.winner && <div className="winner">Winner: {m.winner}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // Tree view - horizontal bracket layout
          <div className="tree-bracket">
            {rounds.map((roundMatches, rIdx) => (
              <div key={rIdx} className="tree-round">
                <h3>Round {rIdx + 1}</h3>
                <div className="tree-matches">
                  {roundMatches.map((m, mIdx) => (
                    <div key={mIdx} className="tree-match">
                      <div className="tree-match-content">
                        <div className="tree-player">
                          <strong>{m.p1}</strong>
                          <span className="muted">({m.c1})</span>
                        </div>
                        <div className="tree-player">
                          <strong>{m.p2}</strong>
                          <span className="muted">({m.c2})</span>
                        </div>
                      </div>
                      {m.p1 !== 'BYE' && m.p2 !== 'BYE' && !m.winner && (
                        <div className="tree-match-btns">
                          <button
                            onClick={() => pickWinner(rIdx, mIdx, m.p1, m.c1)}
                            className="tree-btn"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => pickWinner(rIdx, mIdx, m.p2, m.c2)}
                            className="tree-btn"
                          >
                            ✓
                          </button>
                        </div>
                      )}
                      {m.winner && <div className="tree-winner">→ {m.winner}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Player View</h2>
        <label>
          Select player:
          <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
            <option value="">-- choose --</option>
            {players.map((p, i) => (
              <option key={i} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <div id="playerOpponents">
          {playerView.length === 0 ? (
            <div>No matches yet</div>
          ) : (
            playerView.map((it, i) => (
              <div key={i} className="small-card">
                <strong>Round {it.round}</strong>
                <div>
                  Opponent: {it.opponent} {it.opponent === 'BYE' ? '(BYE)' : ''}{' '}
                  <span className="muted">({it.oppdeck})</span>
                </div>
                <div>
                  Your deck: <span className="muted">{it.deck}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card">
        <h2>Leaderboards</h2>
        <div className="two-col">
          <div>
            <h3>Players</h3>
            <ol>
              {sortedPlayers.map(([p, w], i) => (
                <li key={i}>{p}: {w} win(s)</li>
              ))}
            </ol>
          </div>
          <div>
            <h3>Decks</h3>
            <ol>
              {sortedDecks.map(([c, w], i) => (
                <li key={i}>{c}: {w} win(s)</li>
              ))}
            </ol>
          </div>
        </div>
        <div className="controls">
          <button onClick={generateTiebreakersFn}>Generate Tiebreakers (1st/2nd/3rd)</button>
        </div>
      </section>

      <section id="tiebreakerArea">
        {['first', 'second', 'third'].map(place => {
          const tb = tiebreakers[place];
          if (!tb || !tb.players || tb.players.length === 0) return null;
          return (
            <div key={place} className="card">
              <h3>{place.toUpperCase()} Place Tiebreaker</h3>
              <p>Players: {tb.players.join(', ') || '—'}</p>
              <p>Decks: {tb.decks.join(', ') || '—'}</p>
              {tb.rounds && tb.rounds.length ? (
                tb.rounds.map((r, ri) => (
                  <div key={ri} className="small-card">
                    <strong>Round {ri + 1}</strong>
                    {r.map((m, mi) => (
                      <div key={mi} className="match">
                        <div>
                          {m.p1} <span className="muted">({m.c1})</span> vs {m.p2}{' '}
                          <span className="muted">({m.c2})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="muted">
                  No tiebreaker matches generated yet — winners will be chosen in tiebreaker UI when available.
                </div>
              )}
            </div>
          );
        })}
      </section>

      <footer>Built with React — modern tournament bracket generator.</footer>
    </div>
  );
}

export default App;
