# MTG Noob Tournament Management System

A full-stack web application for managing Magic: The Gathering tournaments with card collection tracking, user authentication, and deck building capabilities.

## 🎮 Features

### Tournament Management
- Generate Single Elimination and Round Robin tournaments
- View tournament brackets and match results
- Track player and deck performance with leaderboards
- Archive completed tournaments for historical reference

### Card Collection Management
- Browse and search through the entire card collection (7,000+ cards supported)
- Track total quantity and available quantity for each card
- View real-time card allocation status
- See which players are using which cards
- Admin controls for adding/editing card quantities

### Deck Builder
- Authenticated users can create and manage multiple decks
- Browse available cards with real-time availability updates
- Add cards to decks with quantity controls
- Lock decks for tournament entry (allocates cards)
- Unlock decks to return cards to the collection
- Prevents editing locked decks for active tournaments

### User Authentication
- Secure user registration and login (JWT-based)
- Password hashing with bcrypt (10+ rounds)
- Role-based access control (admin/regular users)
- Session persistence across page reloads

### Archive System
- View all previously completed tournaments
- Browse final standings and statistics
- View complete match history and results
- Explore tiebreaker information

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/glholland/MTGNoobTourny.git
cd MTGNoobTourny
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and update the following:
- `JWT_SECRET` - Change to a strong random string
- `SESSION_SECRET` - Change to a strong random string
- `ADMIN_USERNAME` - Set your desired admin username
- `ADMIN_PASSWORD` - Set your desired admin password

4. **Initialize the database**
```bash
npm run init-db
```

5. **Seed the database with sample data**
```bash
npm run seed-db
```

This will:
- Create an admin user with credentials from `.env`
- Import the tournament from `tournament_data.json` as an archived tournament
- Add 15 sample MTG cards to the collection

6. **Start the server**
```bash
npm start
```

The application will be available at `http://localhost:3000`

For development with auto-restart:
```bash
npm run dev
```

## 📖 Usage

### First Login

After seeding the database, you can log in with:
- **Username:** admin (or the username you set in `.env`)
- **Password:** admin123 (or the password you set in `.env`)

⚠️ **Important:** Change the admin password after first login!

### Creating a Tournament

1. Go to the **Generate** tab
2. Add players (one per line)
3. Add decks (one per line)
4. Select tournament type (Single Elimination or Round Robin)
5. Click **Generate Tournament**

### Building a Deck

1. Log in to your account
2. Go to the **Deck Builder** tab
3. Click **Create New Deck**
4. Give your deck a name
5. Browse available cards and add them to your deck
6. Click **Save Deck**
7. Once ready, click **Lock In** to allocate cards for tournament use

### Managing Card Collection (Admin Only)

1. Log in as an admin user
2. Go to the **Card Collection** tab
3. Click **Add New Card** to add cards
4. Click **Edit** next to any card to update quantities
5. Use the search box to filter cards

### Viewing Archived Tournaments

1. Go to the **Archive** tab
2. Browse the list of completed tournaments
3. Click **View Details** on any tournament to see:
   - Final standings
   - Complete match history
   - Player and deck statistics

## 🏗️ Architecture

### Backend (Node.js + Express)

```
MTGNoobTourny/
├── server.js           # Express server entry point
├── routes/             # API route handlers
│   ├── auth.js        # Authentication endpoints
│   ├── tournaments.js # Tournament CRUD
│   ├── cards.js       # Card management
│   ├── decks.js       # Deck builder
│   └── players.js     # Player management
├── middleware/         # Express middleware
│   └── auth.js        # JWT authentication
├── utils/             # Utility functions
│   └── jwt.js         # JWT token management
├── db/                # Database
│   └── connection.js  # SQLite connection
└── scripts/           # Database scripts
    ├── initDb.js      # Schema initialization
    └── seedDb.js      # Data seeding
```

### Frontend (Vanilla JavaScript)

