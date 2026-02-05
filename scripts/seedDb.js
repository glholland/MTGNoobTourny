require('dotenv').config();
const { getDb } = require('../db/connection');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const SALT_ROUNDS = 10;

async function seedDatabase() {
  console.log('Seeding database...');
  const db = getDb();

  try {
    // Create admin user
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
    
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      db.prepare(
        'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)'
      ).run(adminUsername, passwordHash);
      console.log(`✓ Created admin user: ${adminUsername}`);
    } else {
      console.log('✓ Admin user already exists');
    }

    // Import tournament data from tournament_data.json
    const tournamentDataPath = path.join(__dirname, '..', 'tournament_data.json');
    
    if (fs.existsSync(tournamentDataPath)) {
      const tournamentData = JSON.parse(fs.readFileSync(tournamentDataPath, 'utf-8'));
      
      // Check if this tournament already exists
      const existingTournament = db.prepare(
        'SELECT id FROM tournaments WHERE name = ? AND status = ?'
      ).get('First Round Robin Tournament', 'archived');
      
      if (!existingTournament) {
        const result = db.prepare(
          'INSERT INTO tournaments (name, date, type, status, data) VALUES (?, ?, ?, ?, ?)'
        ).run(
          'First Round Robin Tournament',
          new Date().toISOString().split('T')[0],
          tournamentData.tournamentType || 'roundrobin',
          'archived',
          JSON.stringify(tournamentData)
        );
        console.log(`✓ Archived tournament from tournament_data.json (ID: ${result.lastInsertRowid})`);
      } else {
        console.log('✓ Tournament already archived');
      }
    } else {
      console.log('⚠ tournament_data.json not found, skipping tournament import');
    }

    // Seed some sample cards
    const sampleCards = [
      { name: 'Lightning Bolt', quantity: 20 },
      { name: 'Counterspell', quantity: 15 },
      { name: 'Giant Growth', quantity: 25 },
      { name: 'Dark Ritual', quantity: 12 },
      { name: 'Swords to Plowshares', quantity: 18 },
      { name: 'Llanowar Elves', quantity: 30 },
      { name: 'Brainstorm', quantity: 20 },
      { name: 'Path to Exile', quantity: 16 },
      { name: 'Doom Blade', quantity: 22 },
      { name: 'Rampant Growth', quantity: 24 },
      { name: 'Forest', quantity: 100 },
      { name: 'Island', quantity: 100 },
      { name: 'Mountain', quantity: 100 },
      { name: 'Plains', quantity: 100 },
      { name: 'Swamp', quantity: 100 }
    ];

    const existingCards = db.prepare('SELECT COUNT(*) as count FROM cards').get();
    
    if (existingCards.count === 0) {
      const insertCard = db.prepare(
        'INSERT INTO cards (name, quantity_total, quantity_available) VALUES (?, ?, ?)'
      );
      
      for (const card of sampleCards) {
        insertCard.run(card.name, card.quantity, card.quantity);
      }
      console.log(`✓ Added ${sampleCards.length} sample cards`);
    } else {
      console.log(`✓ ${existingCards.count} cards already in database`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`\nAdmin credentials:`);
    console.log(`  Username: ${adminUsername}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('\n⚠️  Please change the admin password after first login!\n');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
