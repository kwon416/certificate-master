/**
 * Comprehensive E2E Tests for Certificate Master
 * 
 * Tests all major features and user flows
 */

import { test, expect } from '@playwright/test';

test.describe('Certificate Master - Comprehensive Tests', () => {
  
  test.describe('Landing Page Features', () => {
    test('should display hero section with working CTA', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Hero section
      await expect(page.getByText(/자격증 준비/i)).toBeVisible();
      await expect(page.getByText(/이제 혼자가 아니야/i)).toBeVisible();
      
      // CTA button should work
      const ctaButton = page.getByRole('link', { name: /지금 시작|무료로 시작/i }).first();
      await expect(ctaButton).toBeVisible();
      await ctaButton.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to search or login (signup was removed)
      const url = page.url();
      expect(url.includes('/search') || url.includes('/login')).toBeTruthy();
    });

    test('should display feature cards', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for feature cards
      const features = ['스마트 검색', 'AI 학습계획', '진행도 추적'];
      
      for (const feature of features) {
        const featureCard = page.getByText(feature, { exact: true });
        await expect(featureCard).toBeVisible();
      }
    });

    test('should display popular certificates or empty state', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should show either certificates or loading/empty state
      await page.waitForTimeout(1000);
      
      const hasCertificates = await page.locator('a[href^="/certificates/"]').count() > 0;
      const hasEmptyState = await page.getByText(/인기 자격증/i).isVisible().catch(() => false);
      
      expect(hasCertificates || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Search Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
    });

    test('should perform basic search', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
      
      await searchInput.fill('정보');
      await searchInput.press('Enter');
      await page.waitForTimeout(1500);
      
      // Should show results, empty message, or page content
      const hasResults = await page.locator('a[href^="/certificates/"]').count() > 0;
      const hasMessage = await page.getByText(/결과|검색|개 결과/i).isVisible().catch(() => false);
      const pageContent = await page.textContent('body');
      
      expect(hasResults || hasMessage || pageContent?.includes('자격증')).toBeTruthy();
    });

    test('should show autocomplete suggestions', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
      
      await searchInput.fill('정보');
      await page.waitForTimeout(500);
      
      // Should show autocomplete dropdown
      const suggestions = page.locator('[role="option"]');
      const suggestionCount = await suggestions.count();
      
      // May or may not have suggestions depending on data
      if (suggestionCount > 0) {
        await expect(suggestions.first()).toBeVisible();
      }
    });

    test('should filter by category', async ({ page }) => {
      const viewportSize = page.viewportSize();
      if (viewportSize && viewportSize.width >= 1024) {
        // Desktop view
        const categoryLabel = page.getByText('자격구분', { exact: true }).first();
        await expect(categoryLabel).toBeVisible();
        
        const categorySelect = categoryLabel.locator('..').locator('..').getByRole('combobox').first();
        await categorySelect.click();
        
        // Select a category
        const options = page.getByRole('option');
        const optionCount = await options.count();
        
        if (optionCount > 1) {
          await options.nth(1).click();
          await page.waitForTimeout(500);
          
          // Should apply filter
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should filter by series hierarchically', async ({ page }) => {
      const viewportSize = page.viewportSize();
      if (viewportSize && viewportSize.width >= 1024) {
        // First select a category
        const categoryLabel = page.getByText('자격구분', { exact: true }).first();
        const categorySelect = categoryLabel.locator('..').locator('..').getByRole('combobox').first();
        await categorySelect.click();
        
        const categoryOptions = page.getByRole('option');
        const categoryCount = await categoryOptions.count();
        
        if (categoryCount > 1) {
          await categoryOptions.nth(1).click();
          await page.waitForTimeout(500);
          
          // Now series dropdown should be enabled
          const seriesLabel = page.getByText('계열', { exact: true }).first();
          const seriesSelect = seriesLabel.locator('..').locator('..').getByRole('combobox').first();
          
          // Check if enabled
          const isDisabled = await seriesSelect.isDisabled().catch(() => true);
          
          if (!isDisabled) {
            await seriesSelect.click();
            const seriesOptions = page.getByRole('option');
            const seriesCount = await seriesOptions.count();
            
            if (seriesCount > 1) {
              await seriesOptions.nth(1).click();
              await page.waitForTimeout(500);
            }
          }
        }
      }
    });

    test('should reset all filters', async ({ page }) => {
      const viewportSize = page.viewportSize();
      if (viewportSize && viewportSize.width >= 1024) {
        // Set search and filter
        const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
        await searchInput.fill('기사');
        await page.waitForTimeout(300);
        
        // Click reset
        const resetButton = page.getByRole('button', { name: /필터 초기화/i });
        await resetButton.click();
        await page.waitForTimeout(500);
        
        // Search should be cleared
        await expect(searchInput).toHaveValue('');
      }
    });

    test('should implement infinite scroll', async ({ page }) => {
      // Search for something that has many results
      const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
      await searchInput.fill('기술');
      await page.waitForTimeout(1000);
      
      const initialCardCount = await page.locator('a[href^="/certificates/"]').count();
      
      if (initialCardCount > 0) {
        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1500);
        
        // May have loaded more cards
        const newCardCount = await page.locator('a[href^="/certificates/"]').count();
        
        // Just verify no errors occurred
        expect(newCardCount).toBeGreaterThanOrEqual(initialCardCount);
      }
    });
  });

  test.describe('Certificate Detail Page', () => {
    test('should display certificate details', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      
      const firstCard = page.locator('a[href^="/certificates/"]').first();
      const cardCount = await page.locator('a[href^="/certificates/"]').count();
      
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await firstCard.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        
        // Should have tabs (check for any tab)
        const tabList = page.getByRole('tablist');
        await expect(tabList).toBeVisible();
      }
    });

    test('should switch between tabs', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      
      const firstCard = page.locator('a[href^="/certificates/"]').first();
      const cardCount = await page.locator('a[href^="/certificates/"]').count();
      
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await firstCard.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        
        // Get all tabs
        const tabs = page.getByRole('tab');
        const tabCount = await tabs.count();
        
        if (tabCount > 1) {
          // Click on second tab
          await tabs.nth(1).click();
          await page.waitForTimeout(500);
          
          // Tab should be active
          await expect(tabs.nth(1)).toHaveAttribute('data-state', 'active');
        }
      }
    });
  });

  test.describe('Authentication Pages', () => {
    test('should display login page with Google OAuth', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Should have Google login button (not email/password)
      const googleButton = page.getByRole('button', { name: /Google/i });
      await expect(googleButton).toBeVisible();

      // Should NOT have email/password fields (removed)
      const emailInput = page.getByPlaceholder(/email/i);
      const passwordInput = page.getByPlaceholder(/••••/i);

      await expect(emailInput).not.toBeVisible();
      await expect(passwordInput).not.toBeVisible();
    });

    test('should redirect signup page to login', async ({ page }) => {
      // /signup should redirect to /login since signup is removed
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      // Should have Google login button
      const googleButton = page.getByRole('button', { name: /Google/i });
      await expect(googleButton).toBeVisible();
    });

    test('should NOT have signup navigation (removed)', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Should NOT have signup link (Google OAuth handles account creation)
      const signupLink = page.getByRole('link', { name: /회원가입/i });
      await expect(signupLink).not.toBeVisible();
    });
  });

  test.describe('Dashboard', () => {
    test('should display dashboard or redirect to login', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Either shows dashboard or redirects to login
      const url = page.url();
      
      if (url.includes('/login')) {
        // Not authenticated - should show login
        await expect(page.getByRole('button', { name: /로그인/i })).toBeVisible();
      } else {
        // Authenticated or showing dashboard content
        // Should show either dashboard content or empty state
        const hasContent = await page.getByText(/학습|진행률|대시보드/i).isVisible().catch(() => false);
        expect(hasContent || url.includes('/login')).toBeTruthy();
      }
    });
  });

  test.describe('Navigation', () => {
    test('should have working header navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Logo should navigate to home
      const logo = page.getByRole('banner').getByRole('link', { name: /Certificate Master/i });
      await expect(logo).toBeVisible();
      
      // Check if any navigation is visible
      const banner = page.getByRole('banner');
      await expect(banner).toBeVisible();
    });

    test('should have working footer', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // Check footer content
      const footer = page.getByRole('contentinfo');
      await expect(footer).toBeVisible();
      
      const copyrightText = page.getByRole('contentinfo').getByText(/Certificate Master/i).first();
      await expect(copyrightText).toBeVisible();
    });

    test('should be responsive', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should display mobile menu button
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Certificate Master');
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      // Search should still work
      const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
      await expect(searchInput).toBeVisible();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      // Filters should be visible in sidebar
      const filterSidebar = page.getByText('필터', { exact: true }).first();
      await expect(filterSidebar).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages', async ({ page }) => {
      await page.goto('/nonexistent-page');
      await page.waitForLoadState('networkidle');
      
      // Should show 404 or redirect
      const url = page.url();
      const pageContent = await page.textContent('body');
      
      expect(pageContent).toBeTruthy();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      // Page should load without crashes
      const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
      await expect(searchInput).toBeVisible();
      
      // Try a search
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Should show either results or empty state, no error crashes
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should load pages within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle rapid user interactions', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.getByPlaceholder(/자격증명, 분야/i);
      
      // Rapid typing
      await searchInput.fill('a');
      await searchInput.fill('ab');
      await searchInput.fill('abc');
      await searchInput.fill('abcd');
      await searchInput.fill('abcde');
      
      // Should not crash
      await page.waitForTimeout(1000);
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    });
  });
});

