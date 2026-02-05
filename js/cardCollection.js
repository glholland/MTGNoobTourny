// Card Collection Tab functionality

let allCards = [];

async function loadCardCollection() {
    const listEl = document.getElementById('cardCollectionList');
    
    try {
        listEl.innerHTML = '<p>Loading card collection...</p>';
        const data = await getCards();
        allCards = data.cards;
        
        renderCardCollection(allCards);
        
        // Show admin controls if admin
        if (currentUser && currentUser.is_admin) {
            const addCardBtn = document.getElementById('addCardBtn');
            if (addCardBtn) {
                addCardBtn.style.display = 'inline-block';
            }
        }
    } catch (error) {
        console.error('Error loading card collection:', error);
        listEl.innerHTML = '<p class="error">Error loading card collection. Please try again.</p>';
    }
}

function renderCardCollection(cards) {
    const listEl = document.getElementById('cardCollectionList');
    
    if (cards.length === 0) {
        listEl.innerHTML = '<p>No cards in collection.</p>';
        return;
    }
    
    let html = '<table class="card-table"><thead><tr>';
    html += '<th>Card Name</th>';
    html += '<th>Total Quantity</th>';
    html += '<th>Available</th>';
    html += '<th>Allocation Status</th>';
    if (currentUser && currentUser.is_admin) {
        html += '<th>Actions</th>';
    }
    html += '</tr></thead><tbody>';
    
    cards.forEach(card => {
        const allocated = card.quantity_total - card.quantity_available;
        let allocationInfo = '';
        
        if (card.allocations && card.allocations.length > 0) {
            const allocationList = card.allocations.map(alloc => 
                `${alloc.username} (${alloc.quantity}x)`
            ).join(', ');
            allocationInfo = `In use by: ${allocationList}`;
        } else {
            allocationInfo = 'Not allocated';
        }
        
        html += '<tr>';
        html += `<td>${card.name}</td>`;
        html += `<td>${card.quantity_total}</td>`;
        html += `<td class="${card.quantity_available === 0 ? 'out-of-stock' : ''}">${card.quantity_available}</td>`;
        html += `<td>${allocationInfo}</td>`;
        
        if (currentUser && currentUser.is_admin) {
            html += `<td>
                <button class="mini-btn" onclick="editCardQuantity(${card.id}, '${card.name}', ${card.quantity_total})">Edit</button>
            </td>`;
        }
        
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    listEl.innerHTML = html;
}

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('cardSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredCards = allCards.filter(card => 
                card.name.toLowerCase().includes(searchTerm)
            );
            renderCardCollection(filteredCards);
        });
    }
    
    // Add card button
    const addCardBtn = document.getElementById('addCardBtn');
    if (addCardBtn) {
        addCardBtn.addEventListener('click', () => {
            addNewCard();
        });
    }
});

async function addNewCard() {
    const name = prompt('Enter card name:');
    if (!name || name.trim() === '') return;
    
    const quantityStr = prompt('Enter quantity:', '1');
    const quantity = parseInt(quantityStr) || 1;
    
    try {
        await addCard(name.trim(), quantity);
        alert('Card added successfully!');
        loadCardCollection();
    } catch (error) {
        alert('Error adding card: ' + error.message);
    }
}

async function editCardQuantity(cardId, cardName, currentQuantity) {
    const newQuantityStr = prompt(`Edit quantity for "${cardName}":`, currentQuantity);
    if (newQuantityStr === null) return;
    
    const newQuantity = parseInt(newQuantityStr);
    if (isNaN(newQuantity) || newQuantity < 0) {
        alert('Please enter a valid quantity.');
        return;
    }
    
    try {
        await updateCard(cardId, newQuantity);
        alert('Card quantity updated successfully!');
        loadCardCollection();
    } catch (error) {
        alert('Error updating card: ' + error.message);
    }
}
