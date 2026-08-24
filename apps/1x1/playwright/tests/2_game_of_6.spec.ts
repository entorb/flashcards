import { expect, test } from '@playwright/test'

import {
  answerCurrentCardCorrectly,
  answerCurrentCardWrong,
  verifyPostGameStats
} from './support/helpers'

test.describe('1x1 Full Game Flow', () => {
  test('should play a complete game with 1 wrong and 6 correct answers', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('table-selection-button-6').click()
    await page.getByTestId('start-button').click()

    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible()

    // Answer first question wrong, then 6 correct
    await answerCurrentCardWrong(page)
    for (let i = 0; i < 6; i++) {
      await answerCurrentCardCorrectly(page)
    }

    await verifyPostGameStats(page, 6, 7)
  })

  test('should correctly increment stats and reset state across multiple games', async ({
    page
  }) => {
    await page.goto('/')

    // Verify initial stats are zero
    await expect(page.getByTestId('stats-games-played')).toContainText('0')
    await expect(page.getByTestId('stats-total-points')).toContainText('0')
    await expect(page.getByTestId('stats-correct-answers')).toContainText('0')

    // Play first game — select table [3] (7 cards)
    await page.getByTestId('table-selection-button-3').click()
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)

    for (let i = 0; i < 7; i++) {
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
    expect(game1CorrectAnswers).toBe(7)

    await page.getByTestId('back-to-home-button').click()

    // Verify stats after first game
    await expect(page.getByTestId('stats-games-played')).toContainText('1')
    await expect(page.getByTestId('stats-correct-answers')).toContainText('7')
    const statsTotalPointsAfterGame1 = Number.parseInt(
      (await page.getByTestId('stats-total-points').textContent())?.trim() ?? '0',
      10
    )
    expect(statsTotalPointsAfterGame1).toBe(game1Points)

    // Play second game — select table [4] (7 cards)
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
    await expect(page.getByTestId('card-counter')).toContainText('7')

    for (let i = 0; i < 7; i++) {
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
    expect(game2CorrectAnswers).toBe(7)

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
