# Flashcards Monorepo

**pnpm workspace** with two Vue.js/Quasar educational apps sharing common code.

- **[apps/1x1](apps/1x1/CLAUDE.md)** - Multiplication practice (28+ cards, 5-level adaptive)
- **[apps/voc](apps/voc/CLAUDE.md)** - Vocabulary learning (custom decks, 3 modes)
- **[packages/shared](packages/shared/CLAUDE.md)** - Shared types, components, composables

## Workflow Rules

- ❌ No commits (propose to user)
- ✅ Run `pnpm run check` after changes (format, lint, types, spell, tests)
- ✅ Run `pnpm run cy:run:1x1` and `pnpm run cy:run:voc` after phases
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

## Tech Stack

Vue 3 (Composition API), Quasar, TypeScript (strict), Vite 6.x, Vitest, Cypress, ESLint, Prettier, pnpm workspaces, PWA

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
│   └── voc/              # Port 5174/4174
├── packages/shared/       # Workspace package
├── pnpm-workspace.yaml
├── tsconfig.base.json     # Shared TS config
├── vite.config.base.ts    # Shared Vite config
└── vitest.config.base.ts  # Shared Vitest config
```

## Essential Commands

```bash
# Development
pnpm dev              # Both apps
pnpm dev:1x1          # Single app
pnpm dev:voc

# Quality checks (runs all: format, lint, types, spell, test)
pnpm run check

# E2E tests
pnpm run cy:run:1x1
pnpm run cy:run:voc

# Build
pnpm build            # All apps (with type check)
pnpm build:1x1
```

## Configuration Patterns

**Base + Override Pattern:**

- TypeScript: `tsconfig.base.json` → apps extend with paths
- Vite: `vite.config.base.ts` → apps merge with `mergeConfig()`
- Vitest: `vitest.config.base.ts` → apps call `getVitestConfig(rootDir)`

**Port Assignment:**

- 1x1: Dev 5173, Preview 4173 (Vite defaults)
- voc: Dev 5174, Preview 4174 (incremented)

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

### ✅ Storage Key Pattern

Apps use prefixes to avoid collisions:

```typescript
// 1x1 app
;('1x1-cards', '1x1-history', '1x1-stats', '1x1-game-config', '1x1-game-result', '1x1-daily-stats')

// voc app
;('voc-cards', 'voc-history', 'voc-stats', 'voc-last-settings', 'voc-daily-stats')
```

### ✅ BASE_PATH Pattern

Each app defines `BASE_PATH` in `src/constants.ts`:

```typescript
export const BASE_PATH = 'fc-1x1' // or 'fc-voc', 'fc-lwk'
```

Used for: router base, Cypress baseUrl, DB collection names

**Critical:** Must be **hardcoded separately** in `vite.config.ts` (ESM issue).

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

## See Also

- **[apps/1x1/CLAUDE.md](apps/1x1/CLAUDE.md)** - Multiplication app details
- **[apps/voc/CLAUDE.md](apps/voc/CLAUDE.md)** - Vocabulary app details
- **[packages/shared/CLAUDE.md](packages/shared/CLAUDE.md)** - Shared code details
