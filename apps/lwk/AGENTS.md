# Eisi's Lernwörter Spelling Trainer (lwk)

Developer summary and implementation notes for the spelling practice app for pupils in grades 2-4.

## Overview

A Progressive Web App (PWA) featuring Eisi the ice bear mascot that helps children practice spelling through gamified learning with adaptive difficulty and custom word decks.

## Quick Facts

- `BASE_PATH = 'fc-lwk'` (src/constants.ts)
- MAX_CARDS_PER_GAME: `10`
- Word display duration in hidden mode: `WORD_DISPLAY_DURATION = 3` seconds
- Close match scoring: `CLOSE_MATCH_SCORE_PERCENTAGE = 0.75`

## Features

- **Two Learning Modes**: "Abschreiben" (copying) and "Verdeckt" (hidden)
- **Adaptive Difficulty**: 5-level system that adjusts based on performance
- **Focus Settings**: Weak (harder cards), Medium (balanced), Strong (easier cards), Slow (cards with longer times)
- **Time Tracking & Bonuses**: Rewards for beating personal records
- **Custom Word Decks**: Organize words into themed "Kisten" (boxes), with deck management
- **Cute Mascot**: Eisi provides encouraging feedback
- **PWA Support**: Install as native app on devices
- **Offline Ready**: Works without internet connection

## Data Model

```typescript
interface Card {
  word: string // The spelling word
  level: number // 1-5 adaptive difficulty
  time: number // Best time record (0.1-60s, default 60)
}

interface CardDeck {
  name: string // Unique deck name ("Kiste")
  cards: Card[]
}

type GameMode = 'copy' | 'hidden'

interface GameSettings {
  mode: GameMode
  focus: 'weak' | 'medium' | 'strong' | 'slow'
  deck?: string // Optional deck name
}
```

### Default Decks

One default deck named "Lernwörter_1" containing words: Haus, Schule, Wald, Mathe, Deutsch, Sport, Musik

## Game Mechanics

### Game Modes

**Abschreiben (Copying):**

- Word remains visible while typing
- Available for cards with level < 3 only
- Focus on accuracy over speed

**Verdeckt (Hidden):**

- Click "OK" to show word for 3 seconds
- Word then hides with countdown timer
- Type from memory
- Close match (1 character difference) = 75% points
- Time bonus: +5 points if faster than personal record

### Card Selection

Cards are selected based on **Focus** settings:

- **Weak**: Prioritizes lower-level cards (harder/more practice needed)
- **Medium**: Balanced selection across all levels
- **Strong**: Prioritizes higher-level cards (mastered)
- **Slow**: Prioritizes cards with longer personal best times

### Scoring System

- **Correct Answer**: +(6 - current_level) points, level increases by 1
- **Incorrect Answer**: 0 points, level decreases by 1
- **Close Match** (Verdeckt only): 75% points, level stays the same
- **Time Bonus** (Verdeckt only): +5 points if beating record time
- **Daily Bonuses**:
  - First game of the day: +5 points
  - Every 5th game: +5 points

### Adaptive Learning

- **Levels**: 1-5 (1 = hardest/most practice needed, 5 = mastered)
- **Level Changes**:
  - Correct: level +1 (max 5)
  - Incorrect: level -1 (min 1)
  - Close match: no change
- **Mode Restrictions**: Only level 1-2 cards available in "Abschreiben" mode

## Architecture

**Tech Stack:** Vue 3, Quasar, TypeScript (strict), Vite 6.x, Vitest, Cypress, ESLint, Prettier, pnpm workspaces, PWA

### Pages

| Page              | Route        | Purpose                                   |
| ----------------- | ------------ | ----------------------------------------- |
| **HomePage**      | `/`          | Deck + mode selection, start game         |
| **GamePage**      | `/game`      | Play flashcard game (up to 10 cards)      |
| **GameOverPage**  | `/game-over` | Results, mascot feedback, bonuses         |
| **InfoPage**      | `/info`      | Scoring rules, close match, time bonus    |
| **CardsPage**     | `/cards`     | Deck management, card CRUD, import/export |
| **DecksEditPage** | `/decks`     | Deck management (add, remove, rename)     |
| **HistoryPage**   | `/history`   | Past games, statistics                    |

### Components

- **EisiMascot.vue** - Ice bear mascot with feedback animations
- Reuses from shared: AnswerFeedback, AppFooter, FocusSelector, StatisticsCard

### Storage Keys

```typescript
'lwk-decks' // CardDeck[] - Word decks
'lwk-history' // GameHistory[] - Game history
'lwk-stats' // GameStats - Overall statistics
'lwk-game-config' // GameSettings (sessionStorage)
'lwk-game-state' // GameState (sessionStorage)
'lwk-game-result' // GameHistory (sessionStorage)
'lwk-last-settings' // GameSettings - Last used settings
'lwk-daily-stats' // DailyStats - Daily bonuses tracking
```

## Key Files

- `src/constants.ts` — `BASE_PATH`, `MAX_CARDS_PER_GAME`, `WORD_DISPLAY_DURATION`, `CLOSE_MATCH_SCORE_PERCENTAGE`
- `src/services/storage.ts` — localStorage/sessionStorage operations
- `src/composables/useGameStore.ts` — game state management and deck operations

## Testing

- **Unit Tests**: Vitest for component and logic testing
- **E2E Tests**: Cypress for full game flow testing
- **Test Coverage**: Focus on scoring logic, adaptive learning, and game state management

## Commands

```bash
pnpm dev:lwk         # Development server
pnpm build:lwk       # Production build
pnpm run cy:run:lwk  # E2E tests
```

## Notes & Gotchas

- **Text Localization**: All UI text in `packages/shared/src/text-de.ts` under `TEXT_DE.lwk.*`
- **Storage Prefix**: All keys prefixed with `lwk-`
- **Case Sensitivity**: Spelling checks are case-sensitive
- **Close Match Detection**: Levenshtein distance = 1 (exactly 1 character difference)
- **Time Tracking**: 0.1-60 seconds, rounded to 1 decimal place
- **Game Length**: Maximum 10 cards per session
- **Mode Availability**: "Abschreiben" only for levels 1-2

## See Also

- **[Root AGENTS.md](../../AGENTS.md)** - Monorepo overview
- **[Shared AGENTS.md](../../packages/shared/AGENTS.md)** - Shared code docs
