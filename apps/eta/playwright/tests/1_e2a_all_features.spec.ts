import { expect, test } from '@playwright/test'

test.describe('ETA Tracking Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('complete tracking workflow with 10 tasks', async ({ page }) => {
    // Wait for config view to be visible
    await expect(page.getByTestId('input-total-tasks')).toBeVisible()

    // Start session with 10 tasks
    await page.getByTestId('input-total-tasks').fill('10')
    await page.getByTestId('btn-start').click()

    // Verify tracking view is shown
    await expect(page.getByTestId('input-tasks')).toBeVisible()
    await expect(page.getByTestId('btn-plus-one')).toBeVisible()

    // Normal input - completed mode (default)
    await page.getByTestId('input-tasks').fill('2')
    await page.getByTestId('input-tasks').press('Enter')
    await expect(page.getByText('2 / 10')).toBeVisible()

    // Normal input - completed mode
    await page.getByTestId('input-tasks').fill('4')
    await page.getByTestId('input-tasks').press('Enter')
    await expect(page.getByText('4 / 10')).toBeVisible()

    // +1 button (should increment to 5)
    await page.getByTestId('btn-plus-one').click()
    await expect(page.getByText('5 / 10')).toBeVisible()

    // Invalid input in completed mode (try to enter 3, which is less than current 5)
    await page.getByTestId('input-tasks').fill('3')
    await expect(page.locator('.q-field:has([data-cy="input-tasks"])')).toHaveClass(
      /q-field--error/
    )
    await page.getByTestId('input-tasks').clear()

    // Switch to remaining mode
    await page.getByTestId('btn-toggle-mode').click()
    await expect(page.getByTestId('input-tasks')).toHaveAttribute('aria-label', /noch/)

    // Input in remaining mode (3 remaining = 7 completed)
    await page.getByTestId('input-tasks').fill('3')
    await page.getByTestId('input-tasks').press('Enter')
    await expect(page.getByText('7 / 10')).toBeVisible()

    // Input in remaining mode (2 remaining = 8 completed)
    await page.getByTestId('input-tasks').fill('2')
    await page.getByTestId('input-tasks').press('Enter')
    await expect(page.getByText('8 / 10')).toBeVisible()

    // +1 button in remaining mode (should increment to 9)
    await page.getByTestId('btn-plus-one').click()
    await expect(page.getByText('9 / 10')).toBeVisible()

    // Delete row: Click delete button for measurement at index 1 (second measurement)
    await expect(page.getByTestId('measurement-table')).toBeVisible()
    await page.getByTestId('btn-delete-1').click()
    // Verify the row count decreased
    await expect(page.getByTestId('measurement-table').locator('tbody tr')).toHaveCount(5)

    // Invalid input in remaining mode (try to enter 5, which is >= current remaining of 1)
    await page.getByTestId('input-tasks').fill('5')
    await expect(page.locator('.q-field:has([data-cy="input-tasks"])')).toHaveClass(
      /q-field--error/
    )
    await page.getByTestId('input-tasks').clear()

    // Input 0 in remaining mode to finalize (0 remaining = 10 completed)
    await page.getByTestId('input-tasks').fill('0')
    await page.getByTestId('input-tasks').press('Enter')
    await expect(page.getByText('10 / 10')).toBeVisible()

    // Verify input controls are hidden when complete
    await expect(page.getByTestId('input-tasks')).toHaveCount(0)
    await expect(page.getByTestId('btn-plus-one')).toHaveCount(0)

    // Verify measurement table exists and has entries
    await expect(page.getByTestId('measurement-table')).toBeVisible()
    const tableRowCount = await page.getByTestId('measurement-table').locator('tbody tr').count()
    expect(tableRowCount).toBeGreaterThanOrEqual(1)

    // Test reset functionality
    await page.getByTestId('btn-reset-session').click()
    await expect(page.getByTestId('input-total-tasks')).toBeVisible()
  })
})
