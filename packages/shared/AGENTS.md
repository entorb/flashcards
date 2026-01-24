# Shared Package

Common types, utilities, components, and services for flashcards apps (1x1, voc, lwk).

## Directory Structure

```text
src/
├── components/          # Shared Vue components
├── composables/         # Shared Vue composables
├── pages/               # Shared Vue pages
├── services/storage.ts  # localStorage/sessionStorage utilities
├── utils/               # Helper functions
├── constants.ts         # Shared constants
├── types.ts             # Shared type definitions
└── text-de.ts           # German i18n strings
```

## Key Types

```typescript
interface BaseGameHistory {
  date: string
  points: number
  correctAnswers: number
}

interface BaseCard {
  level: number // 1-5
}

interface GameStats {
  gamesPlayed: number
  points: number
  correctAnswers: number
}

interface GameState<T = BaseCard> {
  cards: T[]
  currentCardIndex: number
  points: number
  correctAnswers: number
  startTime: number
}

type FocusType = 'weak' | 'medium' | 'strong' | 'slow'
type AnswerResult = 'correct' | 'incorrect' | 'close'
```

## Key Functions

### Storage Operations

- `loadJSON<T>(key, fallback)` / `saveJSON<T>(key, data)` — localStorage
- `loadSessionJSON<T>(key, fallback)` / `saveSessionJSON<T>(key, data)` — sessionStorage
- `createHistoryOperations<T>(storageKey)` → `{ load(), save(), add() }`
- `createStatsOperations<T>(storageKey, defaultStats)` → `{ load(), save(), update() }`
- `createAppGameStorage(resultKey, gameStateKey, dailyStatsKey)` → `{ setGameResult, getGameResult, clearGameResult, incrementDailyGames, clearGameState }`
- `incrementDailyGames(key)` → `{ isFirstGame, gamesPlayedToday }`

### Game State Flow

```typescript
interface GameStateFlowConfig {
  settingsKey: string      // localStorage: game settings
  selectedCardsKey: string // sessionStorage: cards for this game
  gameResultKey: string    // sessionStorage: game result/stats
  historyKey: string       // localStorage: all past games
  statsKey: string         // localStorage: aggregate statistics
  dailyStatsKey: string    // localStorage: daily bonus tracking
}

// HomePage: Initialize game
initializeGameFlow<TSettings, TCard>(config, settings, selectedCards): void

// GamePage: Get/manage cards during gameplay
getGameCards<TCard>(config): TCard[]
removeCardFromGame(config, cardIndex): void
updateGameStats(config, points, correctAnswers, totalCards): void

// GameOverPage: Transfer results with bonuses
transferGameResultsWithBonuses<THistory>(config, bonusConfig, historyEntry, saveHistoryFn, saveStatsFn): { bonusPoints, totalPoints, dailyInfo }

// Cleanup
clearGameSessionData(config): void
getLastGameSettings<TSettings>(config, fallback): TSettings
```

### Game Store

```typescript
createBaseGameStore<TCard, THistory, TSettings>(config: {
  loadCards: () => TCard[]
  loadHistory: () => THistory[]
  saveHistory: (history: THistory[]) => void
  loadGameStats: () => GameStats
  saveGameStats: (stats: GameStats) => void
  saveCards?: (cards: TCard[]) => void
})
```

### Timer

```typescript
useGameTimer(trigger: Ref<any>, maxTime?: number)
// Returns: { elapsedTime, stopTimer, startTimer }
```

## Exports

**Main exports** (`src/index.ts`):

```typescript
export * from './utils/helper.js'
export * from './test-utils.js'
export { TEXT_DE } from './text-de.js'
export * from './types.js'
export * from './constants.js'
export * from './services/storage.js'
export * from './composables/useBaseGameStore.js'
export * from './composables/useGameTimer.js'
// ... and other composables
```

**Component exports** (`./components`):

```typescript
export { default as AppFooter } from './AppFooter.vue'
export { default as AnswerFeedback } from './AnswerFeedback.vue'
// ... etc
```

**Page exports** (`./pages`):

```typescript
export { default as HistoryPage } from './HistoryPage.vue'
export { default as GameOverPage } from './GameOverPage.vue'
```

## Storage Scoping

- **localStorage** (persistent):
  - `{app}-cards` — Card list with learned progress
  - `{app}-history` — Array of all past games
  - `{app}-stats` — Aggregate statistics
  - `{app}-settings` — Last used game settings
  - `{app}-daily-stats` — Daily bonus tracking

- **sessionStorage** (temporary):
  - `{app}-selected-cards` — Cards for current game
  - `{app}-game-result` — Current game result

## Critical Rules

- Apps extend `BaseCard` and `BaseGameHistory` with app-specific fields
- No parallel sessions: Each app handles one game at a time
- Card progress saved immediately after each answer
- Game results saved atomically (history + stats together)
- localStorage scoped per app via prefixed keys
