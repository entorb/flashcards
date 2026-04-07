# div — Division Training App

PWA for division fact practice with adaptive difficulty.

## Quick Reference

- `BASE_PATH = 'fc-div'`
- `DEFAULT_RANGE = [2, 3, 4, 5, 6, 7, 8, 9]`
- `MAX_CARDS_PER_GAME = 10`
- Stack: Vue 3, Quasar, TypeScript, Vite, Vitest, Cypress

## Data Model

```typescript
interface Card extends BaseCard {
  question: string // "18:3" (dividend:divisor)
  answer: number // 6
}

interface GameSettings {
  select: number[] // Selected divisors, always number[] (no 'all' or 'x²')
  focus: FocusType
}

interface GameHistory extends BaseGameHistory {
  settings: GameSettings
}
```

## Storage Keys

Source of truth: `STORAGE_KEYS` in `src/constants.ts` (all prefixed `fc-div-`).

Key constants: `CARDS`, `HISTORY`, `STATS`, `SETTINGS`, `SELECTED_CARDS`, `GAME_RESULT`, `DAILY_STATS`, `GAME_STATE`, `RANGE`, `GAME_CONFIG`

## Game Mechanics

- Card generation: 36 triples (X, Y ∈ [2,9], X ≤ Y, Z=X×Y) → 64 cards: non-square triples (X<Y) yield "Z:X"→Y and "Z:Y"→X (56), square triples (X=Y) yield "X²:X"→X (8)
- Extended range: `≤50` toggle adds cards where Z ≤ 50 with divisor ∈ {2..9, 11, 12}; base cards (both factors ≤ 9) are never removed
- Scoring difficulty: divisor value (number after `:` in question)
- Level factor: `6 - level`, time bonus: +5 if beating record
- Correct: level +1 (max 5), time updated. Wrong: level -1 (min 1)
- Card selection: weighted by focus (`weak`/`medium`/`strong`/`slow`)
- Lazy-loading: cards created on first answer
- Filtering: by divisor only (number after `:`)

## Key Files

- `src/constants.ts` — `BASE_PATH`, `STORAGE_KEYS`, `GAME_STATE_FLOW_CONFIG`, `DEFAULT_RANGE`
- `src/types.ts` — `Card`, `GameSettings`, `GameHistory`
- `src/services/cardSelector.ts` — Filter by divisor, weighted selection
- `src/services/storage.ts` — `initializeCards()`, `updateCard()`, `parseCardQuestion()`, `toggleFeature50()`
- `src/composables/useGameStore.ts` — Game state + scoring
- `src/utils/questionFormatter.ts` — `"18:3"` → `"18 : 3"` display formatting
- `src/components/ChickenMascot.vue` — "Diva" mascot SVG
