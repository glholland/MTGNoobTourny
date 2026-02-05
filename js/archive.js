// Archive Tab functionality

async function loadArchivedTournaments() {
    const listEl = document.getElementById('archivedTournamentsList');
    
    try {
        listEl.innerHTML = '<p>Loading archived tournaments...</p>';
        const data = await getArchivedTournaments();
        const tournaments = data.tournaments;
        
        if (tournaments.length === 0) {
            listEl.innerHTML = '<p>No archived tournaments found.</p>';
            return;
        }
        
        let html = '<div class="tournament-list">';
        
        tournaments.forEach(tournament => {
            const tournamentData = tournament.data || {};
            const playerCount = tournamentData.players ? tournamentData.players.length : 0;
            const deckCount = tournamentData.decks ? tournamentData.decks.length : 0;
            const roundCount = tournamentData.rounds ? tournamentData.rounds.length : 0;
            
            html += `
                <div class="tournament-item" onclick="showTournamentDetails(${tournament.id})">
                    <h3>${tournament.name}</h3>
                    <div class="tournament-meta">
                        <span><strong>Date:</strong> ${tournament.date}</span>
                        <span><strong>Type:</strong> ${tournament.type}</span>
                        <span><strong>Rounds:</strong> ${roundCount}</span>
                    </div>
                    <div class="tournament-stats">
                        <span><strong>Players:</strong> ${playerCount}</span>
                        <span><strong>Decks:</strong> ${deckCount}</span>
                    </div>
                    <button class="view-details-btn">View Details</button>
                </div>
            `;
        });
        
        html += '</div>';
        listEl.innerHTML = html;
    } catch (error) {
        console.error('Error loading archived tournaments:', error);
        listEl.innerHTML = '<p class="error">Error loading archived tournaments. Please try again.</p>';
    }
}

async function showTournamentDetails(tournamentId) {
    const modal = document.getElementById('tournamentDetailsModal');
    const detailsEl = document.getElementById('tournamentDetails');
    
    try {
        detailsEl.innerHTML = '<p>Loading tournament details...</p>';
        modal.style.display = 'flex';
        
        const data = await getTournament(tournamentId);
        const tournament = data.tournament;
        const tournamentData = tournament.data || {};
        
        let html = `
            <h2>${tournament.name}</h2>
            <div class="tournament-info">
                <p><strong>Date:</strong> ${tournament.date}</p>
                <p><strong>Type:</strong> ${tournament.type}</p>
                <p><strong>Status:</strong> ${tournament.status}</p>
            </div>
        `;
        
        // Player Leaderboard
        if (tournamentData.results && tournamentData.results.players) {
            html += '<h3>Player Standings</h3>';
            html += '<ol class="leaderboard">';
            
            const playerResults = Object.entries(tournamentData.results.players)
                .sort((a, b) => b[1] - a[1]);
            
            playerResults.forEach(([player, wins]) => {
                const losses = tournamentData.results.playerLosses ? 
                    tournamentData.results.playerLosses[player] || 0 : 0;
                html += `<li>${player}: ${wins} wins, ${losses} losses</li>`;
            });
            
            html += '</ol>';
        }
        
        // Deck Leaderboard
        if (tournamentData.results && tournamentData.results.decks) {
            html += '<h3>Deck Performance</h3>';
            html += '<ol class="leaderboard">';
            
            const deckResults = Object.entries(tournamentData.results.decks)
                .sort((a, b) => b[1] - a[1]);
            
            deckResults.forEach(([deck, wins]) => {
                const losses = tournamentData.results.deckLosses ? 
                    tournamentData.results.deckLosses[deck] || 0 : 0;
                html += `<li>${deck}: ${wins} wins, ${losses} losses</li>`;
            });
            
            html += '</ol>';
        }
        
        // Rounds
        if (tournamentData.rounds && tournamentData.rounds.length > 0) {
            html += '<h3>Tournament Rounds</h3>';
            html += '<div class="rounds-container">';
            
            tournamentData.rounds.forEach((round, roundIndex) => {
                html += `<div class="round">`;
                html += `<h4>Round ${roundIndex + 1}</h4>`;
                html += '<div class="matches">';
                
                round.forEach(match => {
                    const winnerClass = match.winner ? 'winner' : '';
                    html += `
                        <div class="match">
                            <span class="${match.winner === match.p1 ? 'winner' : ''}">${match.p1} (${match.c1})</span>
                            <span>vs</span>
                            <span class="${match.winner === match.p2 ? 'winner' : ''}">${match.p2} (${match.c2})</span>
                            ${match.winner ? `<br/><strong>Winner: ${match.winner}</strong>` : ''}
                        </div>
                    `;
                });
                
                html += '</div></div>';
            });
            
            html += '</div>';
        }
        
        // Tiebreakers
        if (tournamentData.tiebreakers) {
            html += '<h3>Tiebreakers</h3>';
            html += '<div class="tiebreakers">';
            
            if (tournamentData.tiebreakers.first) {
                html += '<p><strong>1st Place:</strong> ' + 
                    (tournamentData.tiebreakers.first.players || []).join(', ') + '</p>';
            }
            if (tournamentData.tiebreakers.second) {
                html += '<p><strong>2nd Place:</strong> ' + 
                    (tournamentData.tiebreakers.second.players || []).join(', ') + '</p>';
            }
            if (tournamentData.tiebreakers.third) {
                html += '<p><strong>3rd Place:</strong> ' + 
                    (tournamentData.tiebreakers.third.players || []).join(', ') + '</p>';
            }
            
            html += '</div>';
        }
        
        detailsEl.innerHTML = html;
    } catch (error) {
        console.error('Error loading tournament details:', error);
        detailsEl.innerHTML = '<p class="error">Error loading tournament details. Please try again.</p>';
    }
}
