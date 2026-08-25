import { expect, test } from '@playwright/test'

test.describe('VOC Navigation Smoke Tests', () => {
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
    await page.getByTestId('back-button').first().click()
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

  test('navigate Cards to CardsEdit and back to Cards', async ({ page }) => {
    // Navigate to Cards first
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)

    // Navigate to CardsEdit
    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)
    await expect(page.getByTestId('card-edit-item').first()).toBeVisible()

    // Test back via button goes to CardsManPage
    await page.getByTestId('back-button').click()
    await expect(page).not.toHaveURL(/\/cards-edit/)
    await expect(page).toHaveURL(/\/cards/)

    // Navigate again for escape key test
    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)
    await page.keyboard.press('Escape')
    await expect(page).not.toHaveURL(/\/cards-edit/)
    await expect(page).toHaveURL(/\/cards/)
  })

  test('navigate Cards to DecksEdit and back to CardsMan', async ({ page }) => {
    // Navigate to Cards first
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)

    // Navigate to DecksEdit
    await page.getByTestId('edit-decks-button').click()
    await expect(page).toHaveURL(/\/decks-edit/)
    await expect(page.getByTestId('add-deck-button')).toBeVisible()

    // Test back via button goes to CardsMan
    await page.getByTestId('back-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await expect(page).not.toHaveURL(/\/decks-edit/)
    await expect(page.getByTestId('edit-cards-button')).toBeVisible()

    // Navigate again for escape key test
    await page.getByTestId('edit-decks-button').click()
    await expect(page).toHaveURL(/\/decks-edit/)
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/cards/)
    await expect(page).not.toHaveURL(/\/decks-edit/)
    await expect(page.getByTestId('edit-cards-button')).toBeVisible()
  })

  test('navigate Home to Game and back', async ({ page }) => {
    // Verify we're on the home page
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Initialize game settings by selecting mode and language
    await page.getByRole('button', { name: 'Multiple Choice' }).click()
    await page.getByRole('button', { name: 'Voc → DE' }).click()

    // Navigate to Game
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)
    // Wait for game page to load properly
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })

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
    await page.getByTestId('back-button').first().click()
    await expect(page).not.toHaveURL(/\/info/)
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate again for browser back test
    await page.getByTestId('info-button').click()
    await expect(page).toHaveURL(/\/info/)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/info/)
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Navigate again for escape key test
    await page.getByTestId('info-button').click()
    await expect(page).toHaveURL(/\/info/)
    await page.keyboard.press('Escape')
    await expect(page).not.toHaveURL(/\/info/)
    await expect(page.getByTestId('app-title')).toBeVisible()
  })
})
