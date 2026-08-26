---
name: e2e-test-debugging
description: Debug failing Cypress or Playwright E2E specs in the flashcards monorepo. Use when a test run fails, when you need to run exactly one spec, dump DOM/reactive state to files, reproduce flaky tests, or seed deterministic test state.
---

# E2E Tests Debugging

## When to Use This Skill

Activate this skill when:

- An E2E spec fails or is flaky and you need to debug it
- You need to run exactly one Cypress or Playwright spec in isolation
- You cannot tell what the test saw (screenshots are unreadable) and must dump state to a file
- A test only fails sometimes and you need to reproduce it in a loop

## Cypress

Run exactly one spec — the `-- --spec` flag in the `cy:run:{app}` script does NOT filter; the `--` swallows it:

```bash
pnpm --filter {app} exec cypress run --e2e --spec "cypress/e2e/{spec}.cy.ts"
```

- `--quiet` (in the `cy:run` script) hides `cy.log()` output. When debugging, call the `exec cypress` form above instead.
- State dumps: the LLM cannot read `cy.screenshot()` output. Dump DOM/reactive state to a file and read it after the run:

  ```bash
  cy.writeFile('cypress/debug.json', JSON.stringify({...}))
  ```

- Flaky test? Run the spec repeatedly in a loop and dump state per iteration to find the failing one:

  ```bash
  for i in 1 2 3; do pnpm --filter {app} exec cypress run --e2e --spec "cypress/e2e/{spec}.cy.ts"; done
  ```

## Playwright

Run exactly one spec with the `list` reporter:

```bash
pnpm --filter {app} exec playwright test {spec} --reporter=list 2>&1
```

## Debugging Flow

1. Identify the failing spec and run it in isolation (exact command above).
2. Dump state to a file (`cy.writeFile(...)` / `console.log` → capture output) and read the file — do not rely on screenshots.
3. If the failure is intermittent, loop the spec while dumping state per iteration and diff the dumps.
