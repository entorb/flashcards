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
type AnswerStatus = 'correct' | 'incorrect' | 'close'
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

## Unit Test Infrastructure

### Setup files

- `src/__tests__/setup.ts` — installs `LocalStorageMock`, `matchMedia` mock, suppresses Vue lifecycle warnings
- `src/__tests__/testUtils.ts` — exports `quasarStubs`, `quasarMocks`, `quasarProvide`
- Referenced automatically via `vitest.config.base.ts` → `setupFiles: ['./src/__tests__/setup.ts']`

### dist/ exclusion

The `packages/shared/vitest.config.ts` explicitly excludes `dist/**` to prevent compiled `.spec.js` files from running as duplicate tests:

```typescript
export default defineConfig(
  mergeConfig(getVitestConfig(import.meta.url), {
    test: { exclude: ['dist/**', 'e2e/**', 'node_modules/'] }
  })
)
```

### Fast mocking patterns

Use `vi.mock('quasar', () => ({ useQuasar: () => ({ ... }) }))` — **no `importOriginal`** — for quasar mocks. The `importOriginal` pattern imports the full Quasar bundle and is ~300ms slower per spec file.

For `../utils/helper` (which has `helperStatsDataRead/Write`), `importOriginal` is still needed to preserve the rest of the module.

### v-ripple directive warning

Add `directives: { ripple: {} }` to mount options for components using `v-ripple` (e.g. HistoryPage):

```typescript
global: { ..., directives: { ripple: {} } }
```

### PBT round-trip test for JSON storage

`fc.jsonValue({ noNegativeZero: true })` does NOT recursively exclude `-0` from nested object values. Use `JSON.parse(JSON.stringify(value))` as the expected value instead:

```typescript
expect(loaded).toEqual(JSON.parse(JSON.stringify(value)))
```

### Typed mock return values — avoid narrow inference

When a `vi.fn()` mock is initialized with a literal, TypeScript infers a narrow type.
Later `.mockReturnValue(...)` calls with a wider type will fail `vue-tsc`.

**Fix:** Use the generic overload to declare the full return type upfront:

```typescript
// ❌ Inferred as () => { mode: 'copy'; ... } — too narrow
loadSettings: vi.fn(() => ({ mode: 'copy' as const, ... }))

// ✅ Explicit union type
loadSettings: vi.fn<() => GameSettings | null>(() => ({ mode: 'copy', ... }))
```

### mock.calls tuple index access

`vi.fn()` without explicit parameter types gives `mock.calls` the type `[][]`.
Accessing `mock.calls[0]?.[0] as T` causes TS2493 under `vue-tsc`.

**Fix:** Cast via `unknown`:

```typescript
// ❌ TS2493
const arg = mockFn.mock.calls[0]?.[0] as string

// ✅
const arg = (mockFn.mock.calls[0] as unknown as [string])[0]
```

### Inline arrow functions in Vue templates — implicit any

`:prop="x => fn(x)"` in templates causes `TS7006` under `vue-tsc`.
Extract to a named function in `<script setup>` with explicit parameter types.
