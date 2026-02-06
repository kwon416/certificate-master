import { test, expect } from '@playwright/test';

test.describe('Global Navigation', () => {
  test('should navigate through all main pages', async ({ page }) => {
    // Start at home (now search page)
    await page.goto('/');
    await expect(page).toHaveTitle(/Certificate Master/i);

    // Home is now search page
    await expect(page.getByRole('heading', { name: /자격증 검색/i })).toBeVisible();

    // Go to AI recommend
    await page.getByRole('link', { name: /AI 추천/i }).first().click();
    await expect(page).toHaveURL('/recommend');

    // Go back to home via logo
    await page.getByRole('link', { name: /Certificate Master/i }).first().click();
    await expect(page).toHaveURL('/');
  });

  test('should maintain header across all pages', async ({ page }) => {
    // /signup removed - now redirects to /login, /search redirects to /
    const pages = ['/', '/about', '/recommend', '/login', '/dashboard', '/certificates/1'];

    for (const url of pages) {
      await page.goto(url);

      // Header should always be visible
      await expect(page.getByRole('link', { name: /Certificate Master/i }).first()).toBeVisible();
    }
  });

  test('should maintain footer across all pages', async ({ page }) => {
    // /signup removed - now redirects to /login, /search redirects to /
    const pages = ['/', '/about', '/recommend', '/login', '/dashboard', '/certificates/1'];

    for (const url of pages) {
      await page.goto(url);

      // Footer should always be visible
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      await expect(footer.getByRole('link', { name: /Certificate Master/i })).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'Mobile S', width: 320, height: 568 },
    { name: 'Mobile M', width: 375, height: 667 },
    { name: 'Mobile L', width: 425, height: 812 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Laptop', width: 1024, height: 768 },
    { name: 'Desktop', width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    test(`should render search page correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Search input should be visible (home is now search page)
      await expect(page.getByPlaceholder(/자격증명/i)).toBeVisible();

      // No horizontal overflow
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      expect(bodyBox?.width).toBeLessThanOrEqual(viewport.width + 20); // Small margin for scrollbar
    });

    test(`should render about page correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/about');

      // Main content should be visible
      await expect(page.getByRole('heading', { name: /자격증 준비/i })).toBeVisible();
    });
  }
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy on landing page', async ({ page }) => {
    await page.goto('/about');

    // Should have h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // H1 count should be 1
    await expect(h1).toHaveCount(1);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/about');
    
    // All img elements should have alt attribute
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Either has alt or is decorative (aria-hidden)
      const ariaHidden = await img.getAttribute('aria-hidden');
      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/about');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have Google login button on login page', async ({ page }) => {
    await page.goto('/login');

    // Should have Google OAuth button (not email/password)
    const googleButton = page.getByRole('button', { name: /Google/i });
    await expect(googleButton).toBeVisible();

    // Should NOT have email/password fields (removed)
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/••••/i);

    await expect(emailInput).not.toBeVisible();
    await expect(passwordInput).not.toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 or redirect (Next.js default behavior)
    // At minimum, should not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle invalid certificate ID', async ({ page }) => {
    await page.goto('/certificates/999999');
    
    // Should handle gracefully - either show error or fallback
    await expect(page.locator('body')).toBeVisible();
  });
});

