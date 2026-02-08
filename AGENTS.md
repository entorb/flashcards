# Flashcards Monorepo

**pnpm workspace** with three Vue.js/Quasar educational apps sharing common code.

- **[apps/1x1](apps/1x1/AGENTS.md)**
- **[apps/voc](apps/voc/AGENTS.md)**
- **[apps/lwk](apps/lwk/AGENTS.md)**
- **[packages/shared](packages/shared/AGENTS.md)**

## Workflow Rules

- Run `pnpm run check` after changes (format, lint, types, spell, tests)
- Run `pnpm run cy:run:{app}` after phases
- All text in `@flashcards/shared/src/text-de.ts`
- Unit tests: `.spec.ts` suffix, import functions (don't copy)
- E2E tests: `data-cy` locators (not text/ids)
- Check for code duplication and ensure common code is moved to shared package before committing
- Commit after implementing new features, Only after `pnpm run check` and `pnpm run cy:run` pass. Only commit header, no body.

## Critical Code Rules

**Type Safety:**

- No `any` → use proper types
- Type all refs: `ref<HTMLInputElement | null>(null)`
- No `!` assertions → use null checks
- Consolidate imports: `import type { Card, SelectionType } from '@/types'`

**Patterns:**

- `globalThis` not `window` or `global`
- `for...of` not `.forEach()`
- `Number.parseInt(str, 10)` not `parseInt(str)`
- `items.sort((a, b) => a.localeCompare(b))` for strings
- Cognitive complexity < 15 → extract functions
- No duplicate strings (3+) → use `TEXT_DE` or constants

**DRY Principles:**

- Strictly adhere to Don't Repeat Yourself: Prevent code duplication across the monorepo.
- Use the shared package (`packages/shared/`) for any common code, components, composables, services, utilities, or types.
- Before implementing new features, search for existing implementations in `packages/shared/` or other apps.
- Extract duplicated code into shared modules immediately to maintain a single source of truth.
- All UI text must be centralized in `TEXT_DE` from `@flashcards/shared` to avoid string duplication.
- Use shared constants, types, and patterns consistently across all apps.
- Regularly refactor to move app-specific code to shared when it becomes reusable.

**Suppressing warnings (rare):**

```vue
<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<q-input autofocus />
<!-- eslint-enable vuejs-accessibility/no-autofocus -->
```

## Key Files

| Category        | Location                                              | Purpose                           |
| --------------- | ----------------------------------------------------- | --------------------------------- |
| **Text**        | `packages/shared/src/text-de.ts`                      | All UI strings (i18n)             |
| **Types**       | `packages/shared/src/types.ts`                        | Base types (BaseCard, GameStats)  |
|                 | `apps/*/src/types.ts`                                 | App-specific types                |
| **Constants**   | `packages/shared/src/constants.ts`                    | Shared constants                  |
|                 | `apps/*/src/constants.ts`                             | App-specific constants            |
| **Store**       | `packages/shared/src/composables/useBaseGameStore.ts` | State management factory          |
| **Storage**     | `packages/shared/src/services/storage.ts`             | localStorage operations           |
| **Composables** | `packages/shared/src/composables/`                    | Reusable logic (timers, keyboard) |

## Directory Layout

```text
flashcards/
├── apps/
│   ├── 1x1/              # Port 5173/4173
│   ├── voc/              # Port 5174/4174
│   └── lwk/              # Port 5175/4175
├── packages/shared/       # Workspace package
├── pnpm-workspace.yaml
├── tsconfig.base.json     # Shared TS config
├── vite.config.base.ts    # Shared Vite config
└── vitest.config.base.ts  # Shared Vitest config
```

## Configuration Patterns

**Base + Override Pattern:**

- TypeScript: `tsconfig.base.json` → apps extend with paths
- Vite: `vite.config.base.ts` → apps merge with `mergeConfig()`
- Vitest: `vitest.config.base.ts` → apps call `getVitestConfig(rootDir)`

## Shared Package Import Patterns

```typescript
// Main exports
import { TEXT_DE, useFeedbackTimers, useKeyboardContinue } from '@flashcards/shared'

// Component exports
import { AppFooter, AnswerFeedback } from '@flashcards/shared/components'

// Page exports
import { HistoryPage, GameOverPage } from '@flashcards/shared/pages'
```

## Critical Gotchas

**❌ DO NOT:**

1. Import TEXT_DE/BASE_PATH in `vite.config.ts` → Causes ESM errors. Hardcode instead.
2. Use tsconfig inheritance in `tsconfig.node.json` → Causes `vue-tsc` to hang. Keep duplicated.
3. Use vitest workspace config → Causes path resolution failures. Use per-app configs.
4. Use `registerType: 'autoUpdate'` in PWA → Returns undefined. Use `'prompt'`.

**✅ BASE_PATH Pattern:**
Each app defines `BASE_PATH` in `src/constants.ts` AND `vite.config.ts`

## Game State Handling

**No parallel sessions:** Each client handles one game at a time.

### HomePage → Start Game

- Store game settings to localStorage
- Store selected cards to sessionStorage
- Navigate to GamePage

### GamePage Flow

- Read cards from sessionStorage at page load
- Remove card from sessionStorage after answer
- Update card properties (level, time) in localStorage immediately
- Track game statistics in sessionStorage state
- On finish: save result to sessionStorage, navigate to GameOverPage

### GameOverPage → End-of-Game

- Load game result from sessionStorage
- Calculate daily bonuses (first game +5, every 5th game +5, time bonuses)
- Transfer statistics + bonuses to localStorage (single atomic save)
- Clear sessionStorage

## PWA Critical Config

**Service Worker** (`apps/*/src/main.ts`):

```typescript
registerSW({
  immediate: true,
  onNeedRefresh() {
    if (confirm(TEXT_DE.pwaUpdate.confirmMessage)) {
      updateSW(true)
    }
  }
})
```

**Vite Config** (`apps/*/vite.config.ts`):

```typescript
VitePWA({
  registerType: 'prompt' // NOT 'autoUpdate'
})
```

**Display Mode Detection:**

```typescript
const isStandalone =
  globalThis.matchMedia('(display-mode: standalone)').matches ||
  (globalThis.navigator as Navigator & { standalone?: boolean }).standalone === true
```

## SonarCloud

View issues: `https://sonarcloud.io/project/issues?id=entorb_flashcards`

API fetch:

```bash
curl "https://sonarcloud.io/api/issues/search?componentKeys=entorb_flashcards&ps=500" | jq '.'
```
