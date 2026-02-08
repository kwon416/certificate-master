import { test, expect } from '@playwright/test';

test.describe('Search Minimum Length Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should NOT trigger autocomplete for single character input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);

    // Set up request interception to detect autocomplete API calls
    const autocompleteRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/autocomplete')) {
        autocompleteRequests.push(request.url());
      }
    });

    // Type a single character
    await searchInput.fill('정');

    // Wait longer than debounce (300ms) + buffer
    await page.waitForTimeout(600);

    // Autocomplete API should NOT have been called
    expect(autocompleteRequests.length).toBe(0);

    // Autocomplete dropdown should NOT be visible
    const dropdown = page.locator('[cmdk-list]');
    await expect(dropdown).not.toBeVisible();
  });

  test('should trigger autocomplete for two character input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);

    // Set up request interception
    const autocompleteRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/autocomplete')) {
        autocompleteRequests.push(request.url());
      }
    });

    // Type two characters
    await searchInput.fill('정보');

    // Wait for debounce + API call
    await page.waitForTimeout(600);

    // Autocomplete API SHOULD have been called
    expect(autocompleteRequests.length).toBeGreaterThan(0);
  });

  test('should NOT show "no results" message for single character', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);

    // Type a single character
    await searchInput.fill('기');
    await searchInput.press('Enter');

    // Wait for any potential API call
    await page.waitForTimeout(600);

    // Should NOT show "검색 결과가 없습니다" for single char
    // Instead, should show guidance message or nothing
    const noResultsForQuery = page.getByText(/'기'에 대한 검색 결과가 없습니다/);
    await expect(noResultsForQuery).not.toBeVisible();
  });

  test('should show results normally for two or more characters', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);

    // Type two characters
    await searchInput.fill('정보');

    // Wait for debounce + API
    await page.waitForTimeout(1000);

    // Should show results or empty state (but API was called)
    const hasResults = await page.locator('a[href^="/certificates/"]').count() > 0;
    const hasEmptyState = await page.getByText(/검색 결과가 없습니다/i).isVisible().catch(() => false);

    // One of these should be true (API was called and rendered)
    expect(hasResults || hasEmptyState).toBeTruthy();
  });
});
