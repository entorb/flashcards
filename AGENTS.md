# Flashcards Monorepo

**pnpm workspace** with Vue 3 / Quasar / TypeScript educational apps sharing common code.

- **[apps/1x1](apps/1x1/AGENTS.md)** — Multiplication tables
- **[apps/voc](apps/voc/AGENTS.md)** — Vocabulary learning
- **[apps/lwk](apps/lwk/AGENTS.md)** — Spelling trainer
- **[apps/eta](apps/eta/AGENTS.md)** — Homework time estimator
- **[packages/shared](packages/shared/AGENTS.md)** — Common code

## Commands

```bash
# Validation (run after changes)
pnpm run check                # format + lint + types + spell + test
pnpm run cy:run               # all Cypress E2E tests
pnpm run cy:run:{app}         # E2E for one app (1x1, voc, lwk, eta)

# Single Cypress spec (for debugging)
pnpm run cy:run:{app} -- --spec "cypress/e2e/{spec}.cy.ts" 2>&1

# Per-app commands
pnpm --filter {app} run lint 2>&1
pnpm --filter {app} run test 2>&1

# Formatting (auto-fix)
pnpm run format
```

Commit only after `pnpm run check` and `pnpm run cy:run` pass. Commit header only, no body.

## Workflow Rules

- Before running OS commands (`head`, `tail`, `grep`, etc.), check the environment (Linux vs Windows) and use the appropriate equivalent (e.g., PowerShell commands on Windows).

**Maintaining AGENTS.md (mandatory):**

- When you encounter a non-obvious bug, surprising behavior, or a workaround, add it to the relevant `AGENTS.md` file immediately — don't wait until the end.
- Add to `Critical Gotchas` if it's a "never do X" lesson. Add to `Required Patterns` or `Code Rules` if it's a coding convention. Add to `Workflow Rules` if it's about process.
- Use the app-specific `AGENTS.md` (`apps/*/AGENTS.md`) for app-local lessons and the root `AGENTS.md` for cross-cutting lessons.
- Before starting work, read the relevant `AGENTS.md` files to avoid repeating known mistakes.
- If you hit the same error twice in one session, that's a strong signal it belongs in `AGENTS.md`.

## Code Rules

**Type Safety & Fail Fast:**

- No `any` — use proper types
- Type all refs: `ref<Type | null>(null)`
- No `!` assertions — use null checks
- Use `import type` for type-only imports
- Validate and sanitize inputs at entry points (function params, user input, storage reads) — fail early with clear errors instead of propagating `undefined`/`null` through the code
- Prefer strict return types over loose unions — a function that always returns a value is simpler than one that might return `undefined`

**Required Patterns:**

- `globalThis` not `window`/`global`
- `for...of` not `.forEach()`
- `Number.parseInt(str, 10)` not `parseInt(str)`
- String sort: `items.sort((a, b) => a.localeCompare(b))`
- Cognitive complexity < 15 — extract functions
- No duplicate strings (3+) — use `TEXT_DE` or constants
- All UI text in `TEXT_DE` from `@flashcards/shared`

**DRY (critical for this monorepo):**

- Before writing new code, always search `packages/shared/` and other apps for existing implementations
- If logic, types, constants, components, or composables are used by more than one app, they must live in `packages/shared/`
- Never duplicate UI text — all strings go in `TEXT_DE`
- Never duplicate constants — use shared `constants.ts` or app-level `constants.ts`
- When adding a feature to one app, check if another app already solved it and extract to shared
- Refactor app-specific code to shared as soon as it becomes reusable

**Tests:**

