# voc — Vocabulary Learning App

PWA for English vocabulary learning with adaptive difficulty and multiple decks.

## Quick Reference

- `BASE_PATH = 'fc-voc'`
- `LEVENSHTEIN_THRESHOLD = 2`
- `DEFAULT_DECKS` in `src/constants.ts`

## Game Mechanics

- `GameSettings = { mode: 'multiple-choice' | 'blind' | 'typing', language: 'voc-de' | 'de-voc', focus, deck?, levels }` (extends `BaseGameSettings`)
- Cards: `{ voc: string, de: string }`; decks: `CardDeck { name, cards }`
- Modes: multiple-choice (base points), blind (`POINTS_MODE_BLIND = 4`), typing (`POINTS_MODE_TYPING = 8`)
- Direction bonus: `LANGUAGE_BONUS_DE_VOC = 1` extra point for de→voc
- Correct: `6 - level` points, level +1. Wrong: 0 points, level -1
- Close match (Levenshtein ≤ 2): 75% points, level unchanged
- Time bonus: +5 if beating record (typing mode only tracks time)
- Card selection: weighted by focus, time weighting is mode-specific

## Key Files

- `src/services/storage.ts` — deck operations, history, stats
- `src/services/cardSelector.ts` — weighted selection
- `src/composables/useGameStore.ts` — `createDeckGameStore` (scoring via `calculatePointsBreakdown` from `@flashcards/shared`)
