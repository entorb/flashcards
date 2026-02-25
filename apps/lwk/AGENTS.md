# lwk — Spelling Trainer App

PWA for spelling practice with adaptive difficulty and custom word decks.

## Quick Reference

- `BASE_PATH = 'fc-lwk'`
- `MAX_CARDS_PER_GAME = 10`
- `WORD_DISPLAY_DURATION = 3` (seconds)
- `LEVENSHTEIN_THRESHOLD = 1`
- Stack: Vue 3, Quasar, TypeScript, Vite, Vitest, Cypress

## Data Model

```typescript
type GameMode = 'copy' | 'hidden'

interface Card extends BaseCard {
  word: string // Spelling word (unique key)
}

interface CardDeck {
  name: string
  cards: Card[]
}

interface GameSettings {
  mode: GameMode
  focus: FocusType
  deck?: string
}

interface GameHistory extends BaseGameHistory {
  settings: GameSettings
  totalCards?: number
}

interface GameState extends SharedGameState {
  settings: GameSettings
  currentCard: Card | null
  showWord: boolean
  countdown: number // 0-3 seconds for hidden mode
}
```

## Storage Keys

Source of truth: `STORAGE_KEYS` in `src/constants.ts` (all prefixed `fc-lwk-`).

Key constants: `DECKS`, `HISTORY`, `STATS`, `SETTINGS`, `SELECTED_CARDS`, `GAME_STATE`, `GAME_RESULT`, `DAILY_STATS`

## Game Mechanics

- Copy mode: word visible while typing (levels 1-2 only)
- Hidden mode: word shown 3s then hidden (`POINTS_MODE_HIDDEN = 4`), all levels
- Correct: `6 - level` points, level +1. Wrong: 0 points, level -1
- Close match (Levenshtein = 1): 75% points, level unchanged
- Time bonus: +5 if beating record (hidden mode)
- Time tracking: 0.1-60s, 1 decimal precision

## Key Files

- `src/constants.ts` — `BASE_PATH`, `STORAGE_KEYS`, `GAME_STATE_FLOW_CONFIG`, `DEFAULT_DECKS`
- `src/types.ts` — `Card`, `CardDeck`, `GameSettings`, `GameMode`, `GameState`
- `src/services/storage.ts` — Deck operations, history, stats
- `src/composables/useGameStore.ts` — Game state + deck operations
