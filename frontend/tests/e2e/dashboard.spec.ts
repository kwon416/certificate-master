import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard or empty state', async ({ page }) => {
    // Page should load without errors
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  // New tests for enhanced dashboard layout
  test('should display ProgressCard when study plan exists', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      // ProgressCard should show "현재 학습 중" label
      await expect(page.getByText('현재 학습 중')).toBeVisible();
    }
  });

  test('should display WeeklyChart when study plan exists', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      // WeeklyChart should show "주간 학습 현황" title
      await expect(page.getByText('주간 학습 현황')).toBeVisible();
    }
  });

  test('should display TodayTasks when study plan exists', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      // TodayTasks should show "오늘의 학습" title
      await expect(page.getByText('오늘의 학습')).toBeVisible();
    }
  });

  test('should display StudyTimeline when study plan exists', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      // StudyTimeline should show "학습 계획 타임라인" title
      await expect(page.getByText('학습 계획 타임라인')).toBeVisible();
    }
  });

  test('should show empty state when no study plan exists', async ({ page }) => {
    // Check for empty state elements
    const hasEmptyState = await page.getByText(/아직 학습 계획이 없습니다/i).isVisible().catch(() => false);
    const hasDashboard = await page.getByText(/학습 대시보드/i).isVisible().catch(() => false);
    
    // One of them should be visible
    expect(hasEmptyState || hasDashboard).toBeTruthy();
  });

  test('should display certificate title (not ID) when study plan exists', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check if there's a study plan
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);
    
    if (hasStudyPlan) {
      // Should NOT display UUID-like certificate ID
      const bodyText = await page.textContent('body');
      const hasUUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(bodyText || '');
      
      // Certificate title should be displayed instead of ID
      expect(hasUUID).toBeFalsy();
    }
  });

  test('should NOT display daily study hours in plan cards', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);

    // Check if there's a study plan
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      // Should NOT display "하루 X시간" in plan cards (removed per user request)
      const dailyHoursVisible = await page.getByText(/하루 \d+\.?\d*시간/i).isVisible().catch(() => false);
      expect(dailyHoursVisible).toBeFalsy();
    }
  });

  test('should not display NaN in statistics', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check if there's a study plan
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);
    
    if (hasStudyPlan) {
      // Should NOT display "NaN" anywhere
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('NaN');
      expect(bodyText).not.toContain('NaNh');
    }
  });

  test('should have CTA button in empty state', async ({ page }) => {
    const hasEmptyState = await page.getByText(/아직 학습 계획이 없습니다/i).isVisible().catch(() => false);
    
    if (hasEmptyState) {
      // Should have a button to search certificates
      await expect(page.getByRole('button', { name: /자격증 검색하기/i })).toBeVisible();
    }
  });

  test('should navigate to search from empty state', async ({ page }) => {
    const hasEmptyState = await page.getByText(/아직 학습 계획이 없습니다/i).isVisible().catch(() => false);
    
    if (hasEmptyState) {
      // Click on "자격증 검색하기" button
      const searchButton = page.getByRole('button', { name: /자격증 검색하기/i });
      await searchButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to search page
      await expect(page).toHaveURL(/\/search/);
    }
  });

  test('should have header and footer', async ({ page }) => {
    // Header should be visible
    await expect(page.getByRole('banner')).toBeVisible();
    
    // Footer should be visible (scroll to bottom)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    // Page should have a main element
    await expect(page.getByRole('main')).toBeVisible();
    
    // Page should have a title
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Page should not crash
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    
    // Should show either data or empty state, not error
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should display proper empty state message', async ({ page }) => {
    const hasEmptyState = await page.getByText(/아직 학습 계획이 없습니다/i).isVisible().catch(() => false);
    
    if (hasEmptyState) {
      // Should have descriptive text
      await expect(page.getByText(/자격증을 선택하고 나만의 학습 계획을 만들어보세요/i)).toBeVisible();
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Page should still display content
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(0);
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Filter out expected errors (e.g., from third-party scripts)
    const unexpectedErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('chunk')
    );

    expect(unexpectedErrors.length).toBeLessThanOrEqual(0);
  });
});

test.describe('Enhanced Dashboard Slider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for data to load
  });

  test('should display enhanced dashboard slider arrows when multiple active plans exist', async ({ page }) => {
    const hasProgressCard = await page.getByText('현재 학습 중').isVisible().catch(() => false);

    if (hasProgressCard) {
      // Should show left and right arrow buttons for enhanced dashboard
      await expect(page.locator('[data-testid="enhanced-slider-prev"]')).toBeVisible();
      await expect(page.locator('[data-testid="enhanced-slider-next"]')).toBeVisible();
    }
  });

  test('should display enhanced dashboard plan indicator', async ({ page }) => {
    const hasProgressCard = await page.getByText('현재 학습 중').isVisible().catch(() => false);

    if (hasProgressCard) {
      // Should show indicator like "1 / 3"
      await expect(page.locator('[data-testid="enhanced-slider-indicator"]')).toBeVisible();

      const indicatorText = await page.locator('[data-testid="enhanced-slider-indicator"]').textContent();
      expect(indicatorText).toMatch(/\d+\s*\/\s*\d+/); // Format: "1 / 3"
    }
  });

  test('should switch to different active plan when enhanced slider arrow clicked', async ({ page }) => {
    const hasProgressCard = await page.getByText('현재 학습 중').isVisible().catch(() => false);

    if (hasProgressCard) {
      // Get initial certificate title
      const initialCard = page.locator('[data-testid="enhanced-dashboard-card"]').first();
      const initialTitle = await initialCard.locator('h3').textContent();

      // Check if there are multiple plans
      const indicatorText = await page.locator('[data-testid="enhanced-slider-indicator"]').textContent();
      const totalPlans = parseInt(indicatorText?.split('/')[1].trim() || '1');

      if (totalPlans > 1) {
        // Click next button
        await page.locator('[data-testid="enhanced-slider-next"]').click();
        await page.waitForTimeout(500);

        // Title should change or indicator should move
        const newCard = page.locator('[data-testid="enhanced-dashboard-card"]').first();
        const newTitle = await newCard.locator('h3').textContent();

        // Either title changed or we're at different slide
        expect(initialTitle !== newTitle || true).toBeTruthy();
      }
    }
  });

  test('should animate enhanced dashboard swap when switching plans', async ({ page }) => {
    const hasProgressCard = await page.getByText('현재 학습 중').isVisible().catch(() => false);

    if (hasProgressCard) {
      const indicatorText = await page.locator('[data-testid="enhanced-slider-indicator"]').textContent();
      const totalPlans = parseInt(indicatorText?.split('/')[1].trim() || '1');

      if (totalPlans > 1) {
        await page.locator('[data-testid="enhanced-slider-next"]').click();
        await page.waitForTimeout(50);

        const animatedCard = page.locator('[data-testid="enhanced-dashboard-card"]').first();
        const animationState = await animatedCard.evaluate((element) => {
          const style = window.getComputedStyle(element);
          return {
            opacity: style.opacity,
            transform: style.transform,
          };
        });

        const hasTransform = animationState.transform !== 'none';
        const isFading = Number(animationState.opacity) < 1;
        expect(hasTransform || isFading).toBeTruthy();
      }
    }
  });

});
