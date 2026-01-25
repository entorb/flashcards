# Vocabulary Learning App (voc)

PWA for English vocabulary learning with adaptive difficulty and multiple decks.

## Quick Facts

- `BASE_PATH = 'fc-voc'`
- `MAX_CARDS_PER_GAME: 10`

## Data Model

```typescript
interface Card {
  voc: string
  de: string
  level: number // 1-5
  time_blind: number // 0.1-60s
  time_typing: number // 0.1-60s
}

interface CardDeck {
  name: string
  cards: Card[]
}

interface GameSettings {
  mode: 'multiple-choice' | 'blind' | 'typing'
  focus: 'weak' | 'medium' | 'strong' | 'slow'
  language: 'voc-de' | 'de-voc'
  deck: string
}
```

## Game Mechanics

### Scoring

- Correct: `6 - level` points, level +1
- Incorrect: 0 points, level -1
- Close match (hidden): 75% points, level unchanged
- Time bonus (hidden): +5 if beating record

### Card Selection

Weighted by focus:

- `weak`: Low levels prioritized
- `strong`: High levels prioritized
- `medium`: Medium levels prioritized
- `slow`: High time prioritized (mode-specific)

## Architecture

**Stack:** Vue 3, Quasar, TypeScript, Vite, Vitest, Cypress

### Key Files

- `src/constants.ts` — `BASE_PATH`, mode multipliers
- `src/services/storage.ts` — Deck operations, history, stats
- `src/services/cardSelector.ts` — Weighted selection algorithm
- `src/services/pointsCalculation.ts` — `calculatePointsBreakdown()`
- `src/composables/useGameStore.ts` — Game state + deck operations

### Storage Keys

- `voc-cards`: `CardDeck[]`
- `voc-history`: `GameHistory[]`
- `voc-stats`: `GameStats`
- `voc-last-settings`: `GameSettings`

## Critical Rules

- Multiple decks: `CardDeck[]` with unique names
- Time tracking: Mode-specific (`time_blind` vs `time_typing`)
- Fuzzy matching: Levenshtein ≤2 for close answers
- Level adjustment: +1 correct, -1 incorrect, 0 close
- No parallel sessions: One game at a time
