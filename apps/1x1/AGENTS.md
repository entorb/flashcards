# Vyvit's 1x1 Learning App (1x1)

Developer-facing summary, implementation notes and important gotchas for the 1x1 app.

## Overview

Progressive web app to help primary-school students practice multiplication tables (default: 3×3..9×9). Offline-capable, PWA-ready, adaptive learning with gamified scoring.

## Quick Facts

- BASE_PATH: `fc-1x1` (see `src/constants.ts`)
- DEFAULT_RANGE: `[3,4,5,6,7,8,9]` (28 base cards where y ≤ x)
- MAX_CARDS_PER_GAME: `10`
- Storage keys: `1x1-cards`, `1x1-history`, `1x1-stats`, `1x1-range`, `1x1-game-config`, `1x1-game-result`, `1x1-daily-stats`

Note: the number `10` is intentionally skipped in ranges — there are no cards where x=10 or y=10.

## Features

- **Adaptive Learning**: Cards adjust difficulty based on performance (5 levels)
- **Extended Ranges**: Feature toggles for 1x2, 1x12, 1x20 ranges
- **Focus Settings**: Weak (harder cards), Medium (balanced), Strong (easier cards), Slow (cards with longer times)
- **Time Tracking & Bonuses**: Rewards for beating personal records
- **Squares Mode**: Practice only square multiplications
- **PWA Support**: Install as native app on devices
- **Offline Ready**: Works without internet connection

## Data Model

### Card Model (defaults)

- `question: string` (e.g., `3x4`)
- `answer: number` (e.g., `12`)
- `level: number` (1..5) — default `1`
- `time: number` (seconds) — default `60`

## Game Mechanics

### Extended Ranges (feature toggles)

- `1x2`: adds 2×2..2×9
- `1x12`: adds 11/12 cross-products with 3..9 (1x2 recommended)
- `1x20`: adds 13..20 and auto-enables 1x12

Ranges are stored as arrays of enabled numbers (not min/max). Toggling affects visibility only; stored progress is preserved.

### Lazy-loading Behavior (`updateCard`)

`updateCard(question, updates)` semantics:

- If card exists: apply `updates` (level/time).
- If missing: create with defaults (`level=1`, `time=60`) merged with `updates`.

Game flow for ranges:

1. Filter candidate cards by selection and range membership.
2. Present card (may not exist yet).
3. On answer, call `updateCard()` to create/update the card.
4. Persist for future games.

### Card Selection Algorithm

1. Filter by selected numbers (OR logic: x OR y selected) and range membership.
2. Optional: squares-only filter.
3. Apply focus weights ('weak', 'strong', 'medium', 'slow').
4. Weighted random pick up to `MAX_CARDS_PER_GAME`.

Focus weights:

- 'weak': prioritize lower level cards (level 1 → 5× weight, level 5 → 1× weight)
- 'strong': prioritize higher level cards (level 1 → 1× weight, level 5 → 5× weight)
- 'medium': medium levels (level 1 → 1×, 2 → 3×, 3 → 5×, 4 → 3×, 5 → 1× weight)
- 'slow': prioritize cards with higher time (slower previous answers)

### Scoring

points = min(x, y) + (6 - level) + time_bonus

- Base: `min(x,y)`
- Level bonus: `6 - level` (levels 1..5 → +5..+1)
- Time bonus: awarded when beating previous `time` for the card

Card updates on answer:

- Correct: `level = min(level + 1, 5)`, `time = actualAnswerTime`
- Wrong: `level = max(level - 1, 1)`

Daily bonuses: first game of day +5; every 5th game +5.

### End-of-Game Flow (single-save architecture)

1. `finishGame()` updates in-memory state and saves minimal result to `sessionStorage` (does NOT write `localStorage`).
2. `GameOverPage` loads the session result, applies bonuses, and performs a single `localStorage` save (history + stats) immediately.

This prevents data loss if the tab is closed before navigation.

## Architecture

**Stack:** Vue 3, Quasar, TypeScript, Vite, Vitest, Cypress

**Storage:** localStorage (cards, history, stats, range settings) • sessionStorage (game config, result)

### UI / UX Notes

- German strings: `packages/shared/src/text-de.ts`.
- Prefer icons for kid-friendly UI.

FlashCard UX:

- Auto-submit after expected number of digits (1-3 digits based on answer length).
- Auto-close correct answers after 3s (Enter skips).
- 3s safety delay on wrong answers.

## Key Files

- `src/constants.ts` — constants (`BASE_PATH`, `DEFAULT_RANGE`, `MAX_CARDS_PER_GAME`)
- `src/types.ts` — types (`Card`, `GameSettings`, `GameHistory`)
- `src/services/storage.ts` — persistence, `initializeCards()`, `updateCard()` (lazy-create)
- `src/services/cardSelector.ts` — filters & weighted selection
- `src/composables/useGameStore.ts` — store, scoring, autosave

## Testing

- Unit tests: Vitest (`.spec.ts`) — localStorage mocked in `src/__tests__/setup.ts`.
- E2E: Cypress (navigation + full game flow). Run `pnpm run cy:run`.

## Commands

```bash
pnpm build
pnpm test
pnpm run cy:run
```

## Notes & Gotchas

- Do not import `TEXT_DE` or `BASE_PATH` into `vite.config.ts` (ESM issues); hardcode values in config.
- Keep `tsconfig.node.json` independent to avoid `vue-tsc` hanging.
- Use `VitePWA({ registerType: 'prompt' })` (not `autoUpdate`).
- Use `globalThis` for cross-environment checks.

## See Also

- **[Root AGENTS.md](../../AGENTS.md)** - Monorepo overview
- **[Shared AGENTS.md](../../packages/shared/AGENTS.md)** - Shared code docs
