# Flashcards Monorepo

**pnpm workspace** with three Vue.js/Quasar educational apps sharing common code.

- **[apps/1x1](apps/1x1/AGENTS.md)**
- **[apps/voc](apps/voc/AGENTS.md)**
- **[apps/lwk](apps/lwk/AGENTS.md)**
- **[packages/shared](packages/shared/AGENTS.md)**

## Workflow Rules

- ❌ No commits (propose to user)
- ✅ Run `pnpm run check` after changes (format, lint, types, spell, tests)
- ✅ Run `pnpm run cy:run:1x1` / `pnpm run cy:run:voc` / `pnpm run cy:run:lwk` after phases
- ✅ All text in `@flashcards/shared/src/text-de.ts`
- ✅ Unit tests: `.spec.ts` suffix, import functions (don't copy)
- ✅ E2E tests: `data-cy` locators (not text/ids)

## Critical Code Rules

**Type Safety:**

- ❌ No `any` → use proper types
- ✅ Type all refs: `ref<HTMLInputElement | null>(null)`
- ❌ No `!` assertions → use null checks
- ✅ Consolidate imports: `import type { Card, SelectionType } from '@/types'`

**Patterns:**

- ✅ `globalThis` not `window` or `global`
- ✅ `for...of` not `.forEach()`
- ✅ `Number.parseInt(str, 10)` not `parseInt(str)`
- ✅ `items.sort((a, b) => a.localeCompare(b))` for strings
- ✅ Cognitive complexity < 15 → extract functions
- ✅ No duplicate strings (3+) → use `TEXT_DE` or constants

**Suppressing warnings (rare):**

```typescript
// eslint-disable-next-line sonarjs/todo-tag
/** TODO: temporary migration code */
```

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

### ❌ DO NOT Do These

1. **Import TEXT_DE/BASE_PATH in `vite.config.ts`** → Causes ESM errors. Hardcode instead.
2. **Use tsconfig inheritance in `tsconfig.node.json`** → Causes `vue-tsc` to hang. Keep duplicated.
3. **Use vitest workspace config** → Causes path resolution failures. Use per-app configs.
4. **Use `registerType: 'autoUpdate'` in PWA** → Returns undefined. Use `'prompt'`.

### ✅ BASE_PATH Pattern

Each app defines `BASE_PATH` in `src/constants.ts` AND `vite.config.ts`:

Used for: router base, Cypress baseUrl, DB usage-stats

## End-of-Game Flow (Critical Pattern)

**Single-save architecture** (prevents data loss):

1. **GamePage** → `finishGame()`:
   - Updates in-memory state (history + stats WITHOUT bonus)
   - Saves game result to **sessionStorage**
   - Clears game state from **sessionStorage**
   - Does NOT save to **localStorage** yet
   - Navigates to GameOverPage

2. **GameOverPage** → `onMounted()`:
   - Loads game result from sessionStorage
   - Calculates daily bonuses
   - Adds bonus to in-memory history/stats (mutates props by reference)
   - **Single save to localStorage immediately** (complete data)
   - Clears sessionStorage on home navigation

**Why:** Saves data as soon as GameOverPage loads, not on navigation. User can close tab without data loss.

## PWA Critical Config

**Service Worker Registration** (`apps/*/src/main.ts`):

```typescript
registerSW({
  immediate: true, // Check on every load
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
  registerType: 'prompt' // NOT 'autoUpdate' (returns undefined)
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
