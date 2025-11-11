# Wordplay Vocabulary Learning App

Vue.js PWA for vocabulary learning through spaced repetition and adaptive
difficulty with custom flashcard decks.

**Features:** Multiple deck support • Custom flashcard creation • 3 game modes
(Multiple-choice 1×, Blind 2×, Typing 4×) • Bidirectional learning (Voc↔DE) •
5-level adaptive difficulty • Language-specific bonuses (DE→EN +1pt) • Weighted
card selection • 3s feedback with icons • Timer tracking • PWA offline support

**Stack:** Vue 3 (Composition API), Quasar, TypeScript, Vite, Vitest, Cypress

**Storage:** localStorage (deck structure, history, stats, settings) •
sessionStorage (game config)

## Architecture

```text
src/
├── components/
│   ├── FlashCard.vue             # Core game component (MC, Blind, Typing)
│   ├── CardManagementCard.vue    # Individual card CRUD
│   ├── DeckSelector.vue          # Deck selection dropdown
│   └── LanguagePicker.vue        # EN↔DE selection
├── pages/
│   ├── HomePage.vue              # Navigation + stats + deck selector
│   ├── GamePage.vue              # Active game
│   ├── CardsPage.vue             # Create/edit/delete flashcards + deck selector
│   ├── DecksEditPage.vue         # Create/edit/delete decks
│   ├── GameOverPage.vue          # Results
│   └── HistoryPage.vue           # Game history
├── services/
│   ├── storage.ts                # localStorage service (deck structure)
│   ├── cardSelector.ts           # Card selection algorithm
│   ├── pointsCalculation.ts      # Points calculation
│   └── helpers.ts                # String normalization, Levenshtein
├── composables/
│   └── useGameStore.ts           # Game state management + deck operations
└── types/index.ts                # TypeScript definitions
```

### Key Files

