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
<th align="center">
<a href="https://entorb.net/eta/">Hausi-Timer</a>
</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">
<a href="https://entorb.net/1x1/">
<img src="apps/1x1/assets/icon.svg" alt="1×1 Murmeltier" width="120">
</a>
</td>
<td align="center">
<a href="https://entorb.net/voc/">
<img src="apps/voc/assets/icon.svg" alt="Vokabeltrainer Fuchs" width="120">
</a>
</td>
<td align="center">
<a href="https://entorb.net/lwk/">
<img src="apps/lwk/assets/icon.svg" alt="Lernwörter Eisbär" width="120">
</a>
</td>
<td align="center">
<a href="https://entorb.net/eta/">
<img src="apps/eta/assets/icon.svg" alt="Hausi-Timer" width="120">
</a>
</td>
</tbody>
</table>

- Lernmethode: Karteikarten-System mit 5 Leveln (Level 1 = unbekannt → Level 5 = sicher beherrscht)
- Karten: Rechenaufgaben (1×1) • Vokabeln mit Übersetzung • Lernwörter für Rechtschreibung
- Kisten: Karten werden in Kisten organisiert (voc & lwk), z.B. pro Kapitel oder Sprache
- Spielmodi: Normal (max. 10 Karten) • Endlos Level 1 • 3 Runden • Endlos bis Level 5
- Fokus: Gewichtete Kartenauswahl (Schwache, Mittlere, Starke oder Langsame)
- Spielarten: Multiple Choice / Blind / Tippen (voc) • Abschreiben / Verdeckt (lwk)
- Gamification: Punkte sammeln • Maskottchen freut sich • Tagesstatistik mit Bonuspunkten • Spielverlauf-Historie
- Technologie: Web • offline nutzbar • PWA App
  (kann auf Android oder Apple als App installiert werden)
- Privatsphäre: Open Source • Keine Kosten • Keine Werbung • Kein Login • Keine Datenspeicherung auf dem Server

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
pnpm dev:eta             # Run only eta app

# Build
pnpm build               # Build all apps
pnpm build:1x1           # Build only 1x1 app
pnpm build:voc           # Build only voc app
pnpm build:lwk           # Build only lwk app
pnpm build:eta           # Build only eta app

# Preview
pnpm preview             # Preview all apps in parallel
pnpm preview:1x1         # Preview only 1x1 app
pnpm preview:voc         # Preview only voc app
pnpm preview:lwk         # Preview only lwk app
pnpm preview:eta         # Preview only eta app

# Quality Checks
pnpm run types               # Type check all apps and packages
pnpm run lint                # Lint all code
pnpm run format              # Format all code
pnpm run test                # Run tests in all apps
pnpm run spell               # Spell check all files
pnpm run check               # Run all these checks

# run only for certain app, here 1x1
pnpm --filter 1x1 run test

# Testing Vitest Unit Tests
pnpm run test

# Testing Cypress E2E Tests
pnpm run cy:open:1x1
pnpm run cy:open:voc
pnpm run cy:open:lwk
pnpm run cy:open:eta
# headless
pnpm run cy:run
pnpm run cy:run:1x1
pnpm run cy:run:voc
pnpm run cy:run:lwk
pnpm run cy:run:eta

# Maintenance
pnpm clean               # Remove all node_modules and dist folders
pnpm clean:cache         # Remove cache files
```