- Unit tests: `.spec.ts` suffix, import functions (don't copy implementations)
- E2E tests: `data-cy` locators only (not text/ids)

**Suppressing warnings (rare):**

```vue
<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<q-input autofocus />
<!-- eslint-enable vuejs-accessibility/no-autofocus -->
```

## Architecture

```text
flashcards/
├── apps/
│   ├── 1x1/              # Port 5173/4173
│   ├── voc/              # Port 5174/4174
│   ├── lwk/              # Port 5175/4175
│   └── eta/              # Port 5176/4176
├── packages/shared/       # @flashcards/shared
├── tsconfig.base.json     # Shared TS config (apps extend)
├── vite.config.base.ts    # Shared Vite config (apps mergeConfig())
└── vitest.config.base.ts  # Shared Vitest config (apps call getVitestConfig())
```

## Shared Package Imports

```typescript
import { TEXT_DE, useKeyboardContinue } from '@flashcards/shared'
import { AppFooter, GameAnswerFeedback } from '@flashcards/shared/components'
import { HistoryPage, GameOverPage } from '@flashcards/shared/pages'
import { cardSelection } from '@flashcards/shared/utils'
```

Export paths: `.`, `./components`, `./pages`, `./layouts`, `./utils`, `./test-utils`

## Key Files

| File                                                  | Purpose                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| `packages/shared/src/text-de.ts`                      | All UI strings (German)                                         |
| `packages/shared/src/types.ts`                        | Base types: `BaseCard`, `GameStats`, `SessionMode`, `FocusType` |
| `packages/shared/src/constants.ts`                    | `MIN_LEVEL`, `MAX_LEVEL`, `LEVEL_COLORS`, bonus values          |
| `packages/shared/src/services/storage.ts`             | localStorage/sessionStorage CRUD                                |
| `packages/shared/src/services/scoring.ts`             | Points calculation                                              |
| `packages/shared/src/composables/useBaseGameStore.ts` | Game state factory                                              |
| `packages/shared/src/composables/useGameStateFlow.ts` | Game flow: init → play → results                                |
| `packages/shared/src/utils/gameModeUtils.ts`          | Endless/3-rounds mode logic                                     |
| `packages/shared/src/utils/cardSelection.ts`          | Weighted card selection by focus                                |
| `apps/*/src/constants.ts`                             | `BASE_PATH`, `STORAGE_KEYS`, `GAME_STATE_FLOW_CONFIG`           |
| `apps/*/src/types.ts`                                 | App-specific `Card`, `GameSettings`, `GameHistory`              |

## Game Modes

`SessionMode`: `'standard' | 'endless-level1' | 'endless-level5' | '3-rounds'`

Helpers in `gameModeUtils.ts`: `isEndlessMode()`, `handleNextCard()`, `endlessNextCard()`, `endlessLevel5NextCard()`, `filterLevel1Cards()`, `filterBelowMaxLevel()`, `avoidConsecutiveRepeat()`, `repeatCards()`

## Game State Flow

All apps follow the same pattern via `useGameStateFlow`:

1. **HomePage**: Save settings to localStorage, save selected cards to sessionStorage, navigate to GamePage
2. **GamePage**: Read cards from sessionStorage, update card level/time in localStorage after each answer, save result to sessionStorage on finish
3. **GameOverPage**: Load result from sessionStorage, calculate daily bonuses, save history+stats to localStorage atomically, clear sessionStorage

Each app defines a `GAME_STATE_FLOW_CONFIG` in `src/constants.ts` mapping storage keys.

## Critical Gotchas

1. **Never** import `TEXT_DE`/`BASE_PATH` in `vite.config.ts` — causes ESM errors. Hardcode values.
2. **Never** use tsconfig inheritance in `tsconfig.node.json` — causes `vue-tsc` to hang. Keep duplicated.
3. **Never** use vitest workspace config — causes path resolution failures. Use per-app configs.
4. **Never** use `registerType: 'autoUpdate'` in PWA — returns undefined. Use `'prompt'`.
5. **Stub by alias**: When a component is imported as `import FoxIcon from './FoxMascot.vue'`, stub as `FoxIcon` not `FoxMascot`.
6. **BASE_PATH** must be defined in both `src/constants.ts` AND hardcoded in `vite.config.ts`.

## PWA Config

```typescript
// apps/*/src/main.ts
registerSW({
  immediate: true,
  onNeedRefresh() {
    if (confirm(TEXT_DE.pwaUpdate.confirmMessage)) {
      updateSW(true)
    }
  }
})

// apps/*/vite.config.ts
VitePWA({ registerType: 'prompt' })
```

## SonarCloud

View issues: `https://sonarcloud.io/project/issues?id=entorb_flashcards`

API fetch:

```bash
curl "https://sonarcloud.io/api/issues/search?componentKeys=entorb_flashcards&ps=500" | jq '.'
```
