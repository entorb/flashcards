import { expect, test } from '@playwright/test'

test.describe('LWK Deck Edit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navigate to deck edit page and verify UI elements', async ({ page }) => {
    // Navigate to Cards
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)

    // Navigate to Decks edit
    await page.getByTestId('edit-decks-button').click()
    await expect(page).toHaveURL(/\/decks/)

    // Verify UI elements are present
    await expect(page.getByTestId('add-deck-button')).toBeVisible()
    await expect(page.getByTestId('back-button')).toBeVisible()
  })

  test('add a new deck', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await page.getByTestId('edit-decks-button').click()

    // Add a new deck
    await page.getByTestId('add-deck-button').click()

    // Verify the new deck appears in the list
    await expect(page.getByTestId('deck-item')).not.toHaveCount(0)
  })

  test('rename a deck', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await page.getByTestId('edit-decks-button').click()

    // Add a deck first
    await page.getByTestId('add-deck-button').click()

    // Find the rename button for the newly added deck
    await page.getByTestId('deck-item').last().getByTestId('rename-deck-button').click()

    // Type new name in the input
    await page.getByTestId('rename-input').fill('Renamed Deck')
    await page.getByTestId('save-rename-button').click()

    // Verify the deck was renamed
    await expect(page.getByTestId('deck-item').last()).toContainText('Renamed Deck')
  })

  test('delete a deck', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await page.getByTestId('edit-decks-button').click()

    // Add a deck first
    await page.getByTestId('add-deck-button').click()
    await expect(page.getByTestId('deck-item')).not.toHaveCount(0)

    // Delete the deck
    await page.getByTestId('deck-item').last().getByTestId('remove-deck-button').click()

    // Confirm deletion in the dialog
    await expect(page.locator('.q-dialog')).toBeVisible()
    await page.getByRole('button', { name: 'OK' }).click()
  })

  test('navigate back from deck edit page using back button', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await page.getByTestId('edit-decks-button').click()
    await expect(page).toHaveURL(/\/decks/)

    await page.getByTestId('back-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await expect(page).not.toHaveURL(/\/decks/)
  })

  test('navigate back from deck edit page using escape key', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await page.getByTestId('edit-decks-button').click()
    await expect(page).toHaveURL(/\/decks/)

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/cards/)
    await expect(page).not.toHaveURL(/\/decks/)
  })

  test('persist deck changes after page reload', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await page.getByTestId('edit-decks-button').click()

    // Add a deck
    await page.getByTestId('add-deck-button').click()
    await expect(page.getByTestId('deck-item')).not.toHaveCount(0)

    // Reload the page
    await page.reload()

    // Verify the deck still exists
    await expect(page.getByTestId('deck-item')).not.toHaveCount(0)
  })
})
