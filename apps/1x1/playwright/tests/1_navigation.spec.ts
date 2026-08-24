import { expect, test } from '@playwright/test'

test.describe('1x1 Navigation Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navigate Home to History and back', async ({ page }) => {
    // Verify we're on the home page
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate to History - wait for button to be clickable
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
    // Verify we're on the home page
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
    // Verify we're on the home page
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Initialize game settings by making a table selection (this ensures selection is initialized)
    await page.getByTestId('table-selection-button-3').click()

    // Verify the selection is registered
    await expect(page.getByTestId('table-selection-button-3')).toHaveClass(/q-btn--unelevated/)

    // Navigate to Game
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)
    // Wait for game page to load - check for question display which appears when card is ready
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
