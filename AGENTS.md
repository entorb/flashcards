# Flashcards Monorepo

**pnpm workspace** with Vue 3 / Quasar / TypeScript educational apps.

- **[apps/1x1](apps/1x1/AGENTS.md)** — Multiplication tables
- **[apps/div](apps/div/AGENTS.md)** — Division training
- **[apps/eta](apps/eta/AGENTS.md)** — Homework time estimator
- **[apps/lwk](apps/lwk/AGENTS.md)** — Spelling trainer
- **[apps/pum](apps/pum/AGENTS.md)** — Plus & Minus training
- **[apps/voc](apps/voc/AGENTS.md)** — Vocabulary learning
- **[packages/shared](packages/shared/AGENTS.md)** — Common code `@flashcards/shared`

## Checks

run after each modification

- `scripts/chk_js_format.sh`

run before committing

- `scripts/run_checks.sh` (runs all `chk_*.sh` sequentially)

If a check fails → fix → rerun that check only → repeat → final `scripts/run_checks.sh`.

## Cypress E2E Tests

```bash
# E2E
pnpm run cy:run              # all apps
pnpm run cy:run:{app}        # one app (1x1, div, eta, lwk, pum, voc)
pnpm run cy:run:{app} -- --spec "cypress/e2e/{spec}.cy.ts" 2>&1
```

### Debugging a single failing spec

- Run exactly one spec — the `-- --spec` above does NOT filter (the `--` swallows the flag) — load the `e2e-test-debugging` skill for the exact command and debugging flow.
- Seed test state via `cy.visit('/', { onBeforeLoad(win) { win.localStorage.setItem('fc-<app>-cards', ...) } })` in `beforeEach`, NOT app UI clicks — faster and deterministic.

## Playwright E2E Tests

Runs in parallel to Cypress (same coverage, own job in `check.yml`). Config mirrors Cypress: `playwright.config.base.ts` at root + `playwright.config.ts` per app (each starts its own dev server via `webServer`). Tests live in `apps/*/playwright/tests/` (specs in `*.spec.ts`, helpers in `support/`).

```bash
# E2E
pnpm run pw:run              # all apps (sequentially, each starts its own dev server)
pnpm run pw:run:{app}        # one app (1x1, div, eta, lwk, pum, voc)
pnpm run pw:open:{app}       # Playwright UI mode
pnpm --filter {app} exec playwright test --spec "playwright/tests/{spec}.spec.ts" 2>&1
```

### Debugging a single failing spec

- Load the `e2e-test-debugging` skill for the exact single-spec command and debugging flow.
- `data-cy` locators via `page.getByTestId(...)` (configured in `use.testIdAttribute`). Text buttons use `page.getByRole('button', { name: ... })`.
- Seed state via `page.addInitScript(...)` in `beforeEach` BEFORE `page.goto('/')` (re-applies on every navigation incl. reloads, like Cypress `onBeforeLoad`).
- Gotchas:
  - SPA routes load lazily — after a navigation click always `await expect(page).toHaveURL(...)` before touching the next page's elements (a too-early click hits the previous page).
  - LWK hidden mode: the GO button swallows a click right after mount — wait ~200ms before clicking it (same as the Cypress helper).
  - Vitest excludes `playwright/**` (`vitest.config.base.ts`) so Playwright `.spec.ts` files don't run as unit tests.
  - Playwright output dirs (`test-results/`, `playwright-report/`) are gitignored.

## Workflow Rules

- Maintain AGENTS.md when hitting non-obvious bugs: app-local lessons in `apps/*/AGENTS.md`, cross-cutting in root.
- If same error twice in one session → belongs in AGENTS.md.
- Before writing new code, check `packages/shared/` and other apps for existing implementations.
- Logic/types/constants/components/composables used by >1 app → `packages/shared/`.
- New/changed game features (scoring, modes, bonus rules) must also update the user-facing Info page text in `packages/shared/src/text-de.ts` (rendered via `packages/shared/src/pages/InfoPage.vue` per `appName`).

## Code Rules

