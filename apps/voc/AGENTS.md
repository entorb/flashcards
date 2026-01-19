# Rabat's Vocabulary Learning App (voc)

Developer summary and implementation notes.

## Overview

A progressive web app (PWA) designed to help school students master English vocabulary through gamification and adaptive learning.

## Quick Facts

- `BASE_PATH = 'fc-voc'` (src/constants.ts)
- MAX_CARDS_PER_GAME: `10`

## Features

- **Adaptive Learning**: Cards adjust difficulty based on performance (5 levels)
- **Smart Card Selection**: Focus on weak or strong cards
- **Progress Tracking**: Detailed statistics and performance history
- **Mode-based Scoring**: Harder modes earn higher multipliers
- **PWA Support**: Install as a native app on smartphones
- **Offline Ready**: Works without internet connection
- **Visual Progress**: Color-coded card levels
- **Game Mechanics**:
  - Three game modes: Multiple Choice, Blind, Typing
  - Auto-advance after 3s on correct answers
  - 3-second safety delay on wrong/close answers before continuing
  - Visual feedback with color-coded messages
  - Levenshtein distance for "close" answer detection (1 character difference)

## UI

- German language
- Prefer icons over text, to make it easier

## Data Model

### Card Model

- `voc: string`, `de: string`, `level: number`, `time_blind: number`, `time_typing: number`.

### Card Properties

Each card tracks:

- **Vocabulary**: Vocabulary in English
- **Translation**: German translation
- **Level**: Difficulty level 1-5 (starts at varies per card)
  - Increases by 1 on correct answer (max 5)
  - Stays same on "close" answer
  - Decreases by 1 on incorrect answer (min 1)
- **Time (mode-specific)**:
  - **time_blind**: Seconds for last correct answer in blind mode (0.1-60s, default 60)
  - **time_typing**: Seconds for last correct answer in typing mode (0.1-60s, default 60)
  - No time tracking for multiple-choice mode
  - Updated only on correct answers in respective modes
  - Used for "slow" card prioritization (mode-specific, multiple-choice uses min of both)
  - Triggers time bonus when beaten in same mode

### Initial Cards

The app starts with 10 default cards:

- Where/Wo (Level 1)
- Who/Wer (Level 1)
- What/Was (Level 2)
- Why/Warum (Level 2)
- When/Wann (Level 3)
- How/Wie (Level 3)
- Which/Welche/Welcher/Welches (Level 4)
- From where/Woher (Level 4)
- Where to/Wohin (Level 5)
- How much/Wie viel (Level 5)

### Deck Model

- `CardDeck { name, cards }`
- Multiple decks supported, stored as `CardDeck[]` in `voc-cards`

## Game Mechanics

### Modes

- `multiple-choice` (×1), `blind` (×2), `typing` (×4). Typing uses fuzzy matching (Levenshtein ≤ 2).

### Card Selection

1. **Mode**: Choose game mode
   - **Multiple Choice** (x1 multiplier): Select from 4 options
   - **Blind** (x2 multiplier): Reveal answer and self-assess
   - **Typing** (x4 multiplier): Type the exact answer
2. **Focus**: Prioritize cards by strategy
   - **Weak** (low): Practice low-level cards (level 1=5x weight, level 5=1x weight)
   - **Strong** (high): Practice high-level cards (level 1=1x weight, level 5=5x weight)
   - **Medium** (medium): Practice medium-level cards (level 1=1x, 2=3x, 3=5x, 4=3x, 5=1x weight)
   - **Slow** (slow): Practice cards with highest time
     - Blind mode: Uses time_blind
     - Typing mode: Uses time_typing
     - Multiple-choice mode: Uses min of time_blind and time_typing
3. **Direction**: Voc→DE or DE→EN
4. **Random Selection**: Pick up to 10 cards using weighted probability

### Scoring System

Points are calculated based on multiple factors:

#### Base Points

- **Level 1**: 5 points (hardest - least known)
- **Level 2**: 4 points
- **Level 3**: 3 points
- **Level 4**: 2 points
- **Level 5**: 1 point (easiest - best known)

Formula: `basePoints = 6 - card.level`

#### Mode Multiplier

