// API Configuration
const API_BASE_URL = window.location.origin;

// Authentication state
let currentUser = null;
let authToken = null;

// Load auth token from localStorage
function loadAuthToken() {
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        fetchCurrentUser();
    }
}

// Save auth token
function saveAuthToken(token) {
    authToken = token;
    localStorage.setItem('authToken', token);
}

// Clear auth token
function clearAuthToken() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateAuthUI();
}

// API request helper with authentication
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401 || response.status === 403) {
        // Token expired or invalid
        clearAuthToken();
        if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
            showAuthModal('login');
        }
        throw new Error('Authentication required');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// Authentication API calls
async function register(username, password, email) {
    try {
        const data = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, email })
        });
        saveAuthToken(data.token);
        currentUser = data.user;
        updateAuthUI();
        return data;
    } catch (error) {
        throw error;
    }
}

async function login(username, password) {
    try {
        const data = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        saveAuthToken(data.token);
        currentUser = data.user;
        updateAuthUI();
        return data;
    } catch (error) {
        throw error;
    }
}

async function logout() {
    try {
        if (authToken) {
            await apiRequest('/api/auth/logout', { method: 'POST' });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        clearAuthToken();
    }
}

async function fetchCurrentUser() {
    try {
        const data = await apiRequest('/api/auth/me');
        currentUser = data.user;
        updateAuthUI();
    } catch (error) {
        clearAuthToken();
    }
}

// Tournament API calls
async function getTournaments() {
    return apiRequest('/api/tournaments');
}

async function getArchivedTournaments() {
    return apiRequest('/api/tournaments/archived');
}

async function getTournament(id) {
    return apiRequest(`/api/tournaments/${id}`);
}

async function createTournament(tournamentData) {
    return apiRequest('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(tournamentData)
    });
}

async function updateTournament(id, tournamentData) {
    return apiRequest(`/api/tournaments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tournamentData)
    });
}

async function archiveTournament(id) {
    return apiRequest(`/api/tournaments/${id}/archive`, {
        method: 'POST'
    });
}

// Card API calls
async function getCards() {
    return apiRequest('/api/cards');
}

async function getCard(id) {
    return apiRequest(`/api/cards/${id}`);
}

async function addCard(name, quantity) {
    return apiRequest('/api/cards', {
        method: 'POST',
        body: JSON.stringify({ name, quantity })
    });
}

async function updateCard(id, quantity_total) {
    return apiRequest(`/api/cards/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity_total })
    });
}

// Deck API calls
async function getDecks() {
    return apiRequest('/api/decks');
}

async function getDeck(id) {
    return apiRequest(`/api/decks/${id}`);
}

async function createDeck(name, tournament_id, cards) {
    return apiRequest('/api/decks', {
        method: 'POST',
        body: JSON.stringify({ name, tournament_id, cards })
    });
}

async function updateDeck(id, name, cards) {
    return apiRequest(`/api/decks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, cards })
    });
}

async function lockDeck(id) {
    return apiRequest(`/api/decks/${id}/lock`, {
        method: 'POST'
    });
}

async function unlockDeck(id) {
    return apiRequest(`/api/decks/${id}/unlock`, {
        method: 'POST'
    });
}

async function deleteDeck(id) {
    return apiRequest(`/api/decks/${id}`, {
        method: 'DELETE'
    });
}

// Player API calls
async function getPlayers() {
    return apiRequest('/api/players');
}

// UI Update functions
function updateAuthUI() {
    const userInfo = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const deckBuilderSection = document.getElementById('deckBuilderSection');

    if (currentUser) {
        if (userInfo) {
            userInfo.textContent = `👤 ${currentUser.username}${currentUser.is_admin ? ' (Admin)' : ''}`;
            userInfo.style.display = 'inline-block';
        }
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (deckBuilderSection) deckBuilderSection.style.display = 'block';
    } else {
        if (userInfo) {
            userInfo.textContent = '';
            userInfo.style.display = 'none';
        }
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (deckBuilderSection) deckBuilderSection.style.display = 'none';
    }
}

function showAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginFormSection');
    const registerForm = document.getElementById('registerFormSection');

    if (mode === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }

    modal.style.display = 'flex';
}

function hideAuthModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'none';
    
    // Clear forms
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerEmail').value = '';
    
    // Clear error messages
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(err => err.textContent = '');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAuthToken();
});
