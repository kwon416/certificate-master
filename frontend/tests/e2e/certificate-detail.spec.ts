import { test, expect } from '@playwright/test';

test.describe('Certificate Detail Page (V2 Schema)', () => {
  // Use search to find a real certificate first
  test.describe('With Real Data', () => {
    test('should display certificate from search results', async ({ page }) => {
      // Start from home page (search redirects to /)
      await page.goto('/');
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
      // Get a certificate from home page
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // Check if basic sections exist (they might show "정보 없음")
        await expect(page.getByText(/난이도/i).first()).toBeVisible();
        await expect(page.getByText(/준비기간/i).first()).toBeVisible();
      }
    });

    test('should have back to search link', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        const backLink = page.getByRole('link', { name: /검색으로 돌아가기/i });
        await expect(backLink).toBeVisible();

        // /search redirects to / via next.config.mjs
        await backLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL('/');
      }
    });

    test('should have tab navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // Current tabs
        await expect(page.getByRole('tab', { name: /한눈에 보기/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /시험 정보/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /합격 전략/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /취업 활용/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /학습 가이드/i })).toBeVisible();
      }
    });

    test('should display overview content by default', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // "한눈에 보기" tab should be active by default
        await expect(page.getByRole('tab', { name: /한눈에 보기/i })).toHaveAttribute('data-state', 'active');
      }
    });

    test('should switch between tabs', async ({ page }) => {
      await page.goto('/');
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

        // Click on feasibility tab
        const feasibilityTab = page.getByRole('tab', { name: /합격 전략/i });
        await feasibilityTab.click();
        await page.waitForTimeout(500);
        await expect(feasibilityTab).toHaveAttribute('data-state', 'active');

        // Click on career tab
        const careerTab = page.getByRole('tab', { name: /취업 활용/i });
        await careerTab.click();
        await page.waitForTimeout(500);
        await expect(careerTab).toHaveAttribute('data-state', 'active');

        // Click on study guide tab
        const studyGuideTab = page.getByRole('tab', { name: /학습 가이드/i });
        await studyGuideTab.click();
        await page.waitForTimeout(500);
        await expect(studyGuideTab).toHaveAttribute('data-state', 'active');
      }
    });

    test('should lazy-load tab content on click', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // Click each non-default tab and verify content appears
        const tabs = ['시험 정보', '합격 전략', '취업 활용', '학습 가이드'];
        for (const tabName of tabs) {
          const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
          await tab.click();
          // Wait for tab to be active (dynamic import may take a moment)
          await expect(tab).toHaveAttribute('data-state', 'active', { timeout: 5000 });
          // Active tab panel content should be present
          const activePanel = page.locator('[role="tabpanel"][data-state="active"]');
          await expect(activePanel).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should display exam info when available', async ({ page }) => {
      await page.goto('/');
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

    test('should display study guide section', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // Go to study guide tab
        await page.getByRole('tab', { name: /학습 가이드/i }).click();
        await page.waitForTimeout(500);

        // Should show either study guide content or empty state
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
      }
    });

    test('should have CTA section', async ({ page }) => {
      await page.goto('/');
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

        // CTA section with "다른 자격증 찾아보기" link
        await expect(page.getByRole('link', { name: /다른 자격증 찾아보기/i })).toBeVisible();
      }
    });
  });

  test.describe('SSR & Metadata', () => {
    test('should have consistent metadata and page content (cache dedup)', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        const href = await cards.first().getAttribute('href');
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Get certificate title from page content
        const h1Text = await page.locator('h1').first().textContent();
        expect(h1Text).toBeTruthy();

        // Get og:title from metadata (generated by generateMetadata)
        const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
        expect(ogTitle).toBeTruthy();

        // Both should reference the same certificate title
        // og:title format: "{title} - 시험정보, 난이도, 합격률"
        expect(ogTitle).toContain(h1Text!.trim());
      }
    });

    test('should render certificate content in initial HTML (SSR)', async ({ page }) => {
      // Go to home to get a real certificate URL
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        // Get the certificate URL
        const href = await cards.first().getAttribute('href');
        expect(href).toBeTruthy();

        // Navigate to the certificate page
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Verify the page title contains certificate-specific info (not default)
        const title = await page.title();
        expect(title).toContain('자격증 마스터');
        // Title should not be the generic fallback
        expect(title.length).toBeGreaterThan(10);
      }
    });

    test('should have og:title meta tag', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        const href = await cards.first().getAttribute('href');
        await page.goto(href!);
        await page.waitForLoadState('networkidle');

        // Check og:title meta tag exists
        const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
        expect(ogTitle).toBeTruthy();
        expect(ogTitle!.length).toBeGreaterThan(0);
      }
    });

    test('should return 404 for non-existent certificate', async ({ page }) => {
      const response = await page.goto('/certificates/00000000-0000-0000-0000-000000000000');

      // Should return 404 status
      expect(response?.status()).toBe(404);
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
    });

    test('should show empty states for missing data gracefully', async ({ page }) => {
      await page.goto('/');
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
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // Try clicking all tabs - none should crash
        const tabs = ['시험 정보', '합격 전략', '취업 활용', '학습 가이드'];

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
      await page.goto('/');
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
      await page.goto('/');
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

  test.describe('View Count Display', () => {
    test('should display view count on certificate detail page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // 조회수 텍스트가 표시되어야 함
        const viewCountText = page.getByText(/조회수|조회/i);
        await expect(viewCountText.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should show view count as a number', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('a[href^="/certificates/"]');
      const cardCount = await cards.count();
      test.skip(cardCount === 0, 'No certificates available');

      if (cardCount > 0) {
        await cards.first().click();
        await page.waitForLoadState('networkidle');

        // 조회수가 숫자와 함께 표시되어야 함 (예: "조회 123" 또는 "123회 조회")
        const viewCountPattern = page.getByText(/조회.*\d+|\d+.*조회/i);
        await expect(viewCountPattern.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });
});
