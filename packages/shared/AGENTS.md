# Shared Package

The shared package (`@flashcards/shared`) provides common types, utilities, components, and services used across all apps in the monorepo (1x1 and voc). It eliminates code duplication and ensures consistency.

**Key Technologies:** Vue.js 3, TypeScript, pnpm, Vite 6.x, Vitest

## Directory Structure

```text
src/
├── components/          # Shared Vue components
│   ├── AnswerFeedback.vue
│   ├── AppFooter.vue
│   ├── FocusSelector.vue
│   ├── LevelDistribution.vue
│   ├── PwaInstallInfo.vue
│   ├── StatisticsCard.vue
│   └── index.ts
├── composables/         # Shared Vue composables
│   ├── useAnswerFeedback.ts
│   ├── useBaseGameStore.ts
│   ├── useCardFiltering.ts
│   ├── useCountdownTimer.ts
│   ├── useFeedbackTimers.ts
│   ├── useGameTimer.ts
│   ├── useKeyboardContinue.ts
│   └── useResetCards.ts
├── pages/               # Shared Vue pages
│   ├── GameOverPage.vue
│   ├── HistoryPage.vue
│   └── index.ts
├── services/
│   └── storage.ts       # localStorage/sessionStorage utilities
├── utils/
│   ├── cardSelection.ts # Card selection algorithms
│   ├── helper.ts        # Helper functions
│   └── index.ts
├── constants.ts         # Shared constants
├── index.ts             # Main exports
├── test-utils.ts        # Test utilities
├── text-de.ts           # German i18n strings
└── types.ts             # Shared type definitions
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

**Design note:** Apps extend `BaseCard` and `BaseGameHistory` with app-specific fields.

## Key Functions

### Storage Operations (`services/storage.ts`)

- `loadJSON<T>(key, fallback)` / `saveJSON<T>(key, data)`
- `createHistoryOperations<T>(storageKey)` → `{ load(), save(), add() }`
- `createStatsOperations<T>(storageKey, defaultStats)` → `{ load(), save(), update() }`
- `createGamePersistence<TSettings, TState>(settingsKey, stateKey)` → sessionStorage helpers

### Game Store (`composables/useBaseGameStore.ts`)

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

### Timer (`composables/useGameTimer.ts`)

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

## Usage Examples

```typescript
// Main imports
import { createBaseGameStore, useGameTimer, TEXT_DE } from '@flashcards/shared'

// Component imports
import { AppFooter, AnswerFeedback } from '@flashcards/shared/components'

// Page imports
import { HistoryPage } from '@flashcards/shared/pages'
```

## Important Notes

- Workspace package, not published to npm
- Build order: `packages/shared` → `apps/*`
- No circular dependencies
- Type definitions are the contract
- localStorage scoped per app via prefixed keys
- Daily stats tracked separately per app

## See Also

- **[Root AGENTS.md](../AGENTS.md)** - Monorepo overview
- **[apps/1x1/AGENTS.md](../apps/1x1/AGENTS.md)** - Multiplication app details
- **[apps/voc/AGENTS.md](../apps/voc/AGENTS.md)** - Vocabulary app details
- **[apps/lwk/AGENTS.md](../apps/lwk/AGENTS.md)** - Spelling app details
