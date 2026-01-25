# 1x1 Learning App (1x1)

PWA for multiplication table practice with adaptive difficulty.

## Quick Facts

- `BASE_PATH = 'fc-1x1'`
- `DEFAULT_RANGE = [3,4,5,6,7,8,9]`
- `MAX_CARDS_PER_GAME: 10`

## Data Model

```typescript
interface Card {
  question: string // e.g., "3x4"
  answer: number // e.g., 12
  level: number // 1-5
  time: number // seconds
}
```

## Game Mechanics

### Extended Ranges

- `1x2`: adds 2×2..2×9
- `1x12`: adds 11/12 cross-products with 3..9
- `1x20`: adds 13..20 and auto-enables 1x12

### Scoring

- Difficulty: `min(x,y)`
- Level: `6 - level` (1-5 points)
- Time: + `5` points if beating record

Card updates:

- Correct: `level = min(level + 1, 5)`, `time = actualTime`
- Wrong: `level = max(level - 1, 1)`

### Card Selection

Weighted by focus:

- `weak`: Low levels prioritized
- `strong`: High levels prioritized
- `medium`: Medium levels prioritized
- `slow`: High time prioritized

## Architecture

**Stack:** Vue 3, Quasar, TypeScript, Vite, Vitest, Cypress

### Key Files

- `src/constants.ts` — `BASE_PATH`, `DEFAULT_RANGE`, `MAX_CARDS_PER_GAME`
- `src/services/storage.ts` — `initializeCards()`, `updateCard()` (lazy-create)
- `src/services/cardSelector.ts` — Weighted selection algorithm
- `src/composables/useGameStore.ts` — Game state + scoring

### Storage Keys

- `1x1-cards`: `Card[]`
- `1x1-history`: `GameHistory[]`
- `1x1-stats`: `GameStats`
- `1x1-range`: number[]
- `1x1-last-settings`: `GameSettings`

## Critical Rules

- Lazy-loading: Cards created on first answer
- Range filtering: OR logic (x OR y in selected range)
- Level adjustment: +1 correct, -1 incorrect
- No parallel sessions: One game at a time
