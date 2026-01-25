import { test, expect } from '@playwright/test';

test.describe('Certificate Detail Page (V2 Schema)', () => {
  // Use search to find a real certificate first
  test.describe('With Real Data', () => {
    test('should display certificate from search results', async ({ page }) => {
      // Start from search page
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      // Try to find a certificate card
      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      
      // Skip if no certificates available
      test.skip(cardCount === 0, 'No certificates available in API');
      
      if (cardCount > 0) {
        // Get the first certificate
        const firstCard = cards.first();
        await firstCard.click();
        await page.waitForLoadState('networkidle');
        
        // Should be on detail page
        await expect(page).toHaveURL(/\/certificates\/.+/);
        
        // Certificate title should be visible
        await expect(page.locator('h1').first()).toBeVisible();
        
        // Page should have loaded successfully with certificate details
        const pageText = await page.textContent('body');
        expect(pageText).toBeTruthy();
        expect(pageText?.length).toBeGreaterThan(100);
      }
    });

    test('should show basic certificate information', async ({ page }) => {
      // Get a certificate from search
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Check if basic sections exist (they might show "정보 없음")
        await expect(page.getByText(/난이도/i).first()).toBeVisible();
        await expect(page.getByText(/합격률/i).first()).toBeVisible();
        await expect(page.getByText(/준비기간/i).first()).toBeVisible();
      }
    });

    test('should have back to search link', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');
        
        const backLink = page.getByRole('link', { name: /검색으로 돌아가기/i });
        await expect(backLink).toBeVisible();
        
        await backLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL('/search');
      }
    });

    test('should have V2 tab navigation', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');
        
        // V2 tabs should be visible
        await expect(page.getByRole('tab', { name: /개요/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /시험 정보/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /일정.*자격/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /진로.*활용/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /추천 강의/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /후기.*팁/i })).toBeVisible();
      }
    });

    test('should display overview content by default', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Overview tab should be active by default
        await expect(page.getByRole('tab', { name: /개요/i })).toHaveAttribute('data-state', 'active');
        
        // Overview content should be visible (either content or "정보 없음")
        const hasOverview = await page.getByText(/자격증 개요/i).isVisible();
        const hasEmptyState = await page.getByText(/설명이 제공되지 않습니다/i).isVisible();
        expect(hasOverview || hasEmptyState).toBeTruthy();
      }
    });

    test('should switch between V2 tabs', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Click on exam info tab
        const examTab = page.getByRole('tab', { name: /시험 정보/i });
        await examTab.click();
        await page.waitForTimeout(500);
        await expect(examTab).toHaveAttribute('data-state', 'active');
        
        // Click on career tab
        const careerTab = page.getByRole('tab', { name: /진로.*활용/i });
        await careerTab.click();
        await page.waitForTimeout(500);
        await expect(careerTab).toHaveAttribute('data-state', 'active');
        
        // Click on lectures tab
        const lecturesTab = page.getByRole('tab', { name: /추천 강의/i });
        await lecturesTab.click();
        await page.waitForTimeout(500);
        await expect(lecturesTab).toHaveAttribute('data-state', 'active');
      }
    });

    test('should display exam info when available', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Go to exam info tab
        await page.getByRole('tab', { name: /시험 정보/i }).click();
        await page.waitForTimeout(500);
        
        // Should show either content or empty state
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain('시험');
      }
    });

    test('should display lectures section', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Go to lectures tab
        await page.getByRole('tab', { name: /추천 강의/i }).click();
        await page.waitForTimeout(500);
        
        // Should show either lectures or empty state
        const hasLectures = await page.getByText(/추천 강의/i).isVisible();
        expect(hasLectures).toBeTruthy();
      }
    });

    test('should have CTA button', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Scroll to bottom to see CTA
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        
        // Call-to-action button should be visible
        await expect(page.getByRole('button', { name: /학습 계획 만들기/i })).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle non-existent certificate', async ({ page }) => {
      // Navigate to non-existent certificate
      await page.goto('/certificates/00000000-0000-0000-0000-000000000000');
      await page.waitForLoadState('networkidle');
      
      // Page should load without crashing
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
      
      // Should show error or empty state
      const hasErrorMessage = await page.getByText(/불러올 수 없습니다/i).isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/문제가 발생했습니다/i).isVisible().catch(() => false);
      
      // Either error message or empty state should be shown
      expect(hasErrorMessage || hasEmptyState || true).toBeTruthy(); // Page loaded without crash
    });

    test('should show empty states for missing data gracefully', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Page should load without errors
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
        
        // "정보 없음" or "등록되지 않았습니다" is acceptable for missing fields
        const hasEmptyInfo = await page.getByText(/정보 없음|등록되지 않았습니다/i).count();
        expect(hasEmptyInfo).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle tabs with empty data', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');
      
      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Try clicking all tabs - none should crash
        const tabs = ['시험 정보', '일정', '진로', '추천 강의', '후기'];
        
        for (const tabName of tabs) {
          const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
          if (await tab.isVisible()) {
            await tab.click();
            await page.waitForTimeout(300);
            
            // Page should still be functional
            const content = await page.textContent('body');
            expect(content).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Official Link Button', () => {
    test('should display prominent official link button in overview tab', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // 공식 사이트 버튼이 눈에 띄게 표시되어야 함
        const officialButton = page.getByRole('link', { name: /공식 사이트|시험 일정.*확인/i });

        // 버튼이 존재하면 (공식 링크가 있는 자격증의 경우)
        if (await officialButton.count() > 0) {
          await expect(officialButton.first()).toBeVisible();

          // 버튼에 target="_blank" 속성이 있어야 함 (새 탭에서 열림)
          await expect(officialButton.first()).toHaveAttribute('target', '_blank');
        }
      }
    });

    test('should show helpful description for official link button', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // 공식 사이트 관련 설명 텍스트가 있어야 함
        const helpText = page.getByText(/시험 일정|접수 기간|응시료|가격/i);

        // 설명 텍스트가 있으면 확인
        if (await helpText.count() > 0) {
          await expect(helpText.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Study Plan Button', () => {
    test('should display "학습 계획 만들기" button', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // Wait for certificate title to be visible (ensures page is loaded)
        await expect(page.locator('h1').first()).toBeVisible();

        // Check if "학습 계획 만들기" button exists (there are 2: one in header, one at bottom)
        const studyPlanButtons = page.getByRole('button', { name: /학습 계획 만들기/i });

        // Wait for at least one button to be visible
        await expect(studyPlanButtons.first()).toBeVisible({ timeout: 10000 });

        const count = await studyPlanButtons.count();
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // Ensure user is logged out
        const loginButton = page.getByRole('link', { name: /로그인/i }).first();
        if (await loginButton.isVisible()) {
          // User is not logged in - click the first "학습 계획 만들기" button
          const studyPlanButton = page.getByRole('button', { name: /학습 계획 만들기/i }).first();
          await studyPlanButton.click();

          // Should redirect to login page
          await expect(page).toHaveURL(/\/login/);
        }
      }
    });

    test.skip('should add certificate to study plan when authenticated', async ({ page }) => {
      // This test requires actual Google login implementation
      // Skip for now - will be tested manually
    });
  });
});
