# Eisi's Lernwörter - LWK App

Vue.js/Quasar spelling practice app for pupils in grades 2-4

## Overview

Educational spelling trainer featuring:

- **Two Modes:** "Abschreiben" (copying) and "Verdeckt" (hidden/memory)
- **Adaptive Difficulty:** 5-level system
- **Custom Decks:** Manageable word collections ("Kisten")
- **Mascot:** Eisi the ice bear provides encouragement
- **PWA:** Installable, offline-capable

**BASE_PATH:** `fc-lwk` (router base, storage keys, DB collection)
**Ports:** Dev 5175, Preview 4175

## Key Features

### Game Modes

**Abschreiben (Copying):**

- Word remains visible while typing
- For cards with level < 3 only
- Focus on accuracy

**Verdeckt (Hidden):**

- Word shown 3 seconds after "OK" click
- Then hidden with countdown
- Type from memory
- Close match (1 char off) = 75% points
- Time bonus: +5 points if faster than record

### Scoring

- **Correct:** +(6 - current_level) points, level up
- **Incorrect:** 0 points, level down
- **Close match (Verdeckt only):** 75% points, no level change
- **Time bonus (Verdeckt only):** +5 points if beating record time
- **Daily bonuses:**
  - First game: +5 points
  - Every 5th game: +5 points

### Data Model

```typescript
interface Card {
  word: string // The spelling word
  level: number // 1-5 adaptive difficulty
  time: number // Best time record (1-60s, default 60)
}

interface CardDeck {
  name: string // Unique deck name ("Kiste")
  cards: Card[]
}

type GameMode = 'copy' | 'hidden'
```

## Pages

| Page             | Route        | Purpose                                   |
| ---------------- | ------------ | ----------------------------------------- |
| **HomePage**     | `/`          | Deck + mode selection, start game         |
| **GamePage**     | `/game`      | Play flashcard game (up to 10 cards)      |
| **GameOverPage** | `/game-over` | Results, mascot feedback, bonuses         |
| **InfoPage**     | `/info`      | Scoring rules, close match, time bonus    |
| **CardsPage**    | `/cards`     | Deck management, card CRUD, import/export |
| **HistoryPage**  | `/history`   | Past games, statistics                    |

## Storage Keys

```typescript
'lwk-decks' // CardDeck[]
'lwk-history' // GameHistory[]
'lwk-stats' // GameStats
'lwk-game-config' // GameSettings (sessionStorage)
'lwk-game-result' // GameHistory (sessionStorage)
'lwk-daily-stats' // DailyStats
```

## Components

- **EisiMascot.vue** - Ice bear mascot with feedback
- **SpellingInput.vue** - Specialized input for word entry
- Reuse from shared: AnswerFeedback, AppFooter, StatisticsCard

## Critical Rules

- All text in `packages/shared/src/text-de.ts` under `TEXT_DE.lwk.*`
- Storage keys prefix: `lwk-`
- Case-sensitive spelling checks
- Close match detection: Levenshtein distance = 1
- Time tracking: 0.1-60 seconds, rounded to 1 decimal
- Game length: max 10 cards per session

## Tech Stack

Vue 3, Quasar, TypeScript (strict), Vite 6.x, Vitest, Cypress, ESLint, Prettier, pnpm workspaces, PWA

## Default Decks

Haus, Schule, Wald, Mathe, Deutsch, Sport, Musik

## See Also

- **[Root AGENTS.md](../../AGENTS.md)** - Monorepo overview
- **[Shared AGENTS.md](../../packages/shared/AGENTS.md)** - Shared code docs
