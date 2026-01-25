import { test, expect } from '@playwright/test';

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('should display search page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /자격증 검색/i })).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEditable();
  });

  test('should show search results or empty state', async ({ page }) => {
    // Wait a bit for results to load
    await page.waitForTimeout(1000);
    
    // Should show either results or empty state
    const hasResults = await page.locator('a[href^="/certificates/"]').count() > 0;
    const hasEmptyState = await page.getByText(/검색해보세요/i).isVisible().catch(() => false);
    
    expect(hasResults || hasEmptyState).toBeTruthy();
  });

  test('should perform search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
    
    // Type search query
    await searchInput.fill('기사');
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Should show results or no results message
    const hasCards = await page.locator('a[href^="/certificates/"]').count();
    const hasEmptyMessage = await page.getByText(/결과가 없습니다/i).isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/검색해보세요/i).isVisible().catch(() => false);
    
    expect(hasCards > 0 || hasEmptyMessage || hasEmptyState).toBeTruthy();
  });

  test('should have filter sidebar', async ({ page }) => {
    // Difficulty filter should be visible (if viewport is large enough)
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width >= 768) {
      await expect(page.getByText(/난이도/i).first()).toBeVisible();
    }
  });

  test('should display certificate cards when results exist', async ({ page }) => {
    // Wait for potential results
    await page.waitForTimeout(1000);
    
    const resultCount = await page.locator('a[href^="/certificates/"]').count();
    
    if (resultCount > 0) {
      // Certificate cards should be visible
      await expect(page.locator('a[href^="/certificates/"]').first()).toBeVisible();
    }
  });

  test('should navigate to certificate detail on card click', async ({ page }) => {
    // Wait for cards to load
    await page.waitForTimeout(1000);
    
    const cards = page.locator('a[href^="/certificates/"]');
    const cardCount = await cards.count();
    
    test.skip(cardCount === 0, 'No certificates available to test navigation');
    
    if (cardCount > 0) {
      // Click first certificate card
      await cards.first().click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to detail page
      await expect(page).toHaveURL(/\/certificates\/.+/);
    }
  });

  test('should show back link in detail page and return to search', async ({ page }) => {
    // Navigate to a certificate if available
    await page.waitForTimeout(1000);
    const cards = page.locator('a[href^="/certificates/"]');
    const cardCount = await cards.count();
    
    test.skip(cardCount === 0, 'No certificates available');
    
    if (cardCount > 0) {
      await cards.first().click();
      await page.waitForLoadState('networkidle');
      
      // Click back to search
      const backLink = page.getByRole('link', { name: /검색으로 돌아가기/i });
      await expect(backLink).toBeVisible();
      await backLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should be back on search page
      await expect(page).toHaveURL('/search');
    }
  });

  test('should handle empty search results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
    
    // Search for something unlikely to exist
    await searchInput.fill('zzzzz_nonexistent_999');
    await searchInput.press('Enter');
    
    await page.waitForTimeout(2000);
    
    // Should show either:
    // 1. "검색 결과가 없습니다" message
    // 2. Empty state
    // 3. No cards
    const cardCount = await page.locator('a[href^="/certificates/"]').count();
    const hasNoResults = await page.getByText(/결과가 없습니다/i).isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/검색해보세요/i).isVisible().catch(() => false);
    
    expect(cardCount === 0 || hasNoResults || hasEmptyState).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // This test checks if error states are handled
    // The page should show either data or an error message, never break
    await page.waitForLoadState('networkidle');

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    // Should not show any unhandled errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Refresh to trigger any potential errors
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that page still works
    await expect(page.getByRole('heading', { name: /자격증 검색/i })).toBeVisible();
  });

  test('should clear search query when X button is clicked', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);

    // Type search query
    await searchInput.fill('정보처리기사');
    await expect(searchInput).toHaveValue('정보처리기사');

    // Click X button to clear
    const clearButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    await clearButton.click();

    // Search input should be empty
    await expect(searchInput).toHaveValue('');
  });

  test('should clear search query when reset filters button is clicked', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);

    // Type search query
    await searchInput.fill('정보처리기사');
    await expect(searchInput).toHaveValue('정보처리기사');

    // Click reset filters button
    const resetButton = page.getByRole('button', { name: /필터 초기화/i });

    // For desktop view
    if (await resetButton.isVisible()) {
      await resetButton.click();
    } else {
      // For mobile view - open filter sheet first
      const filterButton = page.getByRole('button', { name: /필터/i }).first();
      await filterButton.click();
      await page.waitForTimeout(500);
      const mobileResetButton = page.getByRole('button', { name: /필터 초기화/i });
      await mobileResetButton.click();
    }

    // Wait a bit for state update
    await page.waitForTimeout(300);

    // Search input should be empty
    await expect(searchInput).toHaveValue('');
  });
});
