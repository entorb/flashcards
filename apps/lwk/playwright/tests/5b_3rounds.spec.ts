import { expect, test } from '@playwright/test'

import {
  answerCopyCardCorrectly,
  playThroughAndVerifyGameOver,
  seedTestCards,
  startCopyGameMode,
  TEST_CARD_COUNT
} from './support/helpers'

test.describe('LWK 3 Rounds mode', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestCards(page)
    await page.goto('/')
  })

  test('should complete game in copy mode', async ({ page }) => {
    await startCopyGameMode(page, 'start-three-rounds')

    const totalQuestions = TEST_CARD_COUNT * 3
    await expect(page.getByTestId('card-counter')).toContainText(`1 / ${totalQuestions}`)

    await playThroughAndVerifyGameOver(page, totalQuestions, answerCopyCardCorrectly)
  })
})
