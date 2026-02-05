const express = require('express');
const { getDb } = require('../db/connection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all players
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const players = db.prepare(`
      SELECT p.*, u.username
      FROM players p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.name
    `).all();

    res.json({ players });
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific player
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const player = db.prepare(`
      SELECT p.*, u.username
      FROM players p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({ player });
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new player
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, user_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const db = getDb();

    const result = db.prepare(
      'INSERT INTO players (name, user_id) VALUES (?, ?)'
    ).run(name, user_id || null);

    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Player created successfully',
      player
    });
  } catch (error) {
    console.error('Create player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update player
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, user_id } = req.body;
    const db = getDb();

    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    db.prepare(
      'UPDATE players SET name = ?, user_id = ? WHERE id = ?'
    ).run(name || player.name, user_id !== undefined ? user_id : player.user_id, req.params.id);

    const updatedPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);

    res.json({
      message: 'Player updated successfully',
      player: updatedPlayer
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete player
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDb();

    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);

    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
