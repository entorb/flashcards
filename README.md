# Flashcards Apps

This repository hosts the code of two educational apps, implementing flashcard-based learning for school kids.

- [apps/1x1](apps/1x1): Multiplication practice app (1x1 tables learning), hosted at <https://entorb.net/1x1/>
- [apps/voc](apps/voc): Vocabulary learning app, hosted at <https://entorb.net/voc/>

## Tech Stack

- pnpm
- Vue.js
- Quasar Framework, no custom styles
- Typescript with strict rules
- Prettier
- ESLint
- Vitest unit tests
- Cypress E2E test
- [SonarQube](https://sonarcloud.io/project/issues?id=entorb_flashcards) for
  code quality analysis

## Scripts

```sh
# Development
pnpm install             # Install all dependencies
pnpm dev                 # Run both apps in parallel
pnpm dev:1x1             # Run only 1x1 app
pnpm dev:voc             # Run only voc app

# Build
pnpm build               # Build all apps
pnpm build:1x1           # Build only 1x1 app
pnpm build:voc           # Build only voc app

# Preview
pnpm preview             # Preview all apps in parallel
pnpm preview:1x1         # Preview only 1x1 app
pnpm preview:voc         # Preview only voc app

# Quality Checks
pnpm types               # Type check all apps and packages
pnpm lint                # Lint all code
pnpm format              # Format all code
pnpm test                # Run tests in all apps
pnpm spell               # Spell check all files
pnpm check               # Run all checks

# Testing Vitest Unit Tests
pnpm run test

# Testing Cypress E2E Tests
pnpm run cy:open:1x1
pnpm run cy:open:voc
# headless
pnpm run cy:run
pnpm run cy:run:1x1
pnpm run cy:run:voc

# Maintenance
pnpm clean               # Remove all node_modules and dist folders
pnpm clean:cache         # Remove cache files
```