- No `any`. Type refs as `ref<Type | null>(null)`. No `!` assertions. `import type` for type-only.
- `globalThis` not `window`/`global`. `for...of` not `.forEach()`.
- `Number.parseInt(str, 10)` not `parseInt`. `.sort((a,b) => a.localeCompare(b))`.
- Cognitive complexity < 15.
- No duplicate strings (3+) — use `TEXT_DE` from `@flashcards/shared`.
- `Math.random()` is fine for non-security game randomness (card shuffle/selection). Sonar flags it (`typescript:S2245`) — append `// NOSONAR typescript:S2245` on the same line with a one-line rationale comment above it.
- No commented-out code (Sonar `Web:AvoidCommentedOutCodeCheck`). Delete dead code; if an option/feature is intentionally disabled, note it in a comment instead of keeping the block commented out.
- Unit tests: `.spec.ts` suffix. E2E: `data-cy` locators only.

## Architecture

```text
flashcards/
├── apps/
│   ├── 1x1/               # Port 5173/4173
│   ├── voc/               # Port 5174/4174
│   ├── lwk/               # Port 5175/4175
│   └── eta/               # Port 5176/4176
│   ├── div/               # Port 5177/4177
│   └── pum/               # Port 5178/4178
├── packages/shared/       # @flashcards/shared
├── vite.config.base.ts    # baseViteConfig + plugin factories
├── vite.config.factory.ts # createAppViteConfig(AppConfig)
├── vitest.config.base.ts  # getVitestConfig(rootDir)
├── cypress.config.base.ts
└── playwright.config.base.ts
```

**Root `tsconfig.json`** references all 6 apps + `packages/shared`.

## App Conventions

All apps (except eta) share the game store pattern (see Game State Flow). Common facts, documented once here:

- Stack: Vue 3, Quasar, TypeScript, Vite, Vitest, Cypress, Playwright (all apps incl. eta)
- `MAX_CARDS_PER_GAME = 10` in each app's `src/constants.ts`
- Storage keys: source of truth `STORAGE_KEYS` in `src/constants.ts`, actual keys prefixed `fc-<app>-`
- Mascots: 1x1 Groundhog (`GroundhogMascot.vue`) • div Chicken (`ChickenMascot.vue`) • voc Fox (`FoxMascot.vue`) • lwk Eisi (`EisiMascot.vue`) • pum Raccoon (`RaccoonMascot.vue`)
- Each app `AGENTS.md` documents only app-specific mechanics (scoring, card generation, filtering) — shared rules live here

## Shared Package Imports

```typescript
import { TEXT_DE, useKeyboardContinue, createGameStoreFactory } from '@flashcards/shared'
import { AppFooter } from '@flashcards/shared/components'
import { HistoryPage, GameOverPage, NumericGamePage } from '@flashcards/shared/pages'
import { cardSelection } from '@flashcards/shared/utils'
import { quasarStubs } from '@flashcards/shared/test-utils'
```

Export paths: `.`, `./components`, `./pages`, `./utils`, `./test-utils`

## Game Modes

`SessionMode`: `'standard' | 'endless-level1' | 'endless-level5' | '3-rounds'`

Key helpers in `gameModeUtils.ts`: `isEndlessMode()`, `handleNextCard()`, `filterLevel1Cards()`, `filterBelowMaxLevel()`, `avoidConsecutiveRepeat()`, `repeatCards()`

`handleNextCard()` always picks a random next card from the current game's cards: standard/3-rounds pick randomly without replacement (swap-to-front, keeps index-based progress), endless modes pick randomly from the shrinking pool (cards removed when mastered). `repeatCards()` shuffles each 3-rounds round independently.

`FocusType`: `'weak' | 'slow'` (medium/strong commented out)

## Game State Flow

All game apps (1x1, voc, lwk, div, pum) via the shared game store factory (from `@flashcards/shared`):

