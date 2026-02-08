# Homework time Estimator App (eta)

PWA for estimating home work task completion time using linear regression.

## Quick Facts

- `BASE_PATH = 'fc-eta'`
- `STORAGE_PREFIX = 'fc-eta-'`

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

interface TimeEstimate {
  remainingSeconds: number
  completionTime: Date
}
```

## Game Mechanics

### Session Flow

- Start: Input total tasks, begin session
- Track: Periodically input completed tasks
- Estimate: Linear regression predicts remaining time
- Complete: When completed tasks >= total tasks

### Regression

- Requires minimum 2 measurements
- Calculates slope/intercept from time vs completed tasks
- Predicts completion time based on trend

## Architecture

**Stack:** Vue 3, Quasar, TypeScript, Vite, Vitest

### Key Files

- `src/constants.ts` — `BASE_PATH`, `STORAGE_PREFIX`
- `src/services/regression.ts` — `calculateRegression()`, `predictRemainingTime()`
- `src/services/storage.ts` — Session persistence
- `src/composables/useEtaStore.ts` — Session state management

### Storage Keys

- `fc-eta-session`: `SessionData`

## Critical Rules

- One active session at a time
- Measurements must increase completed tasks
- Regression needs >=2 measurements for estimates
- Session data stored in sessionStorage
