import { expect, test } from '@playwright/test'

import {
  answerCurrentCardCorrectly,
  playThroughAndVerifyGameOver,
  seedTestCards,
  startTypingGameMode,
  TEST_CARDS
} from './support/helpers'

test.describe('VOC Endless Level 5 mode', () => {
  test.beforeEach(async ({ page }) => {
    // 4 cards at levels 1..4 (all below level 5)
    const leveledCards = TEST_CARDS.map((card, index) => ({ ...card, level: index + 1 }))
    await seedTestCards(page, leveledCards)
    await page.goto('/')
  })

  test('should complete game in typing mode', async ({ page }) => {
    await startTypingGameMode(page, 'start-endless-level5')

    // 4 cards below level 5
    await expect(page.getByTestId('card-counter')).toContainText('4')

    // Total correct answers: level1→5=4, level2→5=3, level3→5=2, level4→5=1 = 10
    await playThroughAndVerifyGameOver(page, 10, answerCurrentCardCorrectly)
  })
})
