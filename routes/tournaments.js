const express = require('express');
const { getDb } = require('../db/connection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all active tournaments
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const tournaments = db.prepare(
      'SELECT * FROM tournaments WHERE status = ? ORDER BY created_at DESC'
    ).all('active');

    // Parse JSON data for each tournament
    const parsedTournaments = tournaments.map(t => ({
      ...t,
      data: t.data ? JSON.parse(t.data) : null
    }));

    res.json({ tournaments: parsedTournaments });
  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get archived tournaments
router.get('/archived', (req, res) => {
  try {
    const db = getDb();
    const tournaments = db.prepare(
      'SELECT * FROM tournaments WHERE status = ? ORDER BY date DESC'
    ).all('archived');

    // Parse JSON data for each tournament
    const parsedTournaments = tournaments.map(t => ({
      ...t,
      data: t.data ? JSON.parse(t.data) : null
    }));

    res.json({ tournaments: parsedTournaments });
  } catch (error) {
    console.error('Get archived tournaments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific tournament
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Parse JSON data
    tournament.data = tournament.data ? JSON.parse(tournament.data) : null;

    res.json({ tournament });
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new tournament
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, date, type, data } = req.body;

    if (!name || !date || !type) {
      return res.status(400).json({ error: 'Name, date, and type are required' });
    }

    const db = getDb();
    const dataStr = data ? JSON.stringify(data) : null;

    const result = db.prepare(
      'INSERT INTO tournaments (name, date, type, status, data) VALUES (?, ?, ?, ?, ?)'
    ).run(name, date, type, 'active', dataStr);

    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(result.lastInsertRowid);
    tournament.data = tournament.data ? JSON.parse(tournament.data) : null;

    res.status(201).json({
      message: 'Tournament created successfully',
      tournament
    });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update tournament
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, date, type, status, data } = req.body;
    const db = getDb();

    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const dataStr = data ? JSON.stringify(data) : tournament.data;

    db.prepare(
      'UPDATE tournaments SET name = ?, date = ?, type = ?, status = ?, data = ? WHERE id = ?'
    ).run(
      name || tournament.name,
      date || tournament.date,
      type || tournament.type,
      status || tournament.status,
      dataStr,
      req.params.id
    );

    const updatedTournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
    updatedTournament.data = updatedTournament.data ? JSON.parse(updatedTournament.data) : null;

    res.json({
      message: 'Tournament updated successfully',
      tournament: updatedTournament
    });
  } catch (error) {
    console.error('Update tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Archive tournament
router.post('/:id/archive', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDb();

    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    db.prepare('UPDATE tournaments SET status = ? WHERE id = ?').run('archived', req.params.id);

    res.json({ message: 'Tournament archived successfully' });
  } catch (error) {
    console.error('Archive tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete tournament
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDb();

    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    db.prepare('DELETE FROM tournaments WHERE id = ?').run(req.params.id);

    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
