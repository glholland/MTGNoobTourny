// Deck Builder Tab functionality

let myDecks = [];
let availableCards = [];
let currentDeck = null;
let currentDeckCards = {};

async function loadMyDecks() {
    const listEl = document.getElementById('myDecksList');
    
    if (!currentUser) {
        document.getElementById('loginPrompt').style.display = 'block';
        document.getElementById('deckBuilderSection').style.display = 'none';
        return;
    }
    
    document.getElementById('loginPrompt').style.display = 'none';
    document.getElementById('deckBuilderSection').style.display = 'block';
    
    try {
        listEl.innerHTML = '<p>Loading your decks...</p>';
        const data = await getDecks();
        myDecks = data.decks;
        
        renderMyDecks();
    } catch (error) {
        console.error('Error loading decks:', error);
        listEl.innerHTML = '<p class="error">Error loading decks. Please try again.</p>';
    }
}

function renderMyDecks() {
    const listEl = document.getElementById('myDecksList');
    
    if (myDecks.length === 0) {
        listEl.innerHTML = '<p>You have no decks yet. Create one to get started!</p>';
        return;
    }
    
    let html = '<div class="deck-list">';
    
    myDecks.forEach(deck => {
        const cardCount = deck.cards ? deck.cards.length : 0;
        const totalCards = deck.cards ? 
            deck.cards.reduce((sum, c) => sum + c.quantity, 0) : 0;
        
        html += `
            <div class="deck-item">
                <h4>${deck.name}</h4>
                <p>${totalCards} cards (${cardCount} unique)</p>
                <p><strong>Status:</strong> ${deck.locked ? 'Locked 🔒' : 'Unlocked 🔓'}</p>
                ${deck.tournament_name ? `<p><strong>Tournament:</strong> ${deck.tournament_name}</p>` : ''}
                <div class="deck-actions">
                    <button onclick="editDeck(${deck.id})">Edit</button>
                    ${!deck.locked ? `<button onclick="lockDeckPrompt(${deck.id})">Lock In</button>` : ''}
                    ${deck.locked && deck.tournament_status !== 'active' ? 
                        `<button onclick="unlockDeckPrompt(${deck.id})">Unlock</button>` : ''}
                    <button onclick="deleteDeckPrompt(${deck.id})" class="danger">Delete</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    listEl.innerHTML = html;
}

// Create new deck button
document.addEventListener('DOMContentLoaded', () => {
    const createBtn = document.getElementById('createNewDeckBtn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            startNewDeck();
        });
    }
    
    const saveDeckBtn = document.getElementById('saveDeckBtn');
    if (saveDeckBtn) {
        saveDeckBtn.addEventListener('click', () => {
            saveDeck();
        });
    }
    
    const cancelDeckBtn = document.getElementById('cancelDeckBtn');
    if (cancelDeckBtn) {
        cancelDeckBtn.addEventListener('click', () => {
            cancelDeckEdit();
        });
    }
    
    const searchInput = document.getElementById('deckBuilderSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredCards = availableCards.filter(card => 
                card.name.toLowerCase().includes(searchTerm)
            );
            renderAvailableCards(filteredCards);
        });
    }
});

function startNewDeck() {
    currentDeck = null;
    currentDeckCards = {};
    document.getElementById('deckNameInput').value = 'My New Deck';
    showDeckEditor();
}

async function editDeck(deckId) {
    try {
        const data = await getDeck(deckId);
        currentDeck = data.deck;
        currentDeckCards = {};
        
        // Convert cards array to object
        if (currentDeck.cards) {
            currentDeck.cards.forEach(card => {
                currentDeckCards[card.id] = card.quantity;
            });
        }
        
        document.getElementById('deckNameInput').value = currentDeck.name;
        showDeckEditor();
    } catch (error) {
        alert('Error loading deck: ' + error.message);
    }
}

async function showDeckEditor() {
    document.getElementById('deckEditorSection').style.display = 'block';
    
    // Load available cards
    try {
        const data = await getCards();
        availableCards = data.cards;
        renderAvailableCards(availableCards);
        renderDeckCards();
    } catch (error) {
        alert('Error loading cards: ' + error.message);
    }
}

function renderAvailableCards(cards) {
    const listEl = document.getElementById('availableCardsList');
    
    let html = '<div class="available-cards">';
    
    cards.forEach(card => {
        const inDeck = currentDeckCards[card.id] || 0;
        const available = card.quantity_available;
        const canAdd = available > 0 || inDeck > 0;
        
        html += `
            <div class="card-row ${!canAdd ? 'disabled' : ''}">
                <span class="card-name">${card.name}</span>
                <span class="card-qty">Available: ${available}</span>
                ${canAdd ? `<button onclick="addCardToDeck(${card.id}, '${card.name}')" class="mini-btn">Add</button>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    listEl.innerHTML = html;
}

function renderDeckCards() {
    const listEl = document.getElementById('deckCardsList');
    
    if (Object.keys(currentDeckCards).length === 0) {
        listEl.innerHTML = '<p>No cards in deck yet.</p>';
        return;
    }
    
    let html = '<div class="deck-cards">';
    let totalCards = 0;
    
    Object.entries(currentDeckCards).forEach(([cardId, quantity]) => {
        const card = availableCards.find(c => c.id == cardId);
        if (card && quantity > 0) {
            totalCards += quantity;
            html += `
                <div class="deck-card-row">
                    <span class="card-name">${card.name}</span>
                    <div class="quantity-controls">
                        <button onclick="decreaseCardInDeck(${cardId})" class="mini-btn">-</button>
                        <span class="quantity">${quantity}</span>
                        <button onclick="increaseCardInDeck(${cardId})" class="mini-btn">+</button>
                    </div>
                    <button onclick="removeCardFromDeck(${cardId})" class="mini-btn danger">Remove</button>
                </div>
            `;
        }
    });
    
    html += '</div>';
    html += `<p><strong>Total cards in deck: ${totalCards}</strong></p>`;
    listEl.innerHTML = html;
}

function addCardToDeck(cardId, cardName) {
    const card = availableCards.find(c => c.id == cardId);
    if (!card) return;
    
    const inDeck = currentDeckCards[cardId] || 0;
    const available = card.quantity_available + inDeck;
    
    if (inDeck >= available) {
        alert('No more copies available.');
        return;
    }
    
    currentDeckCards[cardId] = inDeck + 1;
    renderAvailableCards(availableCards);
    renderDeckCards();
}

function increaseCardInDeck(cardId) {
    addCardToDeck(cardId, '');
}

function decreaseCardInDeck(cardId) {
    const inDeck = currentDeckCards[cardId] || 0;
    if (inDeck > 1) {
        currentDeckCards[cardId] = inDeck - 1;
    } else {
        delete currentDeckCards[cardId];
    }
    renderAvailableCards(availableCards);
    renderDeckCards();
}

function removeCardFromDeck(cardId) {
    delete currentDeckCards[cardId];
    renderAvailableCards(availableCards);
    renderDeckCards();
}

async function saveDeck() {
    const deckName = document.getElementById('deckNameInput').value.trim();
    if (!deckName) {
        alert('Please enter a deck name.');
        return;
    }
    
    const cards = Object.entries(currentDeckCards)
        .filter(([cardId, quantity]) => quantity > 0)
        .map(([cardId, quantity]) => ({
            card_id: parseInt(cardId),
            quantity: quantity
        }));
    
    try {
        if (currentDeck) {
            // Update existing deck
            await updateDeck(currentDeck.id, deckName, cards);
            alert('Deck updated successfully!');
        } else {
            // Create new deck
            await createDeck(deckName, null, cards);
            alert('Deck created successfully!');
        }
        
        cancelDeckEdit();
        loadMyDecks();
    } catch (error) {
        alert('Error saving deck: ' + error.message);
    }
}

function cancelDeckEdit() {
    document.getElementById('deckEditorSection').style.display = 'none';
    currentDeck = null;
    currentDeckCards = {};
}

async function lockDeckPrompt(deckId) {
    if (!confirm('Lock this deck for tournament entry? Cards will be allocated and unavailable to others.')) {
        return;
    }
    
    try {
        await lockDeck(deckId);
        alert('Deck locked successfully!');
        loadMyDecks();
    } catch (error) {
        alert('Error locking deck: ' + error.message);
    }
}

async function unlockDeckPrompt(deckId) {
    if (!confirm('Unlock this deck? Cards will be returned to the collection.')) {
        return;
    }
    
    try {
        await unlockDeck(deckId);
        alert('Deck unlocked successfully!');
        loadMyDecks();
    } catch (error) {
        alert('Error unlocking deck: ' + error.message);
    }
}

async function deleteDeckPrompt(deckId) {
    if (!confirm('Delete this deck? This action cannot be undone.')) {
        return;
    }
    
    try {
        await deleteDeck(deckId);
        alert('Deck deleted successfully!');
        loadMyDecks();
    } catch (error) {
        alert('Error deleting deck: ' + error.message);
    }
}
