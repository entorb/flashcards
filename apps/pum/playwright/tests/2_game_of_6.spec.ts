import { expect, test } from '@playwright/test'

import {
  answerCurrentCardCorrectly,
  answerCurrentCardWrong,
  verifyPostGameStats
} from './support/helpers'

test.describe('pum Full Game Flow', () => {
  test('should play a complete game with 1 wrong and 9 correct answers', async ({ page }) => {
    await page.goto('/')

    // Select plus only (tap plus when all are selected → selects only plus)
    await page.getByTestId('operation-button-plus').click()
    await expect(page.getByTestId('operation-button-plus')).toHaveClass(/q-btn--unelevated/)

    // Select simple difficulty only (tap simple when all are selected → selects only simple)
    await page.getByTestId('difficulty-button-simple').click()
    await expect(page.getByTestId('difficulty-button-simple')).toHaveClass(/q-btn--unelevated/)

    await page.getByTestId('start-button').click()

    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible()

    // Answer first question wrong, then 9 correct (10 cards total)
    await answerCurrentCardWrong(page)
    for (let i = 0; i < 9; i++) {
      await answerCurrentCardCorrectly(page)
    }

    await verifyPostGameStats(page, 9, 10)
  })

  test('should correctly increment stats and reset state across multiple games', async ({
    page
  }) => {
    await page.goto('/')

    // Verify initial stats are zero
    await expect(page.getByTestId('stats-games-played')).toContainText('0')
    await expect(page.getByTestId('stats-total-points')).toContainText('0')
    await expect(page.getByTestId('stats-correct-answers')).toContainText('0')

    // Play first game — select plus only + simple difficulty (55 cards, 10 per game)
    await page.getByTestId('operation-button-plus').click()
    await page.getByTestId('difficulty-button-simple').click()
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)

    for (let i = 0; i < 10; i++) {
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
    expect(game1CorrectAnswers).toBe(10)

    await page.getByTestId('back-to-home-button').click()

    // Verify stats after first game
    await expect(page.getByTestId('stats-games-played')).toContainText('1')
    await expect(page.getByTestId('stats-correct-answers')).toContainText('10')
    const statsTotalPointsAfterGame1 = Number.parseInt(
      (await page.getByTestId('stats-total-points').textContent())?.trim() ?? '0',
      10
    )
    expect(statsTotalPointsAfterGame1).toBe(game1Points)

    // Play second game — switch to minus only + simple difficulty
    // First tap plus to restore all operations, then tap minus to select only minus
    const plusClasses = await page.getByTestId('operation-button-plus').getAttribute('class')
    if (plusClasses?.includes('q-btn--unelevated')) {
      await page.getByTestId('operation-button-plus').click()
    }
    await page.getByTestId('operation-button-minus').click()
    await expect(page.getByTestId('operation-button-minus')).toHaveClass(/q-btn--unelevated/)

    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible()

    // Verify game starts fresh
    await expect(page.getByTestId('card-counter')).toContainText('1')

    for (let i = 0; i < 10; i++) {
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
    expect(game2CorrectAnswers).toBe(10)

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
