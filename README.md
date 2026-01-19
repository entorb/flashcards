# Flashcards Apps

This repository hosts the code of three educational apps, implementing flashcard-based learning for school kids. Hosted at <https://entorb.net/flashcards/>:

<table>
<thead>
<tr>
<th align="center">
<a href="https://entorb.net/1x1/">1×1 Trainer</a>
</th>
<th align="center">
<a href="https://entorb.net/voc/">Vokabeltrainer</a>
</th>
<th align="center">
<a href="https://entorb.net/lwk/">Lernwörter</a>
</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">
<a href="https://entorb.net/1x1/">
<img src="apps/1x1/assets/icon.svg" alt="1×1 Trainer Murmeltier" width="120">
</a>
</td>
<td align="center">
<a href="https://entorb.net/voc/">
<img src="apps/voc/assets/icon.svg" alt="Vokabeltrainer Fuchs" width="120">
</a>
</td>
<td align="center">
<a href="https://entorb.net/lwk/">
<img src="apps/lwk/assets/icon.svg" alt="Lernwörter Eisi" width="120">
</a>
</td>
</tr>
<tr>
<td><strong>Kartenauswahl:</strong><br>Vorbereitete Einmaleins-Aufgaben</td>
<td><strong>Kartenauswahl:</strong><br>Eigene Vokabel-Decks erstellen und importieren</td>
<td><strong>Kartenauswahl:</strong><br>Eigene Wort-Decks erstellen</td>
</tr>
<tr>
<td colspan="3" align="center">
<strong>Lernmethode:</strong> Karteikarten-System mit 5 Stufen<br>
(Stufe 1 = unbekannt → Stufe 5 = sicher beherrscht)
</td>
</tr>
<tr>
<td colspan="3" align="center">
<strong>Features:</strong><br>
• 5-stufiges adaptives Lernen • Gewichtete Kartenauswahl<br>
• Tagesstatistik mit Bonuspunkten • Spielverlauf-Historie<br>
• PWA (offline nutzbar)
</td>
</tr>
</tbody>
</table>

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
pnpm dev:lwk             # Run only lwk app

# Build
pnpm build               # Build all apps
pnpm build:1x1           # Build only 1x1 app
pnpm build:voc           # Build only voc app
pnpm build:lwk           # Build only lwk app

# Preview
pnpm preview             # Preview all apps in parallel
pnpm preview:1x1         # Preview only 1x1 app
pnpm preview:voc         # Preview only voc app
pnpm preview:lwk         # Preview only lwk app

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
pnpm run cy:open:lwk
# headless
pnpm run cy:run
pnpm run cy:run:1x1
pnpm run cy:run:voc
pnpm run cy:run:lwk

# Maintenance
pnpm clean               # Remove all node_modules and dist folders
pnpm clean:cache         # Remove cache files
```
