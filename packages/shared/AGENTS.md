# Shared Package (`@flashcards/shared`)

Common types, utilities, components, composables, services, and pages for flashcards apps.

## Export Paths

```typescript
import { TEXT_DE, MIN_LEVEL, MAX_LEVEL } from '@flashcards/shared'
import { AppFooter, GameAnswerFeedback } from '@flashcards/shared/components'
import { HistoryPage, GameOverPage } from '@flashcards/shared/pages'
import { MainLayout } from '@flashcards/shared/layouts'
import { cardSelection } from '@flashcards/shared/utils'
import { quasarStubs, quasarMocks } from '@flashcards/shared/test-utils'
```

## Directory Structure

```text
src/
├── components/           # Shared Vue components (17+)
├── composables/          # Shared composables (10)
├── layouts/              # App layouts
├── pages/                # Shared pages (4)
├── services/
│   ├── storage.ts        # localStorage/sessionStorage CRUD
│   └── scoring.ts        # Points calculation
├── utils/
│   ├── cardSelection.ts  # Weighted card selection by focus
│   ├── gameModeUtils.ts  # Endless/3-rounds mode logic
│   └── helper.ts         # General helpers
├── constants.ts          # MIN/MAX_LEVEL, colors, bonuses
├── types.ts              # BaseCard, GameStats, SessionMode, FocusType
├── text-de.ts            # All German UI strings
├── test-utils.ts         # quasarStubs, quasarMocks, quasarProvide
└── __tests__/setup.ts    # Test setup (localStorage mock, matchMedia)
```

## Key Types

```typescript
interface BaseCard {
  level: number
  time: number
} // Apps extend this
interface BaseGameHistory {
  date: string
  points: number
  correctAnswers: number
}
interface GameStats {
  correctAnswers: number
  gamesPlayed: number
  points: number
}
interface GameState<T = BaseCard> {
  cards: T[]
  currentCardIndex: number
  points: number
  correctAnswers: number
  startTime: number
}
interface GameResult {
  points: number
  correctAnswers: number
  totalCards: number
}
interface DailyStats {
  date: string
  gamesPlayed: number
}
type FocusType = 'weak' | 'medium' | 'strong' | 'slow'
type AnswerStatus = 'correct' | 'incorrect' | 'close'
type SessionMode = 'standard' | 'endless-level1' | 'endless-level5' | '3-rounds'
```

## Composables

| Composable            | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `useBaseGameStore`    | Game state factory (cards, scoring, navigation)                      |
| `useGameStateFlow`    | Full game flow: HomePage init → GamePage play → GameOverPage results |
| `useGameTimer`        | Elapsed time tracking with start/stop                                |
| `useAnswerFeedback`   | Answer status display + button disable timing                        |
| `useCountdownTimer`   | Countdown timer (e.g., hidden mode word display)                     |
| `useKeyboardContinue` | Enter/Space key listener for "continue" actions                      |
| `useCardFiltering`    | Filter cards by level/mode for button states                         |
| `useGameNavigation`   | Router navigation helpers for game flow                              |
| `useResetCards`       | Reset all card levels to 1                                           |
| `useDeckManagement`   | CRUD operations for card decks (voc, lwk)                            |

## Services

**storage.ts**: `loadJSON()`, `saveJSON()`, `loadSessionJSON()`, `saveSessionJSON()`, `createHistoryOperations()`, `createStatsOperations()`, `createAppGameStorage()`, `incrementDailyGames()`

**scoring.ts**: Points calculation with level/mode/time factors.

## Pages

`HistoryPage`, `GameOverPage`, `DecksEditPage`, `InfoPage`

## Components

`AppFooter`, `CardManActions`, `CardsListOfCards`, `CardsManLevelDistribution`, `CardsManPage`, `GameAnswerFeedback`, `GameFeedbackNegative`, `GameHeader`, `GameInputSubmit`, `GameNextCardButton`, `GamePointsBreakdown`, `GameShowCardQuestion`, `HomeDeckSelector`, `HomeFocusSelector`, `HomePageLayout`, `HomePwaInstallInfo`, `HomeStatisticsCard`

## Unit Test Patterns

**Test setup**: `src/__tests__/setup.ts` installs `LocalStorageMock`, `matchMedia` mock, suppresses Vue lifecycle warnings. Auto-loaded via `vitest.config.base.ts`.

**Quasar mocks** — use `vi.mock('quasar', () => ({ ... }))` without `importOriginal` (saves ~300ms per spec). Exception: `../utils/helper` needs `importOriginal`.

**v-ripple directive**: Add `directives: { ripple: {} }` to mount options for components using `v-ripple`.

**Stub by alias**: When a component is imported as `import FoxIcon from './FoxMascot.vue'`, stub key must be `FoxIcon` (the alias), not `FoxMascot` (the filename).

**Typed mock return values**: Use generic overload to avoid narrow type inference:

```typescript
// ✅ Explicit type
loadSettings: vi.fn<() => GameSettings | null>(() => ({ mode: 'copy', ... }))
```

**mock.calls access**: Cast via `unknown` to avoid TS2493:

```typescript
const arg = (mockFn.mock.calls[0] as unknown as [string])[0]
```

**Inline arrow in templates**: Extract `:prop="x => fn(x)"` to a named function with explicit types to avoid TS7006.

**PBT JSON round-trip**: Use `JSON.parse(JSON.stringify(value))` as expected (not raw value) because `fc.jsonValue` doesn't recursively exclude `-0`.

**dist/ exclusion**: `packages/shared/vitest.config.ts` excludes `dist/**` to prevent duplicate test runs from compiled `.spec.js`.

**helperStatsDataWrite hostname guard**: Tests for `helperStatsDataWrite` must stub `globalThis.location` with `{ hostname: PROD_HOSTNAME }` in `beforeEach`. The function early-returns when `hostname !== PROD_HOSTNAME`, and jsdom sets it to `"localhost"` by default.
