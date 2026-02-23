# TODO

Hallo zusammen, falls ihr mal versuchen wollt, eure Kinder zuhause zum Üben für die Schule zu überreden, probiert gerne die Karteikarten-Apps, die ich jüngst für meine Zwerge geschrieben habe. Klappt bei uns bisher ganz gut.

- 1x1
- Lernwortkiste (Rechtschreibung)
- Vokabeln

Ist ein kleines Hobby Projekt, kostenlos, OpenSource, offline lauffähig und ohne Werbung.

<https://entorb.net/flashcards/>

Feedback und Verbesserungsvorschläge sehr gerne, aber bitte über die Kontakt-Seite in der App.

## Tech

## Git Hist cleanup

- todo-lwk.md

## all

non-functional requirements:

- adjust AGENTS.md if needed, to prevent repeated problems
- ensure unit test coverage is above 80%
- is there more code that should me harmonized to the shared package, if so move (DRY)
- afterwards run
    pnpm run check
    and fix all issues, errors and warnings
- finally run
    pnpm run cy:run
    and fix all issues, errors and warnings

The Cypress tests run too long.

- for lwk and voc, reduce the number of cards to 4

- for lwk and voc, the cards management of the import and export to clipboard are fragile and should be remove / or the clipboard mocked.

- on my windows machine it takes very long for the first cypress test to start, is there a way to improve this?

(note: I already started the dev server)

- is there repeated code in the cypress tests, that should be moved to the central helper utils?

- you are on Windows, use PowerShell instead of Bash

- afterwards run

    pnpm run check

    and fix all issues, errors and warnings

- finally run

    pnpm run cy:run

    and fix all issues, errors and warnings

## 1x1

## lwk

## voc

## eta

Erstelle eine weitere kleine App für Schulkinder, mit der sie die Restzeit, die sie für ihre Hausaufgaben brauchen, abschätzen können (durch Lineare Regression).

App Kürzel: "eta"

Icon/Logo/Mascotchen: Eichhörnchen

### Konfiguration (vor dem Start)

- Anzahl Aufgaben (auch nach dem Start veränderbar)
- Start Button (Speichert Zeitstempel und Anzahl-erledigte-Aufgaben=0 in den Storage)
- Reset Button (setzt Fortschritt und Ziel zurück, auch vom Local Storage)

### Datenspeicherung

im Browser local storage

1. Anzahl der Aufgaben
2. Liste der erledigten Aufgaben mit Zeitstempel + Anzahl erledigte Aufgaben

### Inputs während des Laufens

- erledigte Aufgaben (integer only)
- Alternative: Umschalten zu "noch zu erledigende Aufgaben" Input
- +1 Aufgabe erledigt Button

### Anzeigen während des Laufens

1. Prozent Aufgaben erledigt, prominent, soll motivieren (soll auch X/Y anzeigen, mit X = erledigte, Y = gesamt)
2. Restzeit in mm:ss, geschätzt durch lineare Regression (soll auch geschätzte Ende-Uhrzeit anzeigen)
3. Tabelle der Messwerte mit Zeit pro Aufgabe seit letzter Erfassung
   - Button zum Löschen eines Messwerts in jeder Zeile
4. Grafik der Geschwindigkeit mit Y: Aufgaben pro Min, X: Anzahl der erledigten Aufgaben

### UI

- Zielgruppe sind junge Schulkinder
- so wenig Text wie möglich, besser Symbole verwenden
- Optimiert für Smartphone
- PWA, offline-fähig

---

## Code Review

One high-level point to consider is the adoption of the new useGameStateFlow.ts. While initializeGameFlow is used to start a game, the other functions in that file for managing the game session (like getGameCards, updateGameStats, etc.) are not yet used. The apps still rely on their own mechanisms for state management during the game. This might be intentional for a phased rollout, but it's worth noting that the new game state flow pattern is not fully implemented yet.

apps/1x1/src/composables/useGameStore.ts
The logic for calculating points is re-implemented here. This PR introduces a shared calculatePoints function in packages/shared/src/services/scoring.ts. To promote code reuse and consistency, consider using it here. You would need to import it first.

---

## Additional Code Improvement Proposals

### High Priority

#### Progressive Enhancement

