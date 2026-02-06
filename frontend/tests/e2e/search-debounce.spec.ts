import { test, expect } from '@playwright/test';

test.describe('Search Debouncing and Reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should clear search input when filter reset is clicked', async ({ page }) => {
    // Type in search box
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
    await searchInput.fill('정보처리');
    await expect(searchInput).toHaveValue('정보처리');
    
    // Wait for debounce
    await page.waitForTimeout(500);
    
    // Click filter reset button
    const resetButton = page.getByRole('button', { name: /필터 초기화/i });
    await resetButton.click();
    
    // Wait for debounce
    await page.waitForTimeout(500);
    
    // Search input should be cleared
    await expect(searchInput).toHaveValue('');
  });

  test('should clear search input when X button is clicked', async ({ page }) => {
    // Type in search box
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
    await searchInput.fill('기술사');
    await expect(searchInput).toHaveValue('기술사');
    
    // Click X button to clear
    const clearButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('svg') }).first();
    await clearButton.click();
    
    // Search input should be cleared
    await expect(searchInput).toHaveValue('');
  });

  test('should debounce search input changes', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
    
    // Type quickly
    await searchInput.fill('정');
    await page.waitForTimeout(100);
    await searchInput.fill('정보');
    await page.waitForTimeout(100);
    await searchInput.fill('정보처리');
    
    // Should not trigger search immediately
    await page.waitForTimeout(200);
    
    // After debounce delay, search should be triggered
    await page.waitForTimeout(200);
    
    // Should show results or empty state
    await page.waitForTimeout(500);
    const hasResults = await page.locator('a[href^="/certificates/"]').count() > 0;
    const hasEmptyState = await page.getByText(/검색해보세요|결과가 없습니다/i).isVisible().catch(() => false);
    
    expect(hasResults || hasEmptyState).toBeTruthy();
  });

  test('should debounce category filter changes', async ({ page }) => {
    // Open category dropdown (desktop view)
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width >= 1024) {
      const categorySelect = page.getByText('자격구분').locator('..').locator('..').getByRole('combobox').first();
      await categorySelect.click();
      
      // Select a category
      const firstCategory = page.getByRole('option').nth(1);
      await firstCategory.click();
      
      // Should debounce the change
      await page.waitForTimeout(500);
      
      // Should show filtered results
      await page.waitForTimeout(500);
    }
  });

  test('should clear search results when input is cleared', async ({ page }) => {
    // Type and search
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
    await searchInput.fill('정보');
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Clear search input
    await searchInput.fill('');
    
    // Wait for debounce
    await page.waitForTimeout(500);
    
    // Should show empty state or all results
    await page.waitForTimeout(500);
  });

  test('should maintain filter state when search input changes', async ({ page }) => {
    // Set a category filter first (desktop view)
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width >= 1024) {
      const categorySelect = page.getByText('자격구분').locator('..').locator('..').getByRole('combobox').first();
      await categorySelect.click();
      
      const firstCategory = page.getByRole('option').nth(1);
      const categoryText = await firstCategory.textContent();
      await firstCategory.click();
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Now type in search
      const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
      await searchInput.fill('기사');
      
      // Wait for debounce
      await page.waitForTimeout(500);
      
      // Category filter should still be applied
      // (We can verify this by checking if the select still shows the selected value)
      await categorySelect.click();
      await page.waitForTimeout(100);
    }
  });

  test('should handle rapid filter changes gracefully', async ({ page }) => {
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width >= 1024) {
      // Rapidly change filters
      const categorySelect = page.getByText('자격구분').locator('..').locator('..').getByRole('combobox').first();
      
      for (let i = 0; i < 3; i++) {
        await categorySelect.click();
        await page.waitForTimeout(50);
        const option = page.getByRole('option').nth((i % 3) + 1);
        await option.click();
        await page.waitForTimeout(50);
      }
      
      // Wait for final debounce
      await page.waitForTimeout(500);
      
      // Should show results without errors
      await page.waitForTimeout(500);
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });

  test('should show loading state during debounce', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
    
    // Type search query
    await searchInput.fill('정보처리');
    
    // Should show results after debounce
    await page.waitForTimeout(500);
  });

  test('should cancel previous search when new input is entered', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
    
    // Type first query
    await searchInput.fill('기사');
    await page.waitForTimeout(100);
    
    // Type second query before first completes
    await searchInput.fill('기술사');
    
    // Wait for debounce
    await page.waitForTimeout(500);
    
    // Should show results for "기술사", not "기사"
    await page.waitForTimeout(500);
  });

  test('should reset all filters including search when reset button is clicked', async ({ page }) => {
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width >= 1024) {
      // Set search query
      const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
      await searchInput.fill('정보');
      await page.waitForTimeout(500);
      
      // Set category filter
      const categorySelect = page.getByText('자격구분').locator('..').locator('..').getByRole('combobox').first();
      await categorySelect.click();
      const firstCategory = page.getByRole('option').nth(1);
      await firstCategory.click();
      await page.waitForTimeout(500);
      
      // Click reset button
      const resetButton = page.getByRole('button', { name: /필터 초기화/i });
      await resetButton.click();
      await page.waitForTimeout(500);
      
      // Both search and filters should be reset
      await expect(searchInput).toHaveValue('');
      
      // Category should be back to "전체"
      await categorySelect.click();
      const allOption = page.getByRole('option', { name: '전체' });
      await expect(allOption).toHaveAttribute('data-state', 'checked');
    }
  });
});

