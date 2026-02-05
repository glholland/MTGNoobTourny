const express = require('express');
const { getDb } = require('../db/connection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all cards with availability info
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const cards = db.prepare('SELECT * FROM cards ORDER BY name').all();

    // For each card, get allocation info
    const cardsWithAllocation = cards.map(card => {
      const allocations = db.prepare(`
        SELECT 
          d.name as deck_name,
          u.username,
          dc.quantity,
          d.locked
        FROM deck_cards dc
        JOIN decks d ON dc.deck_id = d.id
        JOIN users u ON d.user_id = u.id
        WHERE dc.card_id = ? AND d.locked = 1
        ORDER BY u.username
      `).all(card.id);

      return {
        ...card,
        allocations
      };
    });

    res.json({ cards: cardsWithAllocation });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific card with availability
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get allocation info
    const allocations = db.prepare(`
      SELECT 
        d.name as deck_name,
        u.username,
        dc.quantity,
        d.locked
      FROM deck_cards dc
      JOIN decks d ON dc.deck_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE dc.card_id = ? AND d.locked = 1
      ORDER BY u.username
    `).all(card.id);

    res.json({ 
      card: {
        ...card,
        allocations
      }
    });
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new card (admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, quantity } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Card name is required' });
    }

    const db = getDb();

    // Check if card already exists
    const existing = db.prepare('SELECT id FROM cards WHERE name = ?').get(name);
    if (existing) {
      return res.status(400).json({ error: 'Card already exists' });
    }

    const qty = parseInt(quantity) || 0;
    const result = db.prepare(
      'INSERT INTO cards (name, quantity_total, quantity_available) VALUES (?, ?, ?)'
    ).run(name, qty, qty);

    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Card added successfully',
      card
    });
  } catch (error) {
    console.error('Add card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update card quantity (admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { quantity_total } = req.body;
    const db = getDb();

    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const newTotal = parseInt(quantity_total);
    if (isNaN(newTotal) || newTotal < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    // Calculate new available quantity
    const allocated = card.quantity_total - card.quantity_available;
    const newAvailable = newTotal - allocated;

    if (newAvailable < 0) {
      return res.status(400).json({ 
        error: `Cannot set total to ${newTotal}. ${allocated} cards are currently allocated.` 
      });
    }

    db.prepare(
      'UPDATE cards SET quantity_total = ?, quantity_available = ? WHERE id = ?'
    ).run(newTotal, newAvailable, req.params.id);

    const updatedCard = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);

    res.json({
      message: 'Card updated successfully',
      card: updatedCard
    });
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete card (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDb();

    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Check if card is in use
    const inUse = db.prepare(
      'SELECT COUNT(*) as count FROM deck_cards WHERE card_id = ?'
    ).get(req.params.id);

    if (inUse.count > 0) {
      return res.status(400).json({ error: 'Cannot delete card that is in use in decks' });
    }

    db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
