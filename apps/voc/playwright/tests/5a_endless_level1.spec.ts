import { expect, test as it } from "@playwright/test"

import {
  answerCurrentCardCorrectly,
  playThroughAndVerifyGameOver,
  seedTestCards,
  startTypingGameMode,
} from "./support/helpers.ts"

it.describe("VOC Endless Level 1 mode", () => {
  it.beforeEach(async ({ page }) => {
    await seedTestCards(page)
    await page.goto("/")
  })

  it("should complete game in typing mode", async ({ page }) => {
    await startTypingGameMode(page, "start-endless-level1")

    // All 4 test cards are at level 1
    await expect(page.getByTestId("card-counter")).toContainText("4")

    await playThroughAndVerifyGameOver(page, 4, answerCurrentCardCorrectly)
  })
})
