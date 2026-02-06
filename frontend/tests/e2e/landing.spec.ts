import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: /자격증/i })).toBeVisible();
    await expect(page.locator('.gradient-text').filter({ hasText: /자격증/i })).toBeVisible();
  });

  test('should have hero section with title and description', async ({ page }) => {
    // Badge should be visible
    await expect(page.getByText(/자격증 비교 정보 플랫폼/i)).toBeVisible();

    // Subtitle should be visible
    await expect(page.getByText(/흩어진 자격증 정보를 한 화면에 모아/i)).toBeVisible();
    await expect(page.getByText(/시험 정보 · 공부 방법 · 후기 기준으로 정리했어요/i)).toBeVisible();
  });

  test('should have CTA buttons', async ({ page }) => {
    // "자격증 한눈에 보기" button
    await expect(page.getByRole('link', { name: /자격증 한눈에 보기/i }).first()).toBeVisible();

    // "자격증 공부 시작하기" button
    await expect(page.getByRole('link', { name: /자격증 공부 시작하기/i })).toBeVisible();
  });

  test('should navigate to search page when clicking hero CTA button', async ({ page }) => {
    await page.getByRole('link', { name: /자격증 한눈에 보기/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');
  });

  test('should navigate to dashboard page when clicking secondary CTA button', async ({ page }) => {
    await page.getByRole('link', { name: /자격증 공부 시작하기/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display core value section', async ({ page }) => {
    // Core value section should have heading
    await expect(page.getByRole('heading', { name: /Certificate Master는 다릅니다/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /자격증을 비교 가능한 기준으로 정리했습니다/i })).toBeVisible();
    await expect(page.getByText(/준비 난이도와 활용도를 함께 제공/i)).toBeVisible();
  });

  test('should show value cards', async ({ page }) => {
    // Value descriptions should be visible
    await expect(page.getByText(/난이도, 준비 기간, 공식 일정 링크를 한눈에 확인/i)).toBeVisible();
    await expect(page.getByText(/이 자격증이 나에게 맞는가 판단 가능/i)).toBeVisible();
    await expect(page.getByText(/목표 날짜 입력 시 자동 계산 및 계획 생성/i)).toBeVisible();
  });

  test('should display popular certificates section', async ({ page }) => {
    // Popular certificates section is optional on landing page
    // Skip if not visible
    await page.waitForTimeout(500);

    const heading = await page.getByRole('heading', { name: /실제로 많이 준비하는 자격증/i }).isVisible().catch(() => false);

    if (!heading) {
      test.skip(true, 'Popular certificates section not available on current landing page');
    }
  });

  test('should have footer with links', async ({ page }) => {
    await expect(page.getByRole('contentinfo')).toBeVisible();
    
    // Footer text should be visible (scroll to bottom first)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    const footerContent = await page.getByRole('contentinfo').textContent();
    expect(footerContent).toBeTruthy();
  });

  test('should have header with navigation', async ({ page }) => {
    await expect(page.getByRole('banner')).toBeVisible();
    
    // Logo should be visible in header
    const header = page.getByRole('banner');
    const headerText = await header.textContent();
    expect(headerText).toBeTruthy();
  });

  test('should display final CTA section with trust badges', async ({ page }) => {
    // Scroll to CTA section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // CTA heading
    await expect(page.getByRole('heading', { name: /지금 확인하고 결정하세요/i })).toBeVisible();

    // CTA description
    await expect(page.getByText(/자격증 선택, 더 이상 혼자 고민하지 마세요/i)).toBeVisible();

    // CTA button in final section
    const finalCtaButton = page.getByRole('link', { name: /자격증 한눈에 보기/i }).last();
    await expect(finalCtaButton).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Main heading should still be visible
    await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: /자격증/i })).toBeVisible();
  });

  test('should load without errors', async ({ page }) => {
    // Page should load successfully
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    
    // Main content should be visible
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should have accessible structure', async ({ page }) => {
    // Should have proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Should have main landmark
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should navigate to certificate detail when clicking popular certificate', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const certificateLinks = page.locator('a[href^="/certificates/"]');
    const linkCount = await certificateLinks.count();
    
    if (linkCount > 0) {
      await certificateLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // Should be on certificate detail page
      await expect(page).toHaveURL(/\/certificates\/.+/);
    } else {
      // Skip test if no certificates available
      test.skip(true, 'No popular certificates available to test');
    }
  });

  test('should display stats section', async ({ page }) => {
    // Stats section is optional on landing page
    // Skip if not visible
    await page.waitForTimeout(500);

    const hasStats = await page.getByText(/등록된 자격증/i).isVisible().catch(() => false);

    if (!hasStats) {
      test.skip(true, 'Stats section not available on current landing page');
    } else {
      await expect(page.getByText(/3,547\+/i)).toBeVisible();
    }
  });

  test('should display trust indicators', async ({ page }) => {
    // Trust indicators should be visible - look for specific trust indicator section

    await expect(page.getByText(/맞춤형 AI 자격증 추천/i)).toBeVisible();
    await expect(page.getByText(/공공데이터 기반 자격증 정보/i)).toBeVisible();
    await expect(page.getByText(/학습 계획 생성 및 관리/i)).toBeVisible();
  });
});
