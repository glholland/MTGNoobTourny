# Tournament Bracket Generator - React Version

A modern, React-based tournament bracket generator for MTG tournaments.

## Features

- **Add Players and Decks**: Easily manage participants and their decks
- **Multiple Tournament Types**: 
  - Single Elimination
  - Round Robin
  - Double Elimination (not fully supported)
- **Smart Deck Assignment**: Automatically assigns decks to players ensuring no duplicate deck in the same round
- **BYE Handling**: Proper handling of BYE players when there's an odd number of participants
- **Winner Tracking**: Click to select winners and track results
- **Player View**: See all matches for a specific player
- **Leaderboards**: Real-time leaderboards for both players and decks
- **Tiebreakers**: Generate tiebreaker matches for 1st/2nd/3rd place
- **Import/Export**: Save and load tournament state as JSON

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

The production build will be in the `dist` folder and can be deployed to any static hosting service.

### Production Build

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Technology Stack

- **React 18**: Modern UI library with hooks
- **Vite**: Fast build tool and dev server
- **CSS3**: Modern styling with dark/light mode support

## Project Structure

```
react-app/
├── src/
│   ├── App.jsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.jsx             # Application entry point
│   └── utils/
│       └── tournamentUtils.js  # Tournament logic utilities
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
└── vite.config.js           # Vite configuration
```

## License

MIT
