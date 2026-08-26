# Shared Package (`@flashcards/shared`)

Common types, utilities, components, composables, services, and pages for flashcards apps.

## Export Paths

```typescript
import { TEXT_DE, MIN_LEVEL, MAX_LEVEL, createGameStoreFactory, createDeckGameStore } from '@flashcards/shared'
import { AppFooter, GameAnswerFeedback } from '@flashcards/shared/components'
import { HistoryPage, GameOverPage, NumericGamePage } from '@flashcards/shared/pages'
import { cardSelection } from '@flashcards/shared/utils'
import { quasarStubs, quasarMocks } from '@flashcards/shared/test-utils'
```

## Directory Structure

```text
src/
├── components/           # Shared Vue components (21)
├── composables/          # Shared composables (12)
├── pages/                # Shared pages (6; CardsManPage is re-exported as a component)
├── services/
│   ├── storage.ts        # localStorage/sessionStorage CRUD
│   ├── appStorageFactory.ts # createAppStorageFactory (app storage adapters)
│   └── scoring.ts        # Points calculation
├── utils/
│   ├── cardSelection.ts  # Weighted card selection by focus
│   ├── gameModeUtils.ts  # Endless/3-rounds mode logic
│   ├── helper.ts         # General helpers
│   └── validators.ts     # Runtime type checks for storage loads (fallback to defaults)
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
  bonusesApplied?: boolean // GameOverPage idempotency guard
}
interface DailyStats {
  date: string
  gamesPlayed: number
}
type FocusType = 'weak' | 'slow' // 'medium'/'strong' commented out in types.ts
type AnswerStatus = 'correct' | 'incorrect' | 'close'
type SessionMode = 'standard' | 'endless-level1' | 'endless-level5' | '3-rounds'
```

## Composables

| Composable            | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `useGameStoreFactory` | `createGameStoreFactory<TCard, THistory, TSettings>()` — game store factory used by **numeric apps** (1x1, div, pum) |
| `useDeckGameStore`    | `createDeckGameStore<TCard, THistory, TSettings>()` — game store factory used by **deck apps** (voc, lwk) |
| `useBaseGameStore`    | Base game state factory (wrapped by both factories above; apps never call directly) |
| `useGameStateFlow`    | Full game flow: HomePage init → GamePage play → GameOverPage results (wrapped by the factories) |
| `useGameTimer`        | Elapsed time tracking with start/stop                                |
| `useAnswerFeedback`   | Answer status display + button disable timing                        |
| `useCountdownTimer`   | Countdown timer (e.g., hidden mode word display)                     |
| `useKeyboardContinue` | Enter/Space key listener for "continue" actions                      |
| `useCardFiltering`    | Filter cards by level/mode for button states                         |
| `useGameNavigation`   | Router navigation helpers for game flow                              |
| `useResetCards`       | Reset all card levels to 1                                           |
| `useDeckManagement`   | CRUD operations for card decks (voc, lwk)                            |

## Services

**storage.ts**: `loadJSON()`, `saveJSON()`, `loadSessionJSON()`, `saveSessionJSON()`, `createHistoryOperations(key, isValidEntry?)`, `createStatsOperations()`, `createAppGameStorage()`, `incrementDailyGames()`. All loaders accept an optional validator `(value: unknown) => boolean`; invalid values fall back to the provided default (`loadArray` drops invalid items instead). No migration shims — corrupt/outdated data self-heals to defaults.

**validators.ts** (`@flashcards/shared/utils`): `isRecord`, `isNumber`, `isString`, `isValidCardLevel`, `isValidBaseCard`, `isValidBaseSettings`, `isValidGameStats`, `isValidDailyStats`, `isValidGameResult`, `isValidHistoryEntry`. Compose these for app-specific shapes (e.g. voc/lwk deck + settings validators in `apps/*/src/services/storage.ts`).

**scoring.ts**: Points calculation with level/mode/time factors.

## Pages

`HistoryPage`, `GameOverPage`, `DecksEditPage`, `InfoPage`, `NumericGamePage` (shared game page used by numeric apps via thin app wrappers). `CardsManPage` lives in `pages/` but is exported as a component (`@flashcards/shared/components`).

## Components

`AboutSection`, `AppFooter`, `CardManActions`, `CardsListOfCards`, `CardsManLevelDistribution`, `CardsManPage`, `CardsTimeHistogram`, `GameAnswerFeedback`, `GameFeedbackNegative`, `GameHeader`, `GameInputSubmit`, `GameNextCardButton`, `GamePointsBreakdown`, `GameShowCardQuestion`, `HomeDeckSelector`, `HomeFocusSelector`, `HomeGameModeButtons`, `HomeLevelSelector`, `HomePageLayout`, `HomePwaInstallInfo`, `HomeStatisticsCard`

## Unit Test Patterns

**Test setup**: `src/__tests__/setup.ts` installs `LocalStorageMock`, `matchMedia` mock, suppresses Vue lifecycle warnings. Auto-loaded via `vitest.config.base.ts`.

**Quasar mocks** — use `vi.mock('quasar', () => ({ ... }))` without `importOriginal` (saves ~300ms per spec). Exception: `../utils/helper` needs `importOriginal`.

**App tests using shared composables that call `$q`** — a test file's `vi.mock('quasar')` does NOT reach modules inside the shared package (distinct module graph). The shared composable's real `useQuasar()` reads the app's injected `_q_`, so the app spec must also provide one whose `notify` is the spec's mock: `provide: { _q_: { ...quasarMocks.$q, notify: mockNotify } }` instead of `provide: quasarProvide`. (Root cause: page-level `$q.notify` calls hit the mock, shared-composable ones silently hit `quasarMocks.$q.notify`.) See `apps/voc` + `apps/lwk` CardsEditPage.spec.ts.

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
