import { expect, test } from '@playwright/test'

import {
  answerCurrentCardCorrectly,
  answerCurrentCardWrong,
  verifyPostGameStats
} from './support/helpers'

test.describe('div Full Game Flow', () => {
  test('should play a complete game with 1 wrong and 7 correct answers', async ({ page }) => {
    await page.goto('/')

    // Select divisor [6] — gives 8 cards (12:6, 18:6, 24:6, 30:6, 36:6, 42:6, 48:6, 54:6)
    await page.getByTestId('table-selection-button-6').click()
    await page.getByTestId('start-button').click()

    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible()

    // Answer first question wrong, then 7 correct
    await answerCurrentCardWrong(page)
    for (let i = 0; i < 7; i++) {
      await answerCurrentCardCorrectly(page)
    }

    await verifyPostGameStats(page, 7, 8)
  })

  test('should correctly increment stats and reset state across multiple games', async ({
    page
  }) => {
    await page.goto('/')

    // Verify initial stats are zero
    await expect(page.getByTestId('stats-games-played')).toContainText('0')
    await expect(page.getByTestId('stats-total-points')).toContainText('0')
    await expect(page.getByTestId('stats-correct-answers')).toContainText('0')

    // Play first game — select divisor [3] (8 cards: 6:3, 9:3, 12:3, 15:3, 18:3, 21:3, 24:3, 27:3)
    await page.getByTestId('table-selection-button-3').click()
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)

    for (let i = 0; i < 8; i++) {
      await answerCurrentCardCorrectly(page)
    }

    await expect(page).toHaveURL(/\/game-over/, { timeout: 10000 })

    const game1Points = Number.parseInt(
      (await page.getByTestId('final-points').textContent())?.trim() ?? '0',
      10
    )
    const game1CorrectAnswers = Number.parseInt(
      (await page.getByTestId('correct-answers-count').textContent())?.trim() ?? '0',
      10
    )
    expect(game1CorrectAnswers).toBe(8)

    await page.getByTestId('back-to-home-button').click()

    // Verify stats after first game
    await expect(page.getByTestId('stats-games-played')).toContainText('1')
    await expect(page.getByTestId('stats-correct-answers')).toContainText('8')
    const statsTotalPointsAfterGame1 = Number.parseInt(
      (await page.getByTestId('stats-total-points').textContent())?.trim() ?? '0',
      10
    )
    expect(statsTotalPointsAfterGame1).toBe(game1Points)

    // Play second game — select divisor [4]
    // First deselect 3 if it's the only one selected (tap restores all), then tap 4
    const table3Classes = await page.getByTestId('table-selection-button-3').getAttribute('class')
    if (table3Classes?.includes('q-btn--unelevated')) {
      await page.getByTestId('table-selection-button-3').click()
    }
    await page.getByTestId('table-selection-button-4').click()
    await expect(page.getByTestId('table-selection-button-4')).toHaveClass(/q-btn--unelevated/)

    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible()

    // Verify game starts fresh
    await expect(page.getByTestId('card-counter')).toContainText('1')

    for (let i = 0; i < 8; i++) {
      await answerCurrentCardCorrectly(page)
    }

    await expect(page).toHaveURL(/\/game-over/, { timeout: 10000 })

    const game2Points = Number.parseInt(
      (await page.getByTestId('final-points').textContent())?.trim() ?? '0',
      10
    )
    const game2CorrectAnswers = Number.parseInt(
      (await page.getByTestId('correct-answers-count').textContent())?.trim() ?? '0',
      10
    )
    expect(game2CorrectAnswers).toBe(8)

    await page.getByTestId('back-to-home-button').click()

    // Verify cumulative stats
    await expect(page.getByTestId('stats-games-played')).toContainText('2')
    const statsCorrectAnswersAfterGame2 = Number.parseInt(
      (await page.getByTestId('stats-correct-answers').textContent())?.trim() ?? '0',
      10
    )
    expect(statsCorrectAnswersAfterGame2).toBe(game1CorrectAnswers + game2CorrectAnswers)
    const statsTotalPointsAfterGame2 = Number.parseInt(
      (await page.getByTestId('stats-total-points').textContent())?.trim() ?? '0',
      10
    )
    expect(statsTotalPointsAfterGame2).toBe(game1Points + game2Points)
  })
})
