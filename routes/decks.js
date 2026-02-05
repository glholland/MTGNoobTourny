const express = require('express');
const { getDb } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's decks
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const decks = db.prepare(`
      SELECT d.*, t.name as tournament_name, t.status as tournament_status
      FROM decks d
      LEFT JOIN tournaments t ON d.tournament_id = t.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `).all(req.user.id);

    // Get cards for each deck
    const decksWithCards = decks.map(deck => {
      const cards = db.prepare(`
        SELECT c.id, c.name, dc.quantity
        FROM deck_cards dc
        JOIN cards c ON dc.card_id = c.id
        WHERE dc.deck_id = ?
      `).all(deck.id);

      return {
        ...deck,
        cards
      };
    });

    res.json({ decks: decksWithCards });
  } catch (error) {
    console.error('Get decks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific deck
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(req.params.id);

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Check ownership
    if (deck.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get cards
    const cards = db.prepare(`
      SELECT c.id, c.name, dc.quantity
      FROM deck_cards dc
      JOIN cards c ON dc.card_id = c.id
      WHERE dc.deck_id = ?
    `).all(deck.id);

    res.json({ 
      deck: {
        ...deck,
        cards
      }
    });
  } catch (error) {
    console.error('Get deck error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new deck
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, tournament_id, cards } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Deck name is required' });
    }

    const db = getDb();

    // Create deck
    const result = db.prepare(
      'INSERT INTO decks (user_id, tournament_id, name, locked) VALUES (?, ?, ?, 0)'
    ).run(req.user.id, tournament_id || null, name);

    const deckId = result.lastInsertRowid;

    // Add cards if provided
    if (cards && Array.isArray(cards)) {
      const insertCard = db.prepare(
        'INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (?, ?, ?)'
      );

      for (const card of cards) {
        if (card.card_id && card.quantity > 0) {
          insertCard.run(deckId, card.card_id, card.quantity);
        }
      }
    }

    // Get created deck with cards
    const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(deckId);
    const deckCards = db.prepare(`
      SELECT c.id, c.name, dc.quantity
      FROM deck_cards dc
      JOIN cards c ON dc.card_id = c.id
      WHERE dc.deck_id = ?
    `).all(deckId);

    res.status(201).json({
      message: 'Deck created successfully',
      deck: {
        ...deck,
        cards: deckCards
      }
    });
  } catch (error) {
    console.error('Create deck error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update deck
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { name, cards } = req.body;
    const db = getDb();

    const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(req.params.id);
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Check ownership
    if (deck.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if deck is locked
    if (deck.locked) {
      // Check if tournament has started
      if (deck.tournament_id) {
        const tournament = db.prepare('SELECT status FROM tournaments WHERE id = ?').get(deck.tournament_id);
        if (tournament && tournament.status === 'active') {
          return res.status(400).json({ error: 'Cannot edit locked deck for active tournament' });
        }
      }
    }

    // Update deck name
    if (name) {
      db.prepare('UPDATE decks SET name = ? WHERE id = ?').run(name, req.params.id);
    }

    // Update cards
    if (cards && Array.isArray(cards)) {
      // Remove existing cards if deck is not locked
      if (!deck.locked) {
        db.prepare('DELETE FROM deck_cards WHERE deck_id = ?').run(req.params.id);
      }

      // Add new cards
      const insertCard = db.prepare(
        'INSERT OR REPLACE INTO deck_cards (deck_id, card_id, quantity) VALUES (?, ?, ?)'
      );

      for (const card of cards) {
        if (card.card_id && card.quantity > 0) {
          insertCard.run(req.params.id, card.card_id, card.quantity);
        }
      }
    }

    // Get updated deck with cards
    const updatedDeck = db.prepare('SELECT * FROM decks WHERE id = ?').get(req.params.id);
    const deckCards = db.prepare(`
      SELECT c.id, c.name, dc.quantity
      FROM deck_cards dc
      JOIN cards c ON dc.card_id = c.id
      WHERE dc.deck_id = ?
    `).all(req.params.id);

    res.json({
      message: 'Deck updated successfully',
      deck: {
        ...updatedDeck,
        cards: deckCards
      }
    });
  } catch (error) {
    console.error('Update deck error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lock deck (allocate cards)
router.post('/:id/lock', authenticateToken, (req, res) => {
  try {
    const db = getDb();

    const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(req.params.id);
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Check ownership
    if (deck.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (deck.locked) {
      return res.status(400).json({ error: 'Deck is already locked' });
    }

    // Get deck cards
    const deckCards = db.prepare(`
      SELECT dc.card_id, dc.quantity, c.quantity_available
      FROM deck_cards dc
      JOIN cards c ON dc.card_id = c.id
      WHERE dc.deck_id = ?
    `).all(req.params.id);

    // Check if all cards are available
    for (const card of deckCards) {
      if (card.quantity > card.quantity_available) {
        return res.status(400).json({ 
          error: `Not enough cards available. Card ID ${card.card_id} needs ${card.quantity} but only ${card.quantity_available} available.` 
        });
      }
    }

    // Begin transaction-like operation
    try {
      // Update card availability
      for (const card of deckCards) {
        db.prepare(
          'UPDATE cards SET quantity_available = quantity_available - ? WHERE id = ?'
        ).run(card.quantity, card.card_id);
      }

      // Lock deck
      db.prepare('UPDATE decks SET locked = 1 WHERE id = ?').run(req.params.id);

      res.json({ message: 'Deck locked successfully' });
    } catch (err) {
      // Rollback on error
      for (const card of deckCards) {
        db.prepare(
          'UPDATE cards SET quantity_available = quantity_available + ? WHERE id = ?'
        ).run(card.quantity, card.card_id);
      }
      throw err;
    }
  } catch (error) {
    console.error('Lock deck error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unlock deck (deallocate cards)
router.post('/:id/unlock', authenticateToken, (req, res) => {
  try {
    const db = getDb();

    const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(req.params.id);
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Check ownership
    if (deck.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!deck.locked) {
      return res.status(400).json({ error: 'Deck is not locked' });
    }

    // Check if tournament has started
    if (deck.tournament_id) {
      const tournament = db.prepare('SELECT status FROM tournaments WHERE id = ?').get(deck.tournament_id);
      if (tournament && tournament.status === 'active') {
        return res.status(400).json({ error: 'Cannot unlock deck for active tournament' });
      }
    }

    // Get deck cards
    const deckCards = db.prepare(`
      SELECT card_id, quantity
      FROM deck_cards
      WHERE deck_id = ?
    `).all(req.params.id);

    // Return cards to availability
    for (const card of deckCards) {
      db.prepare(
        'UPDATE cards SET quantity_available = quantity_available + ? WHERE id = ?'
      ).run(card.quantity, card.card_id);
    }

    // Unlock deck
    db.prepare('UPDATE decks SET locked = 0 WHERE id = ?').run(req.params.id);

    res.json({ message: 'Deck unlocked successfully' });
  } catch (error) {
    console.error('Unlock deck error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete deck
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();

    const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(req.params.id);
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Check ownership
    if (deck.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If deck is locked, unlock it first (return cards)
    if (deck.locked) {
      const deckCards = db.prepare(`
        SELECT card_id, quantity
        FROM deck_cards
        WHERE deck_id = ?
      `).all(req.params.id);

      for (const card of deckCards) {
        db.prepare(
          'UPDATE cards SET quantity_available = quantity_available + ? WHERE id = ?'
        ).run(card.quantity, card.card_id);
      }
    }

    // Delete deck (cascade will handle deck_cards)
    db.prepare('DELETE FROM decks WHERE id = ?').run(req.params.id);

    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('Delete deck error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
