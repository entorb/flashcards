import { expect, test } from '@playwright/test'

test.describe('pum Navigation Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navigate Home to History and back', async ({ page }) => {
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate to History
    await expect(page.getByTestId('history-button')).toBeVisible()
    await expect(page.getByTestId('history-button')).toBeEnabled()
    await page.getByTestId('history-button').click()
    await expect(page).toHaveURL(/\/history/)
    await expect(page.getByTestId('history-page-title')).toBeVisible()

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId('history-page-title')).toBeVisible()

    // Test back via button
    await page.getByTestId('back-button').click()
    await expect(page).not.toHaveURL(/\/history/)
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate again for browser back test
    await expect(page.getByTestId('history-button')).toBeVisible()
    await expect(page.getByTestId('history-button')).toBeEnabled()
    await page.getByTestId('history-button').click()
    await expect(page).toHaveURL(/\/history/)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/history/)
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate again for escape key test
    await expect(page.getByTestId('history-button')).toBeVisible()
    await expect(page.getByTestId('history-button')).toBeEnabled()
    await page.getByTestId('history-button').click()
    await expect(page).toHaveURL(/\/history/)
    await page.keyboard.press('Escape')
    await expect(page).not.toHaveURL(/\/history/)
    await expect(page.getByTestId('app-title')).toBeVisible()
  })

  test('navigate Home to Cards and back', async ({ page }) => {
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate to Cards
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await expect(page.getByTestId('reset-levels-button')).toBeVisible()

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId('reset-levels-button')).toBeVisible()

    // Test back via button
    await page.getByTestId('back-button').click()
    await expect(page).not.toHaveURL(/\/cards/)
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate again for browser back test
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/cards/)
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate again for escape key test
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await page.keyboard.press('Escape')
    await expect(page).not.toHaveURL(/\/cards/)
    await expect(page.getByTestId('app-title')).toBeVisible()
  })

  test('navigate Home to Game and back', async ({ page }) => {
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Select plus only (tap plus when all are selected → selects only plus)
    await page.getByTestId('operation-button-plus').click()
    await expect(page.getByTestId('operation-button-plus')).toHaveClass(/q-btn--unelevated/)

    // Navigate to Game
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('submit-answer-button')).toBeVisible()

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('submit-answer-button')).toBeVisible()

    // Test back via button
    await page.getByTestId('back-button').click()
    await expect(page).not.toHaveURL(/\/game/)
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate again for browser back test
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/game/)
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate again for escape key test
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)
    await page.keyboard.press('Escape')
    await expect(page).not.toHaveURL(/\/game/)
    await expect(page.getByTestId('app-title')).toBeVisible()
  })
})