| File                            | Responsibility                                                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/FlashCard.vue`      | Renders MC/Blind/Typing modes • Answer validation (Levenshtein for typing) • 3s feedback display • Timer tracking • Language direction logic                                 |
| `components/DeckSelector.vue`   | Deck selection dropdown • Validates deck existence • Auto-switches to first deck if current deleted                                                                          |
| `pages/DecksEditPage.vue`       | Deck CRUD operations • Add/rename/remove decks • Validates unique names • Generates next available `deck_N` index                                                            |
| `services/cardSelector.ts`      | Weighted random selection by level, time, focus (weak/strong/slow), language • Returns 10 cards (MC) or variable (Blind/Typing)                                              |
| `services/storage.ts`           | Deck structure: `loadDecks()`, `saveDecks()` • Cards: `loadCards()`, `saveCards()` • History: `addHistory()` • Stats: `updateStatistics()` • Settings: `loadLastSettings()`  |
| `services/pointsCalculation.ts` | `calculatePointsBreakdown()` returns base × mode × close ± language ± time bonuses                                                                                           |
| `composables/useGameStore.ts`   | Extends base store • Card/deck selection • Deck operations (add, remove, rename, switch) • Answer processing • Level/time updates • Card management (reset, import, moveAll) |
| `types/index.ts`                | `Card { voc, de, time_blind, time_typing, level }` • `CardDeck { name, cards }` • `GameSettings { mode, focus, language, deck }` • `AnswerData` • `PointsBreakdown`          |

**Storage Keys:** `voc-cards` (CardDeck[]), `voc-history`, `voc-stats`,
`voc-last-settings`

## Game Modes and Scoring

| Mode            | Multiplier | Validation                   | Features                                               |
| --------------- | ---------- | ---------------------------- | ------------------------------------------------------ |
| Multiple-choice | 1×         | Direct comparison            | 4 buttons (1 correct + 3 random) • No time bonus       |
| Blind           | 2×         | Self-assessment              | Reveal answer → confirm if known • Time bonus: +5 pts  |
| Typing          | 4×         | Levenshtein ≤2 (fuzzy match) | Type answer • "to" prefix handling • Time bonus: +5pts |

### Scoring Formula

```typescript
points = basePoints × modeMultiplier × closeAdjustment + languageBonus + timeBonus
```

**Components:**

- **Base points:** `6 - card.level` (level 1=5pts, level 5=1pt)
- **Mode multiplier:** MC=1×, Blind=2×, Typing=4×
- **Close adjustment:** 0.75 (75% points for Levenshtein match in typing mode)
- **Language bonus:** +1 for DE→EN direction (accounts for complexity)
- **Time bonus:** +5 if beat previous time (Blind/Typing modes only)

### Answer Feedback

| Result    | Display                            | Behavior                                       |
| --------- | ---------------------------------- | ---------------------------------------------- |
| Correct   | Green background + checkmark       | Auto-advance after 3s • Button enabled         |
| Close     | Yellow/orange background + warning | Strikethrough comparison • Button disabled 3s  |
| Incorrect | Red background + X                 | Typing: strikethrough comparison • Disabled 3s |

**Typing Mode Validation:**

- Fuzzy matching with Levenshtein distance ≤2
- Handles "to" prefix removal for DE→EN verbs
- Close answers: 75% points + warning feedback
- Multiple valid answers: separated by "/" (e.g., "Welche/Welcher")

## Deck Management

**Multiple Decks:** Users can create, rename, and delete decks to organize cards by
language or topic. Each deck contains its own set of cards.

**Storage Structure:** `voc-cards` stores `CardDeck[]` array. Each deck has:

- `name`: Unique identifier (default: "en", new decks: "deck_N")
- `cards`: Array of Card objects for that deck

**Deck Operations:**

- Add: Finds next available `deck_N` index (e.g., `deck_0`, `deck_1`)
- Rename: Updates deck name and auto-updates settings if current deck
- Remove: Cannot delete last deck • Auto-switches to first deck if current deleted
- Switch: Changes active deck for games and card management

**Migration:** Automatic migration from old Card[] structure to CardDeck[] structure
(renames "en" field to "voc"). Migration code marked for deletion on 2025-11-18.

## Card Management

Users can create/edit/delete/reset cards, import custom decks, and adjust levels
within the current deck.

**Import/Export:**

- Excel/TSV format: `Voc{tab}DE{tab}LEVEL` (level optional)
- Supports "/" for alternative answers
- Clipboard integration (copy to Excel, paste to import)

**Reset/Move All:**

- Reset: Revert current deck to initial cards (confirmation required)
- Move All: Set all cards in current deck to specific level (confirmation required)

## Game Flow & End-of-Game

**See `packages/shared/CLAUDE.md` for detailed end-of-game flow pattern.**

Summary:

1. `finishGame()` updates in-memory state (history + stats WITHOUT bonus)
2. Saves to sessionStorage, clears game state
3. GameOverPage calculates bonuses, adds to in-memory stats
4. **Single save to localStorage immediately** on GameOverPage load (with
   bonuses)

**Critical:** `finishGame()` does NOT save to localStorage • Save happens
immediately when GameOverPage loads • Ensures data persists even if tab closed

## State Management

Uses shared base store from
`@flashcards/shared/composables/useBaseGameStore.ts` with app-specific logic:

- Card selection algorithm (weighted by level, time, focus, language)
- Answer validation (fuzzy matching for typing mode)
- Language direction handling (EN→DE vs DE→EN)
- Mode-specific point calculation

## Testing

**Unit Tests:** 9 tests in `src/pages/HomePage.spec.ts` covering component
rendering, navigation, statistics, settings

**E2E Tests:** Cypress • Full game flows for all 3 modes

```bash
pnpm test                 # Unit tests
pnpm run cy:run:voc      # E2E tests
```

## Commands

See root `CLAUDE.md` for full command reference. App-specific commands:

```bash
pnpm dev:voc             # Dev server
pnpm build:voc           # Build (with type check)
pnpm run cy:run:voc     # E2E tests
```

## Quick Reference

**Types:** `Card { voc, de, level: 1-5, time_blind: 0.1-60, time_typing: 0.1-60 }`,
`CardDeck { name, cards }`, `GameSettings { mode, focus, language, deck }`,
`PointsBreakdown { basePoints, modeMultiplier, closeAdjustment, languageBonus, timeBonus, totalPoints }`

**Core Functions:** `selectCards()` (weighted selection),
`calculatePointsBreakdown()` (scoring), `validateTypingAnswer()` (fuzzy
matching)

**Constants:** `MAX_TIME = 60`, `MIN_TIME = 0.1`, `MAX_LEVEL = 5`,
`MIN_LEVEL = 1`, `LEVENSHTEIN_THRESHOLD = 2`,
`MODE_MULTIPLIERS = { 'multiple-choice': 1, 'blind': 2, 'typing': 4 }`

**Routes:** `/` (Home), `/game` (Game), `/game-over` (Results), `/history`
(History), `/cards` (Cards), `/decks-edit` (Deck Management)

**Base Path:** `/voc/`

## Important Notes

- Multiple decks stored as `CardDeck[]` in `voc-cards` localStorage key
- Deck names must be unique • Default deck: "en" • New decks: "deck_N"
- Card `voc` field is unique identifier for lookups within a deck
- Current deck stored in `GameSettings.deck` • Auto-switches on deck deletion
- Time tracking is mode-specific: `time_blind` vs `time_typing`
- Multiple-choice mode doesn't track time
- Levenshtein distance allows up to 2-character differences
- "to " prefix handling is language-specific (Voc verbs, DE verbs)
- Points calculation includes mode multipliers and bonuses
- Statistics: games played, total points, correct answers count
