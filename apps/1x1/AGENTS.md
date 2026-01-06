# 1x1 Multiplication Learning App

Vue.js PWA for primary school multiplication practice (3×3 to 9×9, optional
extended ranges 1×2, 1×12, 1×20).

**Features:** 28 base cards + extended ranges • 5-level adaptive difficulty •
Focus modes (weak/strong/slow) • Weighted selection • Auto-submit (disabled for
3+ digits) • PWA offline support

**Stack:** Vue 3 (Composition API), Quasar, TypeScript, Vite, Vitest, Cypress

**Storage:** localStorage (cards, history, stats, range config) • sessionStorage
(game config, results) • **Lazy-loading** (cards created on first correct
answer)

## Architecture

```text
src/
├── components/     # GroundhogMascot, FlashCard
├── pages/          # Home, Game, GameOver, History, Cards
├── services/       # storage.ts, cardSelector.ts
├── types/          # TypeScript definitions
└── constants.ts    # Game configuration
```

### Key Files

| File                          | Responsibility                                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services/storage.ts`         | Data persistence • `loadCards()`, `saveCards()`, `initializeCards()` (28 cards 3×3-9×9, y≤x) • Range: `loadRange()`, `saveRange()`, `toggleFeature()` • **`updateCard()`** (lazy-load + update) |
| `services/cardSelector.ts`    | Filtering: `filterCardsBySelection()` (OR logic: select=[6] → x=6 OR y=6), `filterCardsSquares()`, `filterCardsAll()` • Selection: `selectCards()` (focus-weighted, up to 10 cards)             |
| `components/FlashCard.vue`    | Auto-submit after 2 digits (disabled for 1×12/1×20) • Timer + progress bar • Feedback (3s auto-close correct, 3s disable wrong)                                                                 |
| `pages/HomePage.vue`          | Dynamic `selectOptions` from range • Selection buttons • Double-click: select all OR only that number • Focus selector                                                                          |
| `pages/CardsPage.vue`         | Dynamic grid (range × range) • Shows cards with defaults (level 1, time 60s) if not played • "Weitere Karten" toggles (1×2, 1×12, 1×20)                                                         |
| `composables/useGameStore.ts` | Extends shared base store • Card selection • Answer handling • Level/time updates                                                                                                               |

**Storage Keys:** `1x1-cards`, `1x1-history`, `1x1-stats`, `1x1-range`,
`1x1-game-config`, `1x1-game-result`, `1x1-daily-stats`

## Extended Cards Features (Range-Based System)

Three optional features unlock multiplication ranges beyond 3×3-9×9 using
**lazy-loading** (cards created only when answered correctly for first time):

| Feature | Unlocks        | Cards Added              | Notes                       |
| ------- | -------------- | ------------------------ | --------------------------- |
| 1×2     | Number 2       | 2×2 through 2×9          | 7 new cards                 |
| 1×12    | Numbers 11, 12 | Cross-products with 3-9  | Auto-enabled by 1×20        |
| 1×20    | Numbers 13-20  | All cross-products 13-20 | Implies 1×12 (auto-enables) |

**Important:** 10 is intentionally skipped (no cards with x=10 or y=10)

### Range Configuration

Range stored as array of unlocked numbers (not min/max):

- **Default:** `[3,4,5,6,7,8,9]` (28 base cards)
- **1×2:** `[2,3,4,5,6,7,8,9]` (adds 2)
- **1×12:** `[2,3,4,5,6,7,8,9,11,12]` (adds 11,12)
- **1×20:**
  `[2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18,19,20]` (adds 13-20)

### Feature Interactions

**Activation:**

- 1×20 → auto-enables 1×12 (adds 11,12 if not present)
- No data loss: toggling only affects visible/playable range
- Cards appear in grid with default styling (level 1, time 60s)

**Deactivation:**

- 1×12 deactivation → also removes 1×20 (warning shown)
- Cards remain in storage with their progress
- Re-enabling restores cards with preserved progress

### Lazy-Loading Mechanism

**`updateCard(question, updates)`:**

- Card exists → updates level/time
- Card doesn't exist → creates with updates + defaults
- Called on every answer submission

**Game Flow:**

1. Filter: `(x OR y in select) AND (x in range AND y in range)`
2. Present card (may not exist in storage yet)
3. User answers → `updateCard()` creates/updates card
4. Card persists for future games

**Implementation:**

- **CardsPage:** `toggleFeature()` updates range array • Grid shows all cards in
  range
- **HomePage:** `selectOptions = range` • Double-click: select all OR only that
  number
- **GameStore:** `rangeSet = new Set(range)` • Filter:
  `(selectSet.has(x) || selectSet.has(y)) && rangeSet.has(x) && rangeSet.has(y)`
- **FlashCard:** `shouldDisableAutoSubmit = range.some(n => n >= 11)`

## Game Logic

### End-of-Game Flow

**See `packages/shared/CLAUDE.md` for detailed pattern.**

Summary:

1. `finishGame()` updates in-memory state (history + stats WITHOUT bonus)
2. Saves to sessionStorage, clears game state
3. GameOverPage calculates bonuses, adds to in-memory stats
4. **Single save to localStorage immediately** on GameOverPage load (with
   bonuses)

**Critical:** `finishGame()` does NOT save to localStorage • Save happens
immediately when GameOverPage loads (not when user navigates away) • Ensures
data persists even if tab closed

### Card Selection

1. Filter cards: x OR y matches selected tables
2. Apply focus weights (weak: level 1=5×, level 5=1×; strong: inverse; slow:
   time-based)
3. Weighted random selection (up to 10 cards)

### Scoring

```typescript
points = min(x, y) + (6 - level) + time_bonus
```

- **Base:** Smaller number (5×8 → 5 points)
- **Level bonus:** 6 - level (level 3 → +3)
- **Time bonus:** +1 if beat previous time

**Card updates:**

- ✅ Correct: level +1 (max 5), time = actual
- ❌ Wrong: level -1 (min 1)

**Daily bonuses:**

- First game: +5 points
- Every 5th game: +5 points

## Testing

**Unit Tests:** Vitest (`.spec.ts` files) • localStorage mock in
`src/__tests__/setup.ts`

**E2E Tests:** Cypress • 4 tests (3 navigation + 1 full game flow)

```bash
pnpm test                 # Unit tests
pnpm run cy:run:1x1      # E2E tests
```

## Commands

See root `CLAUDE.md` for full command reference. App-specific commands:

```bash
pnpm dev:1x1             # Dev server
pnpm build:1x1           # Build (with type check)
pnpm run cy:run:1x1     # E2E tests
```

## Quick Reference

**Types:** `Card { question, answer, level: 1-5, time: 0.1-60 }`,
`GameConfig { select[], focus }`,
`GameResult { points, correctAnswers, totalCards }`

**Core Functions:** `selectCards()` (weighted selection), `updateCard()`
(lazy-loads + updates), `toggleFeature()` (range updates)

**Range Arrays:** `[3,4,5,6,7,8,9]` (default), `[2,3,4,5,6,7,8,9]` (1×2),
`[2,3,4,5,6,7,8,9,11,12]` (1×12), `[2,3,4,5,6,7,8,9,11,12,13-20]` (1×20)

**Routes:** `/` (Home), `/game` (Game), `/game-over` (Results), `/history`
(History), `/cards` (Progress)

**Base Path:** `/1x1/`
