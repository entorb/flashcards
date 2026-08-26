# eta — Homework Time Estimator App

PWA for estimating homework task completion time using linear regression.

## Quick Reference

- `BASE_PATH = 'fc-eta'`
- `STORAGE_PREFIX = 'fc-eta-'` (single key `fc-eta-session` in sessionStorage)

## Session Flow

1. Start: input total tasks, begin session
2. Track: periodically input completed tasks (must increase)
3. Estimate: linear regression predicts remaining time (requires ≥ 2 measurements)
4. Complete: when completed tasks ≥ total tasks

## Key Files

- `src/constants.ts` — `BASE_PATH`, `STORAGE_KEYS`
- `src/services/regression.ts` — `calculateRegression()`, `predictRemainingTime()`
- `src/services/storage.ts` — session persistence
- `src/composables/useEtaStore.ts` — session state management

## Note

Does NOT use the shared game store pattern (`createGameStoreFactory`/`createDeckGameStore`). Own session-based architecture, no card levels.
