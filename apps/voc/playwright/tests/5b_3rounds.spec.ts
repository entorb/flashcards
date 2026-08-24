import { expect, test } from '@playwright/test'

import {
  answerCurrentCardCorrectly,
  playThroughAndVerifyGameOver,
  seedTestCards,
  startTypingGameMode,
  TEST_CARD_COUNT
} from './support/helpers'

test.describe('VOC 3 Rounds mode', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestCards(page)
    await page.goto('/')
  })

  test('should complete game in typing mode', async ({ page }) => {
    await startTypingGameMode(page, 'start-three-rounds')

    const totalQuestions = TEST_CARD_COUNT * 3
    await expect(page.getByTestId('card-counter')).toContainText(`1 / ${totalQuestions}`)

    await playThroughAndVerifyGameOver(page, totalQuestions, answerCurrentCardCorrectly)
  })
})
