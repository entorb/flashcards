import { expect, test as it } from "@playwright/test"

import {
  answerCurrentCardCorrectly,
  playThroughAndVerifyGameOver,
  seedTestCards,
  startTypingGameMode,
  TEST_CARD_COUNT,
} from "./support/helpers.ts"

it.describe("VOC 3 Rounds mode", () => {
  it.beforeEach(async ({ page }) => {
    await seedTestCards(page)
    await page.goto("/")
  })

  it("should complete game in typing mode", async ({ page }) => {
    await startTypingGameMode(page, "start-three-rounds")

    const totalQuestions = TEST_CARD_COUNT * 3
    await expect(page.getByTestId("card-counter")).toContainText(`1 / ${totalQuestions}`)

    await playThroughAndVerifyGameOver(page, totalQuestions, answerCurrentCardCorrectly)
  })
})
