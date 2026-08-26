# div — Division Training App

PWA for division fact practice with adaptive difficulty.

## Quick Reference

- `BASE_PATH = 'fc-div'`
- `DEFAULT_RANGE = [2, 3, 4, 5, 6, 7, 8, 9]`

## Game Mechanics

- `GameSettings = { select: number[], focus, levels }` (extends `BaseGameSettings`) — always `number[]`, no `'all'`/`'x²'`
- Cards: `{ question: "18:3", answer: 6 }`
- Card set: 36 triples (X, Y ∈ [2,9], X ≤ Y, Z=X×Y) → 64 cards: non-square triples (X<Y) yield "Z:X"→Y and "Z:Y"→X (56), square triples (X=Y) yield "X²:X"→X (8)
- Extended range: `≤50` toggle adds cards where Z ≤ 50 with divisor ∈ {2..9, 11, 12}; base cards (both factors ≤ 9) are never removed
- Scoring difficulty: divisor (number after `:`), level factor: `6 - level`, time bonus: +5 if beating record
- Correct: level +1 (max 5), time updated. Wrong: level -1 (min 1)
- Lazy-loading: cards created on first answer
- Filtering: by divisor only

## Key Files

- `src/services/storage.ts` — `initializeCards()`, `getVirtualCardsForRange()` (accepts optional `storedCards` param — pass the page's loaded cards so computed re-renders after reset), `toggleFeature50()`, `parseCardQuestion()`
- `src/services/cardSelector.ts` — filter by divisor, weighted selection
- `src/utils/questionFormatter.ts` — `"18:3"` → `"18 : 3"` display formatting
- `src/components/ChickenMascot.vue` — "Diva" mascot
