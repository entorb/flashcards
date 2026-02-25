# eta — Homework Time Estimator App

PWA for estimating homework task completion time using linear regression.

## Quick Reference

- `BASE_PATH = 'fc-eta'`
- `STORAGE_PREFIX = 'fc-eta-'`
- Stack: Vue 3, Quasar, TypeScript, Vite, Vitest
- No Cypress E2E tests (simpler app)

## Data Model

```typescript
interface MeasurementPoint {
  timestamp: Date
  completedTasks: number
}

interface SessionData {
  totalTasks: number
  startTime: Date
  measurements: MeasurementPoint[]
}

interface RegressionResult {
  slope: number
  intercept: number
}

interface TimeEstimate {
  remainingSeconds: number
  completionTime: Date
}
```

## Storage Keys

Source of truth: `STORAGE_KEYS` in `src/constants.ts`.

- `fc-eta-session` — `SessionData` (sessionStorage)

## Session Flow

1. Start: input total tasks, begin session
2. Track: periodically input completed tasks (must increase)
3. Estimate: linear regression predicts remaining time (requires ≥ 2 measurements)
4. Complete: when completed tasks ≥ total tasks

## Key Files

- `src/constants.ts` — `BASE_PATH`, `STORAGE_KEYS`, `THEME_COLOR`, `THEME_COLORS`
- `src/types.ts` — `MeasurementPoint`, `SessionData`, `RegressionResult`, `TimeEstimate`
- `src/services/regression.ts` — `calculateRegression()`, `predictRemainingTime()`
- `src/services/storage.ts` — Session persistence
- `src/composables/useEtaStore.ts` — Session state management

## Note

This app does not use the shared game store pattern (`useBaseGameStore`/`useGameStateFlow`). It has its own simpler session-based architecture.
