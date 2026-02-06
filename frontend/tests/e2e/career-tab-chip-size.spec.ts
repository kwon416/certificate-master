import { test, expect } from '@playwright/test';

test.describe('CareerTab - Chip Size', () => {
  /**
   * 활용 분야 및 관련 산업 칩(Badge)이 충분히 큰 크기로 표시되는지 확인합니다.
   * - text-sm (14px) 이상의 폰트 사이즈
   * - 적절한 패딩 (py >= 6px, px >= 12px)
   */

  let certificateId: string | null = null;

  test.beforeAll(async ({ request }) => {
    // API에서 career_info가 있는 자격증을 찾기
    const response = await request.get('http://localhost:8000/api/v1/certificates/search?page_size=5');
    if (response.ok()) {
      const data = await response.json();
      const items = data.items || [];
      // career_info.use_cases 또는 industry가 있는 자격증 찾기
      const certWithCareer = items.find(
        (item: any) =>
          item.career_info &&
          ((item.career_info.use_cases && item.career_info.use_cases.length > 0) ||
           (item.career_info.industry && item.career_info.industry.length > 0))
      );
      if (certWithCareer) {
        certificateId = certWithCareer.id;
      }
    }
  });

  test('활용 분야 칩이 적절한 크기로 표시되어야 한다', async ({ page }) => {
    test.skip(!certificateId, 'No certificate with career_info found');

    await page.goto(`/certificates/${certificateId}`);
    await page.waitForLoadState('networkidle');

    // 진로/활용 탭으로 이동
    const careerTab = page.getByRole('tab', { name: /취업\s*활용/i });
    await expect(careerTab).toBeVisible({ timeout: 10000 });
    await careerTab.click();
    await page.waitForTimeout(500);

    // 활용 분야 섹션 확인
    const section = page.getByText('활용 분야', { exact: true });
    const hasSectionVisible = await section.isVisible().catch(() => false);
    test.skip(!hasSectionVisible, '활용 분야 section not found');

    // 활용 분야 카드 내의 Badge만 선택 (section 내부로 한정)
    const sectionCard = section.locator('xpath=ancestor::div[contains(@class, "rounded")]').last();
    const badges = sectionCard.locator('[class*="border-emerald-500"]');
    const badgeCount = await badges.count();
    test.skip(badgeCount === 0, 'No badges found in 활용 분야 card');

    // 첫 번째 Badge의 폰트 크기 확인
    const firstBadge = badges.first();
    const fontSize = await firstBadge.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });

    // text-sm = 14px, text-xs = 12px
    // 칩이 최소 14px(text-sm) 이상이어야 한다
    expect(fontSize).toBeGreaterThanOrEqual(14);

    // 패딩 확인 (py >= 6px, px >= 12px)
    const paddingTop = await firstBadge.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).paddingTop);
    });
    const paddingLeft = await firstBadge.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).paddingLeft);
    });

    expect(paddingTop).toBeGreaterThanOrEqual(6);
    expect(paddingLeft).toBeGreaterThanOrEqual(12);
  });

  test('관련 산업 칩이 적절한 크기로 표시되어야 한다', async ({ page }) => {
    test.skip(!certificateId, 'No certificate with career_info found');

    await page.goto(`/certificates/${certificateId}`);
    await page.waitForLoadState('networkidle');

    // 진로/활용 탭으로 이동
    const careerTab = page.getByRole('tab', { name: /취업\s*활용/i });
    await expect(careerTab).toBeVisible({ timeout: 10000 });
    await careerTab.click();
    await page.waitForTimeout(500);

    // 관련 산업 섹션 확인
    const section = page.getByText('관련 산업', { exact: true });
    const hasSectionVisible = await section.isVisible().catch(() => false);
    test.skip(!hasSectionVisible, '관련 산업 section not found');

    // Badge 찾기 - violet color class가 있는 badge
    const allBadges = page.locator('div.inline-flex.items-center.rounded-md');
    const badgeCount = await allBadges.count();
    test.skip(badgeCount === 0, 'No badges found');

    // 마지막 badge 그룹이 관련 산업일 가능성 높음
    const lastBadge = allBadges.last();
    const fontSize = await lastBadge.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });

    // 칩이 최소 14px(text-sm) 이상이어야 한다
    expect(fontSize).toBeGreaterThanOrEqual(14);

    // 패딩 확인
    const paddingTop = await lastBadge.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).paddingTop);
    });
    const paddingLeft = await lastBadge.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).paddingLeft);
    });

    expect(paddingTop).toBeGreaterThanOrEqual(6);
    expect(paddingLeft).toBeGreaterThanOrEqual(12);
  });
});
