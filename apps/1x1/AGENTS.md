# 1x1 — Multiplication Tables App

PWA for multiplication table practice with adaptive difficulty.

## Quick Reference

- `BASE_PATH = 'fc-1x1'`
- `DEFAULT_RANGE = [3, 4, 5, 6, 7, 8, 9]`

## Game Mechanics

- `GameSettings = { select: number[] | 'all' | 'x²', focus, levels }` (extends `BaseGameSettings`)
- Cards: `{ question: "3x4", answer: 12 }`
- Extended ranges: `1x2` (adds 2×2..2×9), `1x12` (adds 11/12), `1x20` (adds 13..20, auto-enables 1x12)
- Scoring difficulty: `min(x, y)`, level factor: `6 - level`, time bonus: +5 if beating record
- Correct: level +1 (max 5), time updated. Wrong: level -1 (min 1)
- Lazy-loading: cards created on first answer
- Range filtering: OR logic (x OR y in selected range)

## Key Files

- `src/services/storage.ts` — `initializeCards()`, `getVirtualCardsForRange()`, `toggleFeature()`, `parseCardQuestion()`
- `src/services/cardSelector.ts` — filtering (`all`/`x²`/selection) + weighted selection
- `src/utils/questionFormatter.ts` — `"3x4"` → `"3×4"` display formatting (reorders operands for single-number selection)
- `src/components/GroundhogMascot.vue` — "Murmeltier" mascot
