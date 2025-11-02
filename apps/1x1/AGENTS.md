# CLAUDE.md - 1x1 Learning App

## Project Overview

Vue.js PWA for primary school students to practice multiplication tables (3x3 to 9x9, with optional extended ranges 1x2, 1x12, 1x20).

**Key Features:**

- 28 base cards (3x3-9x9) + optional extended ranges (1x2, 1x12, 1x20)
- 5-level adaptive difficulty system
- Three focus modes: weak/strong/slow cards
- Weighted random card selection
- Auto-submit (disabled for 3+ digits when 1x12/1x20 active)
- PWA with offline support

**Stack:** Vue 3 (Composition API), Quasar, TypeScript, Vite 6.x, Vitest, Cypress

**Storage:**

- localStorage: Cards (level, time), history, stats, range configuration
- sessionStorage: Game config, game results
- **Lazy-loading**: Cards created on first correct answer, not pre-generated

## Architecture

### Directory Structure

```text
src/
├── components/          # GroundhogMascot, FlashCard
├── pages/              # Home, Game, GameOver, History, Cards
├── services/           # storage.ts (persistence), cardSelector.ts
├── types/              # TypeScript definitions
└── constants.ts        # Game configuration
```

### Key Files

**`services/storage.ts`** - Data persistence with lazy-loaded range-based system

- Base cards: `loadCards()`, `saveCards()`, `initializeCards()` (28 cards 3x3-9x9, y≤x)
- Range management: `loadRange()`, `saveRange()`, `toggleFeature()` (array of unlocked numbers [2,3,4,5,6,7,8,9,11-20])
- Lazy-loading: `updateCard()` creates cards on first correct answer (not pre-generated)
- History/Stats: `loadHistory()`, `loadGameStats()`, `updateStatistics()`
- Session: `setGameConfig()`, `getGameConfig()`, `setGameResult()`
- Storage keys: `'1x1-cards'`, `'1x1-history'`, `'1x1-stats'`, `'1x1-range'`, `'1x1-game-config'`, `'1x1-game-result'`

**`services/cardSelector.ts`** - Card filtering and weighted random selection

- **Filtering functions**:
  - `filterCardsBySelection()`: Filters by number selection (OR logic: select=[6] → all cards where x=6 OR y=6)
  - `filterCardsSquares()`: Filters for x² cards (x === y)
  - `filterCardsAll()`: Returns all cards within range
  - All filters respect range boundaries (both x AND y must be in range)
- **Selection function**:
  - `selectCards()`: Applies focus-based weights (weak: low-level, strong: high-level, slow: high-time)
  - Returns up to 10 cards using weighted probability

**`components/FlashCard.vue`** - Game card component

- Auto-submit after 2 digits (disabled when `shouldDisableAutoSubmit` is true for 1x12/1x20)
- Timer with progress bar, answer validation
- Feedback dialog (3s auto-close for correct, 3s disable for wrong)

**`pages/HomePage.vue`** - Game configuration

- Dynamic `selectOptions` computed from current range (array of unlocked numbers)
- Selection buttons: all numbers in current range (based on active features)
- Default selection: all numbers in range
- Double-click to select all in range (or select only that number if all selected)
- Focus selector: weak/strong/slow

**`pages/CardsPage.vue`** - Progress visualization + range toggles

- Dynamic grid displays all cards in current range (y and x axes)
- Shows cards with default styling (level 1, time 60s) even if not yet played
- "Weitere Karten" section with 3 toggles (1x2, 1x12, 1x20) - only updates range
- No confirmation dialogs (no data loss from toggling)
- Cell styling: background=level, text color=time

## Extended Cards Features (Range-Based System)

### Overview

Three optional features unlock multiplication ranges beyond 3x3-9x9. Instead of pre-generating cards, the system uses **lazy-loading**: cards are created only when answered correctly for the first time.

1. **1x2**: Unlocks number 2 (2×2 through 2×9)
2. **1x12**: Unlocks 11, 12 (cross-products with 3-9)
3. **1x20**: Unlocks 13-20 (all cross-products, auto-enables 1x12)

**Important:** 10 is intentionally skipped (no cards with X or Y == 10)

### Range Configuration

Range is stored as an array of unlocked numbers (not min/max):

**Default range:** `[3, 4, 5, 6, 7, 8, 9]` (28 base cards)

**With 1x2 enabled:** `[2, 3, 4, 5, 6, 7, 8, 9]` (adds 2)

