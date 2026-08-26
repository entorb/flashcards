# pum — Plus & Minus Training App

PWA for addition and subtraction fact practice with adaptive difficulty.

## Quick Reference

- `BASE_PATH = 'fc-pum'`
- `DEFAULT_OPERATIONS = ['plus', 'minus']`
- `DEFAULT_DIFFICULTIES = ['simple', 'medium', 'advanced']`

## Game Mechanics

- `GameSettings = { operations: Operation[], difficulties: Difficulty[], focus, levels }` (extends `BaseGameSettings`); `Operation = 'plus' | 'minus'`, `Difficulty = 'simple' | 'medium' | 'advanced'`
- Cards: `{ question: "7+3" | "15-8", answer: number }`
- Card set fixed at 420 cards (no extended range): 2 operations × 3 difficulties
  - Simple: X in [1..10], Y in [1..10], X >= Y → 55 cards per operation
  - Medium: X in [11..20], Y in [1..10] → 100 cards per operation
  - Advanced: X in [11..20], Y in [11..20], X >= Y → 55 cards per operation
- Scoring difficulty: simple=1, medium=2, advanced=4, +1 for minus
- Level factor: `6 - level`, time bonus: +5 if beating record
- Correct: level +1 (max 5), time updated. Wrong: level -1 (min 1)
- Lazy-loading: cards created on first answer
- Filtering: by operation (plus/minus) AND difficulty (simple/medium/advanced)

## Key Files

- `src/services/storage.ts` — `initializeCards()`, `parseCardQuestion()`, `getDifficultyForCard()`
- `src/services/cardSelector.ts` — filter by operation + difficulty, weighted selection
- `src/utils/questionFormatter.ts` — `"7+3"` → `"7 + 3"` display formatting
- `src/components/RaccoonMascot.vue` — "Plumi" mascot
