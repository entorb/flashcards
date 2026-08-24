import { expect, test } from '@playwright/test'

test.describe('LWK Navigation Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navigate Home to History and back', async ({ page }) => {
    // Verify we're on the home page
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate to History
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
    await page.getByTestId('history-button').click()
    await expect(page).toHaveURL(/\/history/)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/history/)
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate again for escape key test
    await page.getByTestId('history-button').click()
    await expect(page).toHaveURL(/\/history/)
    await page.keyboard.press('Escape')
    await expect(page).not.toHaveURL(/\/history/)
    await expect(page.getByTestId('app-title')).toBeVisible()
  })

  test('navigate Home to Cards, Decks, and back to CardsMan', async ({ page }) => {
    // Verify we're on the home page
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate to Cards
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await expect(page.getByTestId('edit-cards-button')).toBeVisible()

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId('edit-cards-button')).toBeVisible()

    // Navigate to Decks edit
    await page.getByTestId('edit-decks-button').click()
    await expect(page).toHaveURL(/\/decks/)
    await expect(page.getByTestId('add-deck-button')).toBeVisible()

    // Back to CardsMan
    await page.getByTestId('back-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await expect(page).not.toHaveURL(/\/decks/)
    await expect(page.getByTestId('edit-cards-button')).toBeVisible()

    // Navigate to Decks again for escape key test
    await page.getByTestId('edit-decks-button').click()
    await expect(page).toHaveURL(/\/decks/)
    await expect(page.getByTestId('add-deck-button')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/cards/)
    await expect(page).not.toHaveURL(/\/decks/)
    await expect(page.getByTestId('edit-cards-button')).toBeVisible()
  })

  test('navigate Home to Game and back', async ({ page }) => {
    // Verify we're on the home page
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Start the game
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })

    // Quit back to home
    await page.getByTestId('back-button').click()
    await expect(page).not.toHaveURL(/\/game/)
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate again for browser back test
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/game/)
    await expect(page.getByTestId('app-title')).toBeVisible()
  })

  test('navigate Home to Info and back', async ({ page }) => {
    // Verify we're on the home page
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate to Info
    await page.getByTestId('info-button').click()
    await expect(page).toHaveURL(/\/info/)
    await expect(page.getByTestId('info-page-title')).toBeVisible()

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId('info-page-title')).toBeVisible()

    // Test back via button
    await page.getByTestId('back-button').click()
    await expect(page).not.toHaveURL(/\/info/)
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate again for browser back test
    await page.getByTestId('info-button').click()
    await expect(page).toHaveURL(/\/info/)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/info/)
    await expect(page.getByTestId('app-title')).toBeVisible()
  })
})
