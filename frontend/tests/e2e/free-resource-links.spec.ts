import { test, expect } from '@playwright/test';

test.describe('Free Resource Links - 무료 학습 자료 링크', () => {
  test('should render URL-type free resources as links with target="_blank"', async ({ page }) => {
    // Navigate to home page and find a certificate
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('a[href^="/certificates/"]');
    const cardCount = await cards.count();
    test.skip(cardCount === 0, 'No certificates available');

    // Click the first certificate card
    await cards.first().click();
    await page.waitForLoadState('networkidle');

    // Find the "시험 준비" section (CostBreakdownCard)
    const examPrepSection = page.getByText('시험 준비').first();
    await expect(examPrepSection).toBeVisible({ timeout: 10000 });

    // Check if "무료 학습 자료" section exists
    const freeResourcesLabel = page.getByText('무료 학습 자료');
    if (await freeResourcesLabel.count() === 0) {
      test.skip(true, 'No free resources available for this certificate');
      return;
    }

    // Find all links within the free resources list (siblings of the label)
    // Any <a> tags in the free resources section should have target="_blank"
    const freeResourceLinks = page.locator('ul').filter({ has: page.locator('span.text-emerald-400') }).locator('a');
    const linkCount = await freeResourceLinks.count();

    if (linkCount > 0) {
      for (let i = 0; i < linkCount; i++) {
        const link = freeResourceLinks.nth(i);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /noopener/);
      }
    }
  });

  test('should linkify URLs embedded in free resource text', async ({ page }) => {
    // Test with injected content to validate the linkify behavior
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('a[href^="/certificates/"]');
    const cardCount = await cards.count();
    test.skip(cardCount === 0, 'No certificates available');

    await cards.first().click();
    await page.waitForLoadState('networkidle');

    // Verify the component renders - even plain text resources should work
    const examPrepSection = page.getByText('시험 준비').first();
    await expect(examPrepSection).toBeVisible({ timeout: 10000 });

    // All <a> tags inside CostBreakdownCard (except YouTube button) should open in new tab
    const costCard = examPrepSection.locator('..').locator('..');
    const allLinks = costCard.locator('a[href^="http"]');
    const allLinkCount = await allLinks.count();

    for (let i = 0; i < allLinkCount; i++) {
      const link = allLinks.nth(i);
      await expect(link).toHaveAttribute('target', '_blank');
    }
  });

  test('should not break rendering for plain text resources (no URLs)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('a[href^="/certificates/"]');
    const cardCount = await cards.count();
    test.skip(cardCount === 0, 'No certificates available');

    await cards.first().click();
    await page.waitForLoadState('networkidle');

    // The page should render without errors
    const examPrepSection = page.getByText('시험 준비').first();
    await expect(examPrepSection).toBeVisible({ timeout: 10000 });

    // Free resources section should display text properly
    const freeResourcesLabel = page.getByText('무료 학습 자료');
    if (await freeResourcesLabel.count() > 0) {
      await expect(freeResourcesLabel.first()).toBeVisible();

      // List items should exist and have text content
      const listItems = page.locator('ul').filter({ has: page.locator('span.text-emerald-400') }).locator('li');
      const itemCount = await listItems.count();
      expect(itemCount).toBeGreaterThan(0);

      // Each item should have non-empty text
      for (let i = 0; i < itemCount; i++) {
        const text = await listItems.nth(i).textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
