import { test, expect } from '@playwright/test'

test.describe('Recommend Page Layout', () => {
  test('should not have excessive empty space below wizard', async ({ page }) => {
    await page.goto('/recommend')

    // Get the footer position
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Get the last content element (wizard buttons) position
    const wizardButtons = page.locator('button:has-text("다음"), button:has-text("이전")').last()
    await expect(wizardButtons).toBeVisible()

    const buttonBox = await wizardButtons.boundingBox()
    const footerBox = await footer.boundingBox()

    // The gap between the last wizard content and the footer should not be
    // excessively large (less than viewport height)
    const gap = footerBox!.y - (buttonBox!.y + buttonBox!.height)
    const viewportHeight = page.viewportSize()!.height

    expect(gap).toBeLessThan(viewportHeight * 0.6)
  })
})
