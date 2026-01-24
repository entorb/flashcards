# Spelling Trainer (lwk)

PWA for spelling practice with adaptive difficulty and custom word decks.

## Quick Facts

- `BASE_PATH = 'fc-lwk'`
- `MAX_CARDS_PER_GAME: 10`
- `WORD_DISPLAY_DURATION = 3` seconds
- `CLOSE_MATCH_SCORE_PERCENTAGE = 0.75`

## Data Model

```typescript
interface Card {
  word: string
  level: number // 1-5
  time: number // 0.1-60s
}

interface CardDeck {
  name: string
  cards: Card[]
}

interface GameSettings {
  mode: 'copy' | 'hidden'
  focus: 'weak' | 'medium' | 'strong' | 'slow'
  deck?: string
}
```

## Game Mechanics

### Modes

- `copy`: Word visible while typing (levels 1-2 only)
- `hidden`: Word shown 3s then hidden (all levels)

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
- `slow`: High time prioritized

## Architecture

**Stack:** Vue 3, Quasar, TypeScript, Vite, Vitest, Cypress

### Key Files

- `src/constants.ts` — `BASE_PATH`, `MAX_CARDS_PER_GAME`, display duration
- `src/services/storage.ts` — Deck operations, history, stats
- `src/composables/useGameStore.ts` — Game state + deck operations

### Storage Keys

- `lwk-decks`: `CardDeck[]`
- `lwk-history`: `GameHistory[]`
- `lwk-stats`: `GameStats`
- `lwk-last-settings`: `GameSettings`

## Critical Rules

- Close match: Levenshtein distance = 1
- Time tracking: 0.1-60s, 1 decimal precision
- Level adjustment: +1 correct, -1 incorrect, 0 close
- Copy mode: Levels 1-2 only
- No parallel sessions: One game at a time