- Add loading states with skeletons for better perceived performance
- Implement service worker caching strategies for faster subsequent loads
- Add offline mode indicator

#### Accessibility Improvements

- Add ARIA labels to interactive elements
- Improve keyboard navigation (tab order, focus indicators)
- Add screen reader announcements for game feedback
- Ensure color contrast meets WCAG AA standards
- Add skip navigation links

#### Performance Optimization

- Lazy load route components
- Add virtual scrolling for history list when it grows large
- Debounce localStorage writes
- Use shallowRef where deep reactivity isn't needed

### Medium Priority

#### Enhanced Statistics

- Add charts/graphs for progress over time (using Chart.js or similar)
- Show average time per level
- Display success rate trends
- Add weekly/monthly statistics views

#### Gamification

- Add achievements/badges system
- Implement streaks (days played consecutively)
- Add sound effects for correct/wrong answers (with mute toggle)
- Celebrate milestones (100 correct answers, all level 5, etc.)

#### Settings Page

- Add dedicated settings page
- Allow customization of auto-submit behavior
- Configurable timer settings
- Theme selection
- Sound effects toggle

#### Advanced Game Modes

- Timed challenge mode (60 seconds, max points)
- Endless mode
- Multiplayer mode (local)
- Practice mode for specific cards

---

## Review this mono repo of 3 apps and 1 shared package

**Date:** February 8, 2026
**Scope:** Vue 3 + TypeScript + Quasar monorepo with 3 apps + 1 shared package

- ensure that best practice as of 2025 for vue and typescript are followed
- simplify code if possible
- move redundant code to shared package
- optimize for smartphone

## Executive Summary

This monorepo is well-structured with good separation of concerns and effective use of shared code. The review identifies opportunities for:

- **Modern Vue 3 patterns** (Composition API improvements)
- **Code simplification** (reduce duplication, improve readability)
- **Mobile optimization** (performance, UX, PWA enhancements)
- **TypeScript improvements** (stricter types, better inference)

---

## 1. Vue 3 & Composition API Best Practices

### 🔧 Improvements Needed

#### 1.1 Use `defineModel()` for v-model (Vue 3.4+)

DONE

#### 1.2 Use `toValue()` for flexible ref/value handling

When functions accept both refs and raw values:

```typescript
import { toValue } from 'vue'

function useCardFiltering(cards: MaybeRef<Card[]>) {
  const cardsValue = computed(() => toValue(cards))
  // Works with both ref and raw array
}
```

#### 1.3 Simplify computed with arrow functions

**Current:**

```typescript
const currentCard = computed(() => {
  return baseStore.gameCards.value[baseStore.currentCardIndex.value] || null
})
```

**Simplified:**

```typescript
const currentCard = computed(
  () => baseStore.gameCards.value[baseStore.currentCardIndex.value] ?? null
)
```

---

## 2. TypeScript Improvements

### 2.1 Fix ESLint Config Type Errors

**Issue in `eslint.config.ts`:**

```typescript
// Line 62: sonarjs.configs is possibly undefined
...(sonarjs.configs.recommended.rules ?? {})
```

**Fix:**

```typescript
import sonarjs from 'eslint-plugin-sonarjs'

// Add type guard
const sonarRules = sonarjs.configs?.recommended?.rules ?? {}

export default [
  {
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...sonarRules
      // ...
    }
  }
]
```

### 2.2 Stricter Type Inference

**Current storage functions return `any`:**

```typescript
// vitest.config.base.ts line 6
export const getVitestConfig = (rootDir: string): any => ({
```

**Should be:**

```typescript
import type { UserConfig } from 'vitest/config'

export const getVitestConfig = (rootDir: string): UserConfig => ({
```

### 2.3 Use `satisfies` operator for type safety

**Current:**

```typescript
export const LEVEL_COLORS: Record<number, string> = {
  1: '#ffcdd2'
  // ...
}
```

**Better:**

```typescript
export const LEVEL_COLORS = {
  1: '#ffcdd2',
  2: '#ffe0b2',
  3: '#fff9c4',
  4: '#dcedc8',
  5: '#c8e6c9'
} as const satisfies Record<number, string>

// Now LEVEL_COLORS[1] is typed as '#ffcdd2' not just string
```

---

## 3. Code Duplication & Simplification

### 3.1 Extract Vite Config Factory

