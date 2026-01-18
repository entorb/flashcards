# Eisi's Lernwörter - Spelling Trainer

Spelling practice app for pupils in grades 2-4, featuring Eisi the ice bear mascot.

## Features

- Two learning modes: "Abschreiben" (copying) and "Verdeckt" (hidden)
- Adaptive difficulty system (levels 1-5)
- Time tracking and bonuses
- Custom word decks ("Kisten")
- Cute mascot providing feedback
- Progressive Web App (PWA)

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:5175/fc-lwk/)
pnpm dev

# Run tests
pnpm test

# Run E2E tests
pnpm cy:run

# Build for production
pnpm build

# Preview production build (http://localhost:4175/fc-lwk/)
pnpm preview
```

## Tech Stack

- Vue 3 (Composition API)
- Quasar Framework
- TypeScript (strict mode)
- Vite 6.x
- Vitest for unit tests
- Cypress for E2E tests

## Project Structure

- `src/pages/` - Vue page components
- `src/components/` - Reusable Vue components
- `src/composables/` - Vue composables (state management)
- `src/services/` - Business logic and storage
- `src/utils/` - Utility functions
- `cypress/e2e/` - End-to-end tests
