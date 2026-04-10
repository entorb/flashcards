# 1x1 — Multiplication Tables App

PWA for multiplication table practice with adaptive difficulty.

## Quick Reference

- `BASE_PATH = 'fc-1x1'`
- `DEFAULT_RANGE = [3, 4, 5, 6, 7, 8, 9]`
- `MAX_CARDS_PER_GAME = 10`
- Stack: Vue 3, Quasar, TypeScript, Vite, Vitest, Cypress

## Data Model

```typescript
interface Card extends BaseCard {
  question: string // "3x4"
  answer: number // 12
}

interface GameSettings {
  select: number[] | 'all' | 'x²'
  focus: FocusType
}

interface GameHistory extends BaseGameHistory {
  settings: GameSettings
}
```

## Storage Keys

Source of truth: `STORAGE_KEYS` in `src/constants.ts` (all prefixed `fc-1x1-`).

Key constants: `CARDS`, `HISTORY`, `STATS`, `SETTINGS`, `SELECTED_CARDS`, `GAME_RESULT`, `DAILY_STATS`, `GAME_STATE`, `RANGE`, `GAME_CONFIG`

## Game Mechanics

- Extended ranges: `1x2` (adds 2×2..2×9), `1x12` (adds 11/12), `1x20` (adds 13..20, auto-enables 1x12)
- Scoring difficulty: `min(x, y)`, level factor: `6 - level`, time bonus: +5 if beating record
- Correct: level +1 (max 5), time updated. Wrong: level -1 (min 1)
- Card selection: weighted by focus (`weak`/`medium`/`strong`/`slow`)
- Lazy-loading: cards created on first answer
- Range filtering: OR logic (x OR y in selected range)

## Key Files

- `src/constants.ts` — `BASE_PATH`, `STORAGE_KEYS`, `GAME_STATE_FLOW_CONFIG`, `DEFAULT_RANGE`
- `src/types.ts` — `Card`, `GameSettings`, `GameHistory`, `SelectionType`
- `src/services/cardSelector.ts` — Weighted selection algorithm
- `src/services/storage.ts` — `initializeCards()`, `updateCard()`
- `src/composables/useGameStore.ts` — Game state + scoring