**With 1x12 enabled:** `[2, 3, 4, 5, 6, 7, 8, 9, 11, 12]` (adds 11, 12)

**With 1x20 enabled:** `[2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]` (adds 13-20, implies 1x12)

### Feature Interactions

**Activation:**

- 1x20 → auto-enables 1x12 (adds 11, 12 if not present)
- No data loss: toggling only affects visible/playable range
- Cards appear in grid with default styling (level 1, time 60s)

**Deactivation:**

- 1x12 deactivation → also removes 1x20 (warning shown)
- Cards remain in storage with their progress
- Re-enabling feature restores the cards with preserved progress

### Lazy-Loading Mechanism

**`updateCard(question, updates)`:**

- If card exists: updates level/time
- If card doesn't exist: creates card with given updates + default values
- Called on every answer submission

**GamePage flow:**

1. Filter available cards: `(x or y in select) AND (x in range AND y in range)`
2. Present card to user (may not exist in storage yet)
3. User answers → `updateCard()` creates card if needed + updates level/time
4. Card now persists in storage for future games

### Implementation Details

**CardsPage.vue:**

- `toggleFeature()`: Updates range array (adds/removes numbers)
- No confirmation dialogs (safe to toggle)
- Grid displays: `yValues = range` and `xValues = range`
- Shows all cards in range with current progress or defaults

**HomePage.vue:**

- `selectOptions = range.value` (array of available numbers)
- Default select: all numbers in range (copy of range array)
- Double-click behavior: select only that number OR select all in range

**GamePage (useGameStore):**

- Creates `rangeSet = new Set(range)` for fast lookup
- Filter: `(selectSet.has(x) || selectSet.has(y)) && rangeSet.has(x) && rangeSet.has(y)`
- Both x and y must be in range (prevents 9x16 when range is [2-9])

**FlashCard.vue:**

- `shouldDisableAutoSubmit = range.some(n => n >= 11)` (disable for 3-digit answers)

## Game Logic

### Card Selection Algorithm

1. Filter cards where x OR y matches selected tables
2. Apply focus-based weights (weak: level 1=5x, level 5=1x; strong: inverse; slow: time-based)
3. Weighted random selection (up to 10 cards)

### Scoring System

```typescript
points = min(x, y) + (6 - level) + time_bonus
```

- Base: smaller number (5×8 → 5 points)
- Level bonus: 6 - level (level 3 → +3)
- Time bonus: +5 if beat previous time

**Card updates:**

- Correct: level +1 (max 5), time = actual
- Wrong: level -1 (min 1)

**Daily bonuses:**

- First game: +5 points
- Every 5th game: +5 points

## Testing

**Unit Tests:** tests across multiple files

**E2E Tests** (Cypress): 4 tests (3 navigation + 1 full game flow)

```bash
pnpm test                    # Run unit tests
pnpm run cy:run:1x1         # Run E2E tests
```

**Test Infrastructure:**

- Test files use `.spec.ts` suffix (Vitest convention)
- localStorage mock: In-memory Storage implementation in `src/__tests__/setup.ts`
- Test isolation: Each test clears localStorage in `beforeEach`

## Commands

```bash
pnpm dev:1x1                # Dev server (single app)
pnpm build:1x1              # Build (with type check pre-flight)
pnpm test                   # Unit tests
pnpm run cy:run:1x1         # E2E tests
pnpm run check              # Comprehensive check (format, lint, types, spell, tests in parallel)
```

**Note:** `pnpm run check` includes type checking, so `pnpm run types` does not need to be run manually.

## Quick Reference

**Types:** `Card { question, answer, level: 1-5, time: 0.1-60 }`, `GameConfig { select[], focus }`, `GameResult { points, correctAnswers, totalCards }`

**Core Functions:** `selectCards()` (weighted selection), `updateCard()` (lazy-loads + updates), `toggleFeature()` (range updates)

**Storage Keys:** `1x1-cards`, `1x1-history`, `1x1-stats`, `1x1-range`, `1x1-game-config`, `1x1-game-result`, `1x1-daily-stats`

**Range Arrays:** `[3,4,5,6,7,8,9]` (default), `[2,3,4,5,6,7,8,9]` (1x2), `[2,3,4,5,6,7,8,9,11,12]` (1x12), `[2,3,4,5,6,7,8,9,11,12,13-20]` (1x20)

**Routes:** `/` (Home), `/game` (Game), `/game-over` (Results), `/history` (History), `/cards` (Progress)

**Base Path:** `/1x1/`
