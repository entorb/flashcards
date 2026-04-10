# pum — Plus & Minus Training App

PWA for addition and subtraction fact practice with adaptive difficulty.

## Quick Reference

- `BASE_PATH = 'fc-pum'`
- `DEFAULT_OPERATIONS = ['plus', 'minus']`
- `DEFAULT_DIFFICULTIES = ['simple', 'medium', 'advanced']`
- `MAX_CARDS_PER_GAME = 10`
- Stack: Vue 3, Quasar, TypeScript, Vite, Vitest, Cypress

## Data Model

```typescript
interface Card extends BaseCard {
  question: string // "7+3" or "15-8" (X op Y)
  answer: number // 10 or 7
}

interface GameSettings {
  operations: Operation[] // ['plus'] or ['minus'] or ['plus', 'minus']
  difficulties: Difficulty[] // ['simple'] or ['simple', 'medium'] etc.
  focus: FocusType
}

interface GameHistory extends BaseGameHistory {
  settings: GameSettings
}
```

## Storage Keys

Source of truth: `STORAGE_KEYS` in `src/constants.ts` (all prefixed `fc-pum-`).

Key constants: `CARDS`, `HISTORY`, `STATS`, `SETTINGS`, `SELECTED_CARDS`, `GAME_RESULT`, `DAILY_STATS`, `GAME_STATE`, `RANGE`, `GAME_CONFIG`

## Game Mechanics

- Card generation: 420 cards total across 2 operations × 3 difficulties
  - Simple: X in [1..10], Y in [1..10], X >= Y → 55 cards per operation
  - Medium: X in [11..20], Y in [1..10] → 100 cards per operation
  - Advanced: X in [11..20], Y in [11..20], X >= Y → 55 cards per operation
- No extended range feature — the card set is fixed at 420 cards
- Scoring difficulty: Y (the smaller operand, since X >= Y) + 2 bonus for minus operations
- Level factor: `6 - level`, time bonus: +5 if beating record
- Correct: level +1 (max 5), time updated. Wrong: level -1 (min 1)
- Card selection: weighted by focus (`weak`/`medium`/`strong`/`slow`)
- Lazy-loading: cards created on first answer
- Filtering: by operation (plus/minus) AND difficulty (simple/medium/advanced)

## Key Files

- `src/constants.ts` — `BASE_PATH`, `STORAGE_KEYS`, `GAME_STATE_FLOW_CONFIG`, `DEFAULT_OPERATIONS`, `DEFAULT_DIFFICULTIES`
- `src/types.ts` — `Card`, `GameSettings`, `GameHistory`, `Operation`, `Difficulty`
- `src/services/cardSelector.ts` — Filter by operation + difficulty, weighted selection
- `src/services/storage.ts` — `initializeCards()`, `updateCard()`, `parseCardQuestion()`, `getDifficultyForCard()`
- `src/composables/useGameStore.ts` — Game state + scoring
- `src/utils/questionFormatter.ts` — `"7+3"` → `"7 + 3"` display formatting
- `src/components/RaccoonMascot.vue` — "Plumi" mascot SVG
