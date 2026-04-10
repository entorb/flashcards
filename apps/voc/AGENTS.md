# voc — Vocabulary Learning App

PWA for English vocabulary learning with adaptive difficulty and multiple decks.

## Quick Reference

- `BASE_PATH = 'fc-voc'`
- `MAX_CARDS_PER_GAME = 10`
- `LEVENSHTEIN_THRESHOLD = 2`
- Stack: Vue 3, Quasar, TypeScript, Vite, Vitest, Cypress

## Data Model

```typescript
type GameMode = 'multiple-choice' | 'blind' | 'typing'
type Direction = 'voc-de' | 'de-voc'

interface Card extends BaseCard {
  voc: string // English word (unique key)
  de: string // German translation
}

interface CardDeck {
  name: string
  cards: Card[]
}

interface GameSettings {
  mode: GameMode
  focus: FocusType
  language: Direction
  deck?: string
}

interface GameHistory extends BaseGameHistory {
  settings: GameSettings
  totalCards?: number
}
```

## Storage Keys

Source of truth: `STORAGE_KEYS` in `src/constants.ts` (all prefixed `fc-voc-`).

Key constants: `CARDS`, `HISTORY`, `SETTINGS`, `STATS`, `DAILY_STATS`, `GAME_STATE`, `GAME_SETTINGS`, `GAME_RESULT`

## Game Mechanics

- Modes: multiple-choice (base points), blind (`POINTS_MODE_BLIND = 4`), typing (`POINTS_MODE_TYPING = 8`)
- Direction bonus: `LANGUAGE_BONUS_DE_VOC = 1` extra point for de→voc
- Correct: `6 - level` points, level +1. Wrong: 0 points, level -1
- Close match (Levenshtein ≤ 2): 75% points, level unchanged
- Time bonus: +5 if beating record (typing mode only tracks time)
- Card selection: weighted by focus, time weighting is mode-specific

## Key Files

- `src/constants.ts` — `BASE_PATH`, `STORAGE_KEYS`, `GAME_STATE_FLOW_CONFIG`, scoring constants, `DEFAULT_DECKS`
- `src/types.ts` — `Card`, `CardDeck`, `GameSettings`, `GameMode`, `Direction`
- `src/services/cardSelector.ts` — Weighted selection algorithm
- `src/services/pointsCalculation.ts` — `calculatePointsBreakdown()`
- `src/services/storage.ts` — Deck operations, history, stats
- `src/composables/useGameStore.ts` — Game state + deck operations