- **Multiple Choice**: x1 (standard)
- **Blind**: x2 (harder - you must know the answer before revealing)
- **Typing**: x4 (hardest - you must type the exact answer)

#### Answer Types

- **Correct**: Full points (`basePoints * multiplier`)
- **Close** (typing mode only): 75% of points (one character different using Levenshtein distance)
- **Incorrect**: 0 points

#### Language Direction Bonus

- +1 point for DE→EN direction (accounts for complexity)

#### Time Bonus

- +5 points if you beat your previous time in Blind or Typing modes

### Scoring Formula

```typescript
points = basePoints × modeMultiplier × closeAdjustment + languageBonus + timeBonus
```

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

### Deck Management

**Multiple Decks:** Users can create, rename, and delete decks to organize cards by language or topic. Each deck contains its own set of cards.

**Storage Structure:** `voc-cards` stores `CardDeck[]` array. Each deck has:

- `name`: Unique identifier (default: "en", new decks: "deck_N")
- `cards`: Array of Card objects for that deck

**Deck Operations:**

- Add: Finds next available `deck_N` index (e.g., `deck_0`, `deck_1`)
- Rename: Updates deck name and auto-updates settings if current deck
- Remove: Cannot delete last deck • Auto-switches to first deck if current deleted
- Switch: Changes active deck for games and card management

**Migration:** Automatic migration from old Card[] structure to CardDeck[] structure (renames "en" field to "voc"). Migration code marked for deletion on 2025-11-18.

### Card Management

Users can create/edit/delete/reset cards, import custom decks, and adjust levels within the current deck.

**Import/Export:**

- Excel/TSV format: `Voc{tab}DE{tab}LEVEL` (level optional)
- Supports "/" for alternative answers
- Clipboard integration (copy to Excel, paste to import)

**Reset/Move All:**

- Reset: Revert current deck to initial cards (confirmation required)
- Move All: Set all cards in current deck to specific level (confirmation required)

### Game Flow & End-of-Game

**See `packages/shared/CLAUDE.md` for detailed end-of-game flow pattern.**

Summary:

1. `finishGame()` updates in-memory state (history + stats WITHOUT bonus)
2. Saves to sessionStorage, clears game state
3. GameOverPage calculates bonuses, adds to in-memory stats
4. **Single save to localStorage immediately** on GameOverPage load (with bonuses)

**Critical:** `finishGame()` does NOT save to localStorage • Save happens immediately when GameOverPage loads • Ensures data persists even if tab closed

## Architecture

**Stack:** Vue 3 (Composition API), Quasar, TypeScript, Vite, Vitest, Cypress

**Storage:** localStorage (deck structure, history, stats, settings) • sessionStorage (game config)

```text
src/
├── components/
│   ├── FlashCard.vue             # Core game component (MC, Blind, Typing)
│   ├── DeckSelector.vue          # Deck selection dropdown
│   ├── LanguagePicker.vue        # EN↔DE selection
│   ├── FoxMascot.vue             # Mascot component
│   ├── GameStatsDisplay.vue      # Stats display
│   └── Scoreboard.vue            # Score display
├── pages/
│   ├── HomePage.vue              # Navigation + stats + deck selector
│   ├── GamePage.vue              # Active game
│   ├── CardsPage.vue             # Create/edit/delete flashcards + deck selector
│   ├── CardsEditPage.vue         # Edit individual cards
│   ├── DecksEditPage.vue         # Create/edit/delete decks
│   ├── GameOverPage.vue          # Results
│   ├── HistoryPage.vue           # Game history
│   ├── InfoPage.vue              # Info page
│   └── HistoryPage.vue           # Game history
├── services/
│   ├── storage.ts                # localStorage service (deck structure)
│   ├── cardSelector.ts           # Card selection algorithm
│   ├── pointsCalculation.ts      # Points calculation
│   └── helpers.ts                # String normalization, Levenshtein
├── composables/
│   └── useGameStore.ts           # Game state management + deck operations
├── utils/
│   ├── helpers.spec.ts           # Tests for helpers
│   └── helpers.ts                # String normalization, Levenshtein
└── types/index.ts                # TypeScript definitions
```

### Key Files