DONE

### 3.2 Consolidate Deck Management Logic

DONE

### 3.3 Simplify HomePage Structure

DONE

---

## 4. Mobile Optimization

### 4.1 Performance Improvements

#### Use `v-memo` for expensive list renders

```vue
<!-- CardsManListOfCards.vue -->
<div v-for="card in cards" :key="card.id" v-memo="[card.level, card.time]">
  <!-- Only re-render if level or time changes -->
</div>
```

#### Lazy load heavy components

```typescript
// HomePage.vue
const FoxMascot = defineAsyncComponent(() => import('../components/FoxMascot.vue'))
```

#### Virtual scrolling for long lists

```vue
<!-- For CardsManPage with 100+ cards -->
<q-virtual-scroll :items="cards" virtual-scroll-item-size="60">
  <template #default="{ item }">
    <CardItem :card="item" />
  </template>
</q-virtual-scroll>
```

### 4.2 Touch & Gesture Improvements

#### Add swipe gestures for navigation

```typescript
// composables/useSwipeNavigation.ts
import { useSwipe } from '@vueuse/core'

export function useSwipeNavigation(router: Router) {
  const { direction } = useSwipe(document.body, {
    threshold: 50,
    onSwipeEnd() {
      if (direction.value === 'right') {
        router.back()
      }
    }
  })
}
```

#### Improve button tap targets (minimum 44x44px)

```scss
// All interactive elements should be at least 44x44px
.q-btn {
  min-height: 44px;
  min-width: 44px;
}
```

### 4.3 PWA Enhancements

#### Add offline indicator

```vue
<!-- App.vue -->
<script setup lang="ts">
import { useOnline } from '@vueuse/core'
const isOnline = useOnline()
</script>

<template>
  <q-banner
    v-if="!isOnline"
    class="bg-warning text-white"
  >
    <template #avatar>
      <q-icon name="cloud_off" />
    </template>
    {{ TEXT_DE.shared.offline.message }}
  </q-banner>
</template>
```

#### Improve service worker update UX

```typescript
// main.ts - current implementation is good, but add visual feedback
registerSW({
  immediate: true,
  onNeedRefresh() {
    Notify.create({
      message: TEXT_DE.pwaUpdate.confirmMessage,
      color: 'primary',
      icon: 'system_update',
      timeout: 0,
      actions: [
        {
          label: TEXT_DE.shared.common.yes,
          color: 'white',
          handler: () => updateSW(true)
        },
        {
          label: TEXT_DE.shared.common.no,
          color: 'white'
        }
      ]
    })
  }
})
```

### 4.4 Reduce Bundle Size

#### Tree-shake Quasar components

DONE

#### Code splitting by route

DONE

---

## 5. Shared Package Improvements

### 5.1 Better Export Organization

**Current:**

```typescript
// index.ts exports everything
export * from './utils/index.js'
export * from './types.js'
// ...
```

**Better:**

```typescript
// Explicit barrel exports with categories
export {
  // Types
  type BaseCard,
  type GameStats,
  type AnswerStatus,
  // Constants
  MAX_LEVEL,
  MIN_LEVEL,
  // Functions
  createBaseGameStore,
  calculatePointsBreakdown
} from './core'

export { TEXT_DE } from './text-de'
```

### 5.2 Add Shared Utilities

**Missing utilities that could be shared:**

```typescript
// packages/shared/src/utils/array.ts
export function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item)
      acc[key] = acc[key] ?? []
      acc[key].push(item)
      return acc
    },
    {} as Record<K, T[]>
  )
}
```

---

## 6. Testing Improvements

### 6.1 Add Component Testing with Cypress

**Current:** Only E2E tests, no component tests

**Add:**

```typescript
// apps/1x1/cypress/component/HomePage.cy.ts
import HomePage from '../../src/pages/HomePage.vue'

describe('HomePage', () => {
  it('renders with statistics', () => {
    cy.mount(HomePage, {
      props: {
        statistics: {
          gamesPlayed: 10,
          points: 100,
          correctAnswers: 50
        }
      }
    })
    cy.get('[data-cy="statistics-card"]').should('contain', '10')
  })
})
```

### 6.2 Improve Test Coverage

**Current coverage (estimate):**