```
MTGNoobTourny/
├── index.html         # Main HTML file
├── css/
│   └── styles.css     # Application styles
└── js/
    ├── api.js         # API client & auth state
    ├── state.js       # Tournament state management
    ├── ui.js          # UI rendering functions
    ├── main.js        # Application initialization
    ├── generate.js    # Tournament generation logic
    ├── archive.js     # Archive tab functionality
    ├── cardCollection.js  # Card collection tab
    ├── deckBuilder.js     # Deck builder tab
    ├── tiebreakers.js     # Tiebreaker logic
    └── importExport.js    # Import/export features
```

### Database Schema (SQLite)

- **users** - User accounts with hashed passwords
- **tournaments** - Tournament metadata and JSON data
- **cards** - Card collection with quantities
- **decks** - User-created decks
- **deck_cards** - Junction table for cards in decks
- **players** - Tournament participants

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout (client-side)
- `GET /api/auth/me` - Get current user info (requires auth)

### Tournaments
- `GET /api/tournaments` - Get all active tournaments
- `GET /api/tournaments/archived` - Get archived tournaments
- `GET /api/tournaments/:id` - Get specific tournament
- `POST /api/tournaments` - Create tournament (admin only)
- `PUT /api/tournaments/:id` - Update tournament (admin only)
- `POST /api/tournaments/:id/archive` - Archive tournament (admin only)
- `DELETE /api/tournaments/:id` - Delete tournament (admin only)

### Cards
- `GET /api/cards` - Get all cards with availability
- `GET /api/cards/:id` - Get specific card
- `POST /api/cards` - Add new card (admin only)
- `PUT /api/cards/:id` - Update card quantity (admin only)
- `DELETE /api/cards/:id` - Delete card (admin only)

### Decks
- `GET /api/decks` - Get user's decks (requires auth)
- `GET /api/decks/:id` - Get specific deck (requires auth)
- `POST /api/decks` - Create deck (requires auth)
- `PUT /api/decks/:id` - Update deck (requires auth, owner only)
- `DELETE /api/decks/:id` - Delete deck (requires auth, owner only)
- `POST /api/decks/:id/lock` - Lock deck for tournament (requires auth)
- `POST /api/decks/:id/unlock` - Unlock deck (requires auth)

### Players
- `GET /api/players` - Get all players
- `POST /api/players` - Create player (requires auth)
- `PUT /api/players/:id` - Update player (admin only)
- `DELETE /api/players/:id` - Delete player (admin only)

## 🔒 Security Features

- **Password Hashing:** bcrypt with 10+ salt rounds
- **JWT Authentication:** Tokens with configurable expiration
- **Route Protection:** Middleware for authenticated and admin-only routes
- **Input Validation:** Server-side validation on all inputs
- **CORS Configuration:** Proper cross-origin resource sharing setup
- **SQL Injection Prevention:** Parameterized queries with better-sqlite3
- **XSS Prevention:** Input sanitization on both client and server

## 🧪 Testing

### Test Authentication
```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Test Card Collection
```bash
# Get all cards
curl http://localhost:3000/api/cards

# Get specific card
curl http://localhost:3000/api/cards/1
```

### Test Tournaments
```bash
# Get archived tournaments
curl http://localhost:3000/api/tournaments/archived
```

## 📝 Notes

### Data Persistence
- Tournament state is stored in SQLite database
- Database file: `tournament.db` (created automatically)
- Existing localStorage functionality preserved for backward compatibility

### Card Allocation
- Cards are allocated when a deck is "locked"
- Locked decks cannot be edited if the tournament is active
- Unlocking a deck returns all cards to the collection
- Card availability is updated in real-time

### Tournament Types
- **Single Elimination:** Classic bracket tournament
- **Round Robin:** Every player faces every other player once
- **Double Elimination:** Partially supported (UI may need updates)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 🐛 Known Issues

- Double Elimination tournaments are not fully supported in the UI
- Large card collections (7,000+) may take a moment to load initially
- Mobile responsiveness could be improved for smaller screens

## 🚧 Future Enhancements

- [ ] Swiss-system tournament support
- [ ] Real-time tournament updates with WebSockets
- [ ] Card database integration with Scryfall API
- [ ] Deck validation rules (minimum/maximum cards)
- [ ] Tournament scheduling and notifications
- [ ] Player profiles and statistics tracking
- [ ] Export tournament results to PDF
- [ ] Mobile app version
- [ ] Multiplayer pod support for Commander format

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ for the MTG community
