# Flashcards Monorepo

**pnpm workspace** with Vue 3 / Quasar / TypeScript educational apps.

- **[apps/1x1](apps/1x1/AGENTS.md)** — Multiplication tables
- **[apps/div](apps/div/AGENTS.md)** — Division training
- **[apps/eta](apps/eta/AGENTS.md)** — Homework time estimator
- **[apps/lwk](apps/lwk/AGENTS.md)** — Spelling trainer
- **[apps/pum](apps/pum/AGENTS.md)** — Plus & Minus training
- **[apps/voc](apps/voc/AGENTS.md)** — Vocabulary learning
- **[packages/shared](packages/shared/AGENTS.md)** — Common code `@flashcards/shared`

## Caveman speech

Respond like smart caveman. Cut all filler, keep technical substance.

- Drop articles (a, an, the), filler (just, really, basically, actually).
- Drop pleasantries (sure, certainly, happy to).
- No hedging. Fragments fine. Short synonyms.
- Technical terms stay exact. Code blocks unchanged.
- Pattern: [thing] [action] [reason].

## Commands

```bash
# Full validation (parallel via run-p: format + lint + types + spell + test)
pnpm run check

# format: pnpm run format  (biome check --write .)
# lint:   pnpm run lint    (eslint --fix .)
# types:  pnpm run types

# Single app
pnpm --filter {app} run lint 2>&1
pnpm --filter {app} run test 2>&1

# E2E
pnpm run cy:run              # all apps
pnpm run cy:run:{app}        # one app (1x1, div, eta, lwk, pum, voc)
pnpm run cy:run:{app} -- --spec "cypress/e2e/{spec}.cy.ts" 2>&1

# Dead code analysis
pnpm knip

# Biome unsafe fix
pnpx @biomejs/biome lint --write --unsafe .
```

Commit only after `pnpm run check` + `pnpm run cy:run` pass. Commit header only.

## Workflow Rules

- Maintain AGENTS.md when hitting non-obvious bugs: app-local lessons in `apps/*/AGENTS.md`, cross-cutting in root.
- If same error twice in one session → belongs in AGENTS.md.
- Before writing new code, check `packages/shared/` and other apps for existing implementations.
- Logic/types/constants/components/composables used by >1 app → `packages/shared/`.

## Code Rules

- No `any`. Type refs as `ref<Type | null>(null)`. No `!` assertions. `import type` for type-only.
- `globalThis` not `window`/`global`. `for...of` not `.forEach()`.
- `Number.parseInt(str, 10)` not `parseInt`. `.sort((a,b) => a.localeCompare(b))`.
- Cognitive complexity < 15.
- No duplicate strings (3+) — use `TEXT_DE` from `@flashcards/shared`.
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
└── cypress.config.base.ts
```

**Root `tsconfig.json`** references all 6 apps + `packages/shared`.

## Shared Package Imports

```typescript
import { TEXT_DE, useKeyboardContinue } from '@flashcards/shared'
import { AppFooter } from '@flashcards/shared/components'
import { HistoryPage, GameOverPage } from '@flashcards/shared/pages'
import { cardSelection } from '@flashcards/shared/utils'
import { quasarStubs } from '@flashcards/shared/test-utils'
```

Export paths: `.`, `./components`, `./pages`, `./layouts`, `./utils`, `./test-utils`

## Game Modes

`SessionMode`: `'standard' | 'endless-level1' | 'endless-level5' | '3-rounds'`

Key helpers in `gameModeUtils.ts`: `isEndlessMode()`, `handleNextCard()`, `endlessNextCard()`, `endlessLevel5NextCard()`, `filterLevel1Cards()`, `filterBelowMaxLevel()`, `avoidConsecutiveRepeat()`, `repeatCards()`

## Game State Flow

All game apps (1x1, voc, lwk, div, pum) via `useGameStateFlow` (from `@flashcards/shared`):

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
6. **Biome + `exactOptionalPropertyTypes`** — `noDelete` auto-fix to `= undefined` causes TS2412. Use `biome-ignore lint/performance/noDelete`.
7. **`delete` vs `noDelete`** — biome tries to "fix" `delete obj.prop` to `obj.prop = undefined`, which breaks with `exactOptionalPropertyTypes: true`. Use `// biome-ignore lint/performance/noDelete` comments when needed.
8. **Vite 8 + workbox-window** — needs explicit alias in `vite.config.base.ts` (`workbox-window` → `.prod.es5.mjs`) because workbox-window has no `exports` field and rolldown (Vite 8) won't resolve it.
9. **pnpm minimumReleaseAge** — `pnpm-workspace.yaml` has `minimumReleaseAge: 20160` (2 weeks). Installing brand-new packages may fail. Add to `minimumReleaseAgeExclude` if needed.
10. **.npmrc hoisting** — vue, vite, quasar, eslint, typescript, @types/*, esbuild, rollup are hoisted to root `node_modules` via `public-hoist-pattern[]`. Shared deps work because of this.
11. **`unicorn/prefer-string-replace-all`** — ESLint doesn't have this rule; `eslint-disable-next-line` for it errors. Use `.replace()` with `/g` flag.
12. **Stub by alias** — component imported as `import X from './Y.vue'` → stub key is `X`, not `Y`.
13. **`migrateStorageKeys()`** — each app's `main.ts` calls `migrateStorageKeys(oldPrefix, newPrefix)` to migrate localStorage from old key format. Don't remove until the TODO date passes.
14. **PWA uses Quasar Dialog** — the `updateSW` callback opens `Dialog.create({...})` (not `confirm()`). See pattern in `apps/*/src/main.ts`.
15. **SonarCloud lcov path fix** — CI runs `sed 's|^SF:src/|SF:$dir/src/|'` on coverage files because Vitest generates relative paths but SonarCloud resolves from project root.

## PWA Config

```typescript
// apps/*/src/main.ts
import { registerSW } from 'virtual:pwa-register'
import { Dialog } from 'quasar'
registerSW({
  immediate: true,
  onNeedRefresh() {
    Dialog.create({
      message: TEXT_DE.shared.pwa.update.confirmMessage,
      cancel: true,
      persistent: true
    }).onOk(() => void updateSW(true))
  }
})

// vite config (via vite.config.base.ts)
VitePWA({ registerType: 'prompt', includeAssets: ['favicon.ico', ...], workbox: {...} })
```

## SonarCloud

Scans all 6 apps + `packages/shared`.

View issues: `https://sonarcloud.io/project/issues?id=entorb_flashcards`

API fetch:

```bash
curl "https://sonarcloud.io/api/issues/search?componentKeys=entorb_flashcards&ps=500" | jq '.'
```
