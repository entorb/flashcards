# lwk — Spelling Trainer App

PWA for spelling practice with adaptive difficulty and custom word decks.

## Quick Reference

- `BASE_PATH = 'fc-lwk'`
- `WORD_DISPLAY_DURATION = 3` (seconds, hidden mode)
- `LEVENSHTEIN_THRESHOLD = 1`
- `DEFAULT_DECKS` in `src/constants.ts`

## Game Mechanics

- `GameSettings = { mode: 'copy' | 'hidden', focus, deck?, levels }` (extends `BaseGameSettings`)
- Cards: `{ word: string }`; decks: `CardDeck { name, cards }`
- Copy mode: word visible while typing (levels 1-2 only)
- Hidden mode: word shown 3s then hidden (`POINTS_MODE_HIDDEN = 4`), all levels
- Correct: `6 - level` points, level +1. Wrong: 0 points, level -1
- Close match (Levenshtein = 1): 75% points, level unchanged
- Time bonus: +5 if beating record (hidden mode)
- Time tracking: 0.1-60s, 1 decimal precision

## Key Files

- `src/services/storage.ts` — deck operations, history, stats
- `src/services/cardSelector.ts` — weighted selection
- `src/composables/useGameStore.ts` — `createDeckGameStore` (scoring via `calculatePointsBreakdown` from `@flashcards/shared`)