- 1x1: ~60%
- voc: ~75%
- lwk: ~40%

**Target:** >80% for all apps

**Focus areas:**

- Storage service edge cases
- Card selection algorithms
- Game state transitions

---

## 7. Accessibility Improvements

### 7.1 Add ARIA labels

```vue
<!-- GamePage.vue -->
<q-btn icon="play_arrow" aria-label="Start game" @click="startGame" />

<div role="status" aria-live="polite" aria-atomic="true">
  {{ TEXT_DE.game.currentScore }}: {{ points }}
</div>
```

### 7.2 Keyboard navigation

```typescript
// composables/useKeyboardShortcuts.ts
import { onKeyStroke } from '@vueuse/core'

export function useKeyboardShortcuts(actions: {
  onEnter?: () => void
  onEscape?: () => void
  onSpace?: () => void
}) {
  onKeyStroke('Enter', e => {
    e.preventDefault()
    actions.onEnter?.()
  })

  onKeyStroke('Escape', e => {
    e.preventDefault()
    actions.onEscape?.()
  })

  onKeyStroke(' ', e => {
    e.preventDefault()
    actions.onSpace?.()
  })
}
```

### 7.3 Focus management

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputRef = ref<HTMLInputElement>()

onMounted(() => {
  // Auto-focus on mount for better UX
  inputRef.value?.focus()
})
</script>

<template>
  <q-input
    ref="inputRef"
    v-model="answer"
    autofocus
  />
</template>
```

---

## 8. Developer Experience

### 8.1 Add Storybook for Component Development

```bash
pnpm add -D @storybook/vue3 @storybook/addon-essentials
```

```typescript
// .storybook/main.ts
export default {
  stories: ['../packages/shared/src/**/*.stories.ts'],
  addons: ['@storybook/addon-essentials'],
  framework: '@storybook/vue3'
}
```

### 8.2 Improve Type Safety in Tests

```typescript
// test-utils.ts
import type { VueWrapper } from '@vue/test-utils'

export function findByTestId<T extends ComponentPublicInstance>(
  wrapper: VueWrapper,
  testId: string
): VueWrapper<T> {
  return wrapper.find(`[data-cy="${testId}"]`) as VueWrapper<T>
}
```

### 8.3 Add Pre-commit Hooks

```json
// package.json
{
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged"
  },
  "lint-staged": {
    "*.{ts,vue}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 9. Priority Implementation Plan

### Phase 1: Quick Wins (1-2 days)

1. Fix ESLint type errors
2. Add `defineModel()` to v-model components
3. Simplify computed properties
4. Add `satisfies` to constants

### Phase 2: Code Consolidation (3-5 days)

1. Create Vite config factory
2. Extract deck management to shared
3. Create HomePage layout component
4. Move common utilities to shared

### Phase 3: Mobile Optimization (3-5 days)

1. Add v-memo to lists
2. Implement virtual scrolling
3. Add swipe navigation
4. Improve PWA update UX
5. Optimize bundle sizes

### Phase 4: Testing & Accessibility (5-7 days)

1. Add component tests
2. Improve test coverage to 80%
3. Add ARIA labels
4. Implement keyboard shortcuts
5. Add focus management

---

## 10. Metrics & Success Criteria

### Performance

- [ ] Lighthouse score >90 on mobile
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] Bundle size <200KB gzipped per app

### Code Quality

- [ ] Test coverage >80%
- [ ] Zero ESLint errors
- [ ] Zero TypeScript errors
- [ ] <500 lines duplicated code

### Accessibility

- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation for all features
- [ ] Screen reader compatible
- [ ] Touch targets ≥44x44px

### Developer Experience

- [ ] Build time <30s
- [ ] Hot reload <1s
- [ ] Type checking <10s
- [ ] All tests pass in <30s

---

## Conclusion

This monorepo is well-architected with excellent separation of concerns. The main opportunities are:

1. **Reduce duplication** through better abstractions (vite config, deck management, page layouts)
2. **Modernize Vue patterns** (defineModel, toValue, better composables)
3. **Optimize for mobile** (performance, gestures, PWA)
4. **Improve type safety** (fix ESLint, stricter types, satisfies operator)

Estimated effort: **15-20 days** for full implementation
Estimated impact: **30% less code, 20% faster, better UX**