| File                            | Responsibility                                                                                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/FlashCard.vue`      | Renders MC/Blind/Typing modes • Answer validation (Levenshtein for typing) • 3s feedback display • Timer tracking • Language direction logic                                             |
| `components/DeckSelector.vue`   | Deck selection dropdown • Validates deck existence • Auto-switches to first deck if current deleted                                                                                      |
| `pages/DecksEditPage.vue`       | Deck CRUD operations • Add/rename/remove decks • Validates unique names • Generates next available `deck_N` index                                                                        |
| `pages/CardsPage.vue`           | Card management • Import/export • Reset/move all cards                                                                                                                                   |
| `pages/CardsEditPage.vue`       | Edit individual cards                                                                                                                                                                    |
| `services/cardSelector.ts`      | Weighted random selection by level, time, focus (weak/strong/medium/slow), language • Returns 10 cards (MC) or variable (Blind/Typing)                                                   |
| `services/storage.ts`           | Deck structure: `loadDecks()`, `saveDecks()` • Cards: `loadCards()`, `saveCards()` • History: `addHistory()` • Stats: `updateStatistics()` • Settings: `loadLastSettings()`              |
| `services/pointsCalculation.ts` | `calculatePointsBreakdown()` returns base × mode × close ± language ± time bonuses                                                                                                       |
| `composables/useGameStore.ts`   | Extends base store • Card/deck selection • Deck operations (add, remove, rename, switch) • Answer processing • Level/time updates • Card management (reset, import, moveAll)             |
| `types/index.ts`                | `Card { voc, de, level: 1-5, time_blind: 0.1-60, time_typing: 0.1-60 }` • `CardDeck { name, cards }` • `GameSettings { mode, focus, language, deck }` • `AnswerData` • `PointsBreakdown` |

**Storage Keys:** `voc-cards` (CardDeck[]), `voc-history`, `voc-stats`, `voc-last-settings`

### State Management

Uses shared base store from `@flashcards/shared/composables/useBaseGameStore.ts` with app-specific logic:

- Card selection algorithm (weighted by level, time, focus, language)
- Answer validation (fuzzy matching for typing mode)
- Language direction handling (EN→DE vs DE→EN)
- Mode-specific point calculation

## Key Files (Summary)

- `src/constants.ts` — mode multipliers, `BASE_PATH`
- `src/services/storage.ts` — `voc-cards`, `voc-history`, `voc-stats`, `voc-last-settings`
- `src/services/pointsCalculation.ts` — scoring breakdown
- `src/composables/useGameStore.ts` — deck ops and game logic

## Testing

**Unit Tests:** 9 tests in `src/pages/HomePage.spec.ts` covering component rendering, navigation, statistics, settings

**E2E Tests:** Cypress • Full game flows for all 3 modes

## Commands

```bash
pnpm dev:voc
pnpm build:voc
pnpm run cy:run:voc
```

## Notes & Gotchas

**Types:** `Card { voc, de, level: 1-5, time_blind: 0.1-60, time_typing: 0.1-60 }`, `CardDeck { name, cards }`, `GameSettings { mode, focus, language, deck }`, `PointsBreakdown { basePoints, modeMultiplier, closeAdjustment, languageBonus, timeBonus, totalPoints }`

**Core Functions:** `selectCards()` (weighted selection), `calculatePointsBreakdown()` (scoring), `validateTypingAnswer()` (fuzzy matching)

**Constants:** `MAX_TIME = 60`, `MIN_TIME = 0.1`, `MAX_LEVEL = 5`, `MIN_LEVEL = 1`, `LEVENSHTEIN_THRESHOLD = 2`, `MODE_MULTIPLIERS = { 'multiple-choice': 1, 'blind': 2, 'typing': 4 }`

**Routes:** `/` (Home), `/game` (Game), `/game-over` (Results), `/history` (History), `/cards` (Cards), `/cards-edit` (Card Edit), `/decks-edit` (Deck Management), `/stats` (Stats), `/info` (Info)

**Base Path:** `/voc/`

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

## See Also

- **[Root AGENTS.md](../../AGENTS.md)** - Monorepo overview
- **[Shared AGENTS.md](../../packages/shared/AGENTS.md)** - Shared code docs
