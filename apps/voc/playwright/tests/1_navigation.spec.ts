import { expect, test as it } from "@playwright/test"

it.describe("VOC Navigation Smoke Tests", () => {
  it.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  it("navigate Home to History and back", async ({ page }) => {
    // Verify we're on the home page
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate to History
    await page.getByTestId("history-button").click()
    await expect(page).toHaveURL(/\/history/u)
    await expect(page.getByTestId("history-page-title")).toBeVisible()

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId("history-page-title")).toBeVisible()

    // Test back via button
    await page.getByTestId("back-button").click()
    await expect(page).not.toHaveURL(/\/history/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for browser back test
    await page.getByTestId("history-button").click()
    await expect(page).toHaveURL(/\/history/u)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/history/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for escape key test
    await page.getByTestId("history-button").click()
    await expect(page).toHaveURL(/\/history/u)
    await page.keyboard.press("Escape")
    await expect(page).not.toHaveURL(/\/history/u)
    await expect(page.getByTestId("app-title")).toBeVisible()
  })

  it("navigate Home to Cards and back", async ({ page }) => {
    // Verify we're on the home page
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate to Cards
    await page.getByTestId("cards-button").click()
    await expect(page).toHaveURL(/\/cards/u)
    await expect(page.getByTestId("reset-levels-button")).toBeVisible()

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId("reset-levels-button")).toBeVisible()

    // Test back via button
    await page.getByTestId("back-button").first().click()
    await expect(page).not.toHaveURL(/\/cards/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for browser back test
    await page.getByTestId("cards-button").click()
    await expect(page).toHaveURL(/\/cards/u)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/cards/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for escape key test
    await page.getByTestId("cards-button").click()
    await expect(page).toHaveURL(/\/cards/u)
    await page.keyboard.press("Escape")
    await expect(page).not.toHaveURL(/\/cards/u)
    await expect(page.getByTestId("app-title")).toBeVisible()
  })

  it("navigate Cards to CardsEdit and back to Cards", async ({ page }) => {
    // Navigate to Cards first
    await page.getByTestId("cards-button").click()
    await expect(page).toHaveURL(/\/cards/u)

    // Navigate to CardsEdit
    await page.getByTestId("edit-cards-button").click()
    await expect(page).toHaveURL(/\/cards-edit/u)
    await expect(page.getByTestId("card-edit-item").first()).toBeVisible()

    // Test back via button goes to CardsManPage
    await page.getByTestId("back-button").click()
    await expect(page).not.toHaveURL(/\/cards-edit/u)
    await expect(page).toHaveURL(/\/cards/u)

    // Navigate again for escape key test
    await page.getByTestId("edit-cards-button").click()
    await expect(page).toHaveURL(/\/cards-edit/u)
    await page.keyboard.press("Escape")
    await expect(page).not.toHaveURL(/\/cards-edit/u)
    await expect(page).toHaveURL(/\/cards/u)
  })

  it("navigate Home to Game and back", async ({ page }) => {
    // Verify we're on the home page
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Initialize game settings by selecting mode and language
    await page.getByRole("button", { name: "Multiple Choice" }).click()
    await page.getByRole("button", { name: "Voc → DE" }).click()

    // Navigate to Game
    await page.getByTestId("start-button").click()
    await expect(page).toHaveURL(/\/game/u)
    // Wait for game page to load properly
    await expect(page.getByTestId("question-display")).toBeVisible({ timeout: 10000 })

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId("question-display")).toBeVisible({ timeout: 10000 })

    // Test back via button
    await page.getByTestId("back-button").click()
    await expect(page).not.toHaveURL(/\/game/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for browser back test
    await page.getByTestId("start-button").click()
    await expect(page).toHaveURL(/\/game/u)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/game/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for escape key test
    await page.getByTestId("start-button").click()
    await expect(page).toHaveURL(/\/game/u)
    await page.keyboard.press("Escape")
    await expect(page).not.toHaveURL(/\/game/u)
    await expect(page.getByTestId("app-title")).toBeVisible()
  })

  it("navigate Home to Info and back", async ({ page }) => {
    // Verify we're on the home page
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate to Info
    await page.getByTestId("info-button").click()
    await expect(page).toHaveURL(/\/info/u)
    await expect(page.getByTestId("info-page-title")).toBeVisible()

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId("info-page-title")).toBeVisible()

    // Test back via button
    await page.getByTestId("back-button").first().click()
    await expect(page).not.toHaveURL(/\/info/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for browser back test
    await page.getByTestId("info-button").click()
    await expect(page).toHaveURL(/\/info/u)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/info/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for escape key test
    await page.getByTestId("info-button").click()
    await expect(page).toHaveURL(/\/info/u)
    await page.keyboard.press("Escape")
    await expect(page).not.toHaveURL(/\/info/u)
    await expect(page.getByTestId("app-title")).toBeVisible()
  })
})