- Numeric apps (1x1, div, pum): `createGameStoreFactory<Card, GameHistory, GameSettings>({ storage, filterCards, ... })` in `src/composables/useGameStore.ts`
- Deck apps (voc, lwk): `createDeckGameStore<Card, GameHistory, GameSettings>({ storage, ... })` in `src/composables/useGameStore.ts`
- Both wrap `useBaseGameStore` + `useGameStateFlow` internally — apps never call them directly

1. **HomePage** → save settings to localStorage, selected cards to sessionStorage, navigate to GamePage
2. **GamePage** → read cards from sessionStorage, update card level/time in localStorage per answer, save result to sessionStorage on finish
3. **GameOverPage** → load result from sessionStorage, calculate bonuses, save history+stats to localStorage atomically, clear sessionStorage

Each app defines `GAME_STATE_FLOW_CONFIG` in `src/constants.ts`.

Exception: **eta** has its own session-based architecture (no game store pattern).

## Critical Gotchas

1. **`vite.config.ts`** — never import `TEXT_DE`/`BASE_PATH` (ESM errors). Hardcode values.
2. **`tsconfig.node.json`** — never use inheritance (`vue-tsc` hangs). Duplicate config.
3. **Vitest workspace config** — causes path resolution failures. Per-app configs only.
4. **PWA `registerType`** — must be `'prompt'` (`'autoUpdate'` returns undefined).
5. **Biome + Vue** — never prefix `<script setup>` vars with `_`; biome can't see `<template>` usage. Fixed in `biome.json`: `noUnusedImports`/`noUnusedVariables` off for `**/*.vue`.
6. **Biome + `exactOptionalPropertyTypes`** — biome tries to "fix" `delete obj.prop` to `obj.prop = undefined`, which breaks with `exactOptionalPropertyTypes: true` (TS2412). Use `// biome-ignore lint/performance/noDelete` comments when needed.
7. **Vite 8 + workbox-window** — needs explicit alias in `vite.config.base.ts` (`workbox-window` → `.prod.es5.mjs`) because workbox-window has no `exports` field and rolldown (Vite 8) won't resolve it.
8. **pnpm minimumReleaseAge** — `pnpm-workspace.yaml` has `minimumReleaseAge: 20160` (2 weeks). Installing brand-new packages may fail. Add to `minimumReleaseAgeExclude` if needed.
9. **.npmrc hoisting** — vue, vite, quasar, eslint, typescript, @types/*, esbuild, rollup are hoisted to root `node_modules` via `public-hoist-pattern[]`. Shared deps work because of this.
10. **`unicorn/prefer-string-replace-all`** — ESLint doesn't have this rule; `eslint-disable-next-line` for it errors. Use `.replace()` with `/g` flag.
11. **Stub by alias** — component imported as `import X from './Y.vue'` → stub key is `X`, not `Y`.
12. **Storage loads validate types** — every localStorage/sessionStorage read goes through `loadJSON`/`loadSessionJSON`/`loadArray` (or ops factories) in `packages/shared/src/services/storage.ts` with runtime validators from `@flashcards/shared/utils/validators`. Missing keys, corrupt JSON, or wrong-typed values fall back to defaults (arrays drop invalid items). Do not add blind `JSON.parse(...) as T` casts or legacy migration shims — invalid data self-heals to defaults instead.
13. **PWA uses Quasar Dialog** — the `updateSW` callback opens `Dialog.create({...})` (not `confirm()`). See pattern in `apps/*/src/main.ts`.
14. **SonarCloud lcov path fix** — CI runs `sed 's|^SF:src/|SF:$dir/src/|'` on coverage files because Vitest generates relative paths but SonarCloud resolves from project root.

## PWA Config

`registerSW` lives in each `apps/*/src/main.ts` (see file for the pattern): `immediate: true`, `onNeedRefresh` opens a Quasar `Dialog`. Vite config via `vite.config.base.ts` (`VitePWA`). Key constraint: `registerType` must be `'prompt'`.

## SonarCloud

Issues: `https://sonarcloud.io/project/issues?id=entorb_flashcards`
API fetch: `curl "https://sonarcloud.io/api/issues/search?componentKeys=entorb_flashcards&ps=500" | jq '.'`
