---
name: e2e-test-debugging
description: Debug failing Playwright E2E specs in the flashcards monorepo. Use when a test run fails, when you need to run exactly one spec, dump DOM/reactive state to files, reproduce flaky tests, or seed deterministic test state.
---

# E2E Tests Debugging

## When to Use This Skill

Activate this skill when:

- An E2E spec fails or is flaky and you need to debug it
- You need to run exactly one Playwright spec in isolation
- You cannot tell what the test saw (screenshots are unreadable) and must dump state to a file
- A test only fails sometimes and you need to reproduce it in a loop

## Playwright

Run exactly one spec with the `list` reporter:

```bash
pnpm --filter {app} exec playwright test {spec} --reporter=list 2>&1
```

## Debugging Flow

1. Identify the failing spec and run it in isolation (exact command above).
2. Dump state to a file (`console.log` → capture output) and read the file — do not rely on screenshots.
3. If the failure is intermittent, loop the spec while dumping state per iteration and diff the dumps.
