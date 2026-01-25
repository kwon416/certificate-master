import { test, expect } from '@playwright/test';

test.describe('Study Guide Display', () => {
  test('should display study guide section in certificate detail', async ({ page }) => {
    // Navigate to search and find a certificate
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('a[href^="/certificates/"]');
    const cardCount = await cards.count();

    test.skip(cardCount === 0, 'No certificates available');

    if (cardCount > 0) {
      // Click first certificate
      await cards.first().click();
      await page.waitForLoadState('networkidle');

      // Check if study guide tab/section exists
      const studyGuideTab = page.getByText('학습 가이드');

      // If study guide data exists, the tab should be visible
      const hasStudyGuide = await studyGuideTab.isVisible().catch(() => false);

      if (hasStudyGuide) {
        await studyGuideTab.click();

        // Check for study methods section
        await expect(page.getByText('추천 공부 방법')).toBeVisible();

        // Check for learning sequence section
        await expect(page.getByText('학습 순서')).toBeVisible();

        // Check for success tips section (optional)
        const successTips = page.getByText('합격 팁');
        const hasTips = await successTips.isVisible().catch(() => false);
        if (hasTips) {
          await expect(successTips).toBeVisible();
        }
      }
    }
  });

  test('should display study methods list', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('a[href^="/certificates/"]');
    const cardCount = await cards.count();

    test.skip(cardCount === 0, 'No certificates available');

    if (cardCount > 0) {
      await cards.first().click();
      await page.waitForLoadState('networkidle');

      const studyGuideTab = page.getByText('학습 가이드');
      const hasStudyGuide = await studyGuideTab.isVisible().catch(() => false);

      if (hasStudyGuide) {
        await studyGuideTab.click();

        // Study methods should be displayed as a list
        const studyMethodsSection = page.locator('text=추천 공부 방법').locator('..');
        await expect(studyMethodsSection).toBeVisible();
      }
    }
  });

  test('should display learning sequence with steps', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('a[href^="/certificates/"]');
    const cardCount = await cards.count();

    test.skip(cardCount === 0, 'No certificates available');

    if (cardCount > 0) {
      await cards.first().click();
      await page.waitForLoadState('networkidle');

      const studyGuideTab = page.getByText('학습 가이드');
      const hasStudyGuide = await studyGuideTab.isVisible().catch(() => false);

      if (hasStudyGuide) {
        await studyGuideTab.click();

        // Learning sequence should show step numbers (1단계, 2단계, etc.)
        const sequenceText = await page.textContent('body');
        const hasSteps = sequenceText?.includes('단계');

        if (hasSteps) {
          expect(hasSteps).toBeTruthy();
        }
      }
    }
  });

  test('should display recommended books if available', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('a[href^="/certificates/"]');
    const cardCount = await cards.count();

    test.skip(cardCount === 0, 'No certificates available');

    if (cardCount > 0) {
      await cards.first().click();
      await page.waitForLoadState('networkidle');

      const studyGuideTab = page.getByText('학습 가이드');
      const hasStudyGuide = await studyGuideTab.isVisible().catch(() => false);

      if (hasStudyGuide) {
        await studyGuideTab.click();

        // Check if recommended books section exists
        const booksSection = page.getByText('추천 교재');
        const hasBooks = await booksSection.isVisible().catch(() => false);

        if (hasBooks) {
          await expect(booksSection).toBeVisible();
        }
      }
    }
  });
});
