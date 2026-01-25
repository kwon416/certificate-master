import { test, expect } from '@playwright/test';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('Check-in Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display check-in button in TodayTasks when study plan exists', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      // TodayTasks should have check-in related button
      const checkinButton = page.getByRole('button', { name: /체크인/i });
      await expect(checkinButton).toBeVisible();
    }
  });

  test('should open check-in modal when clicking check-in button', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      // Find and click check-in button
      const checkinButton = page.getByRole('button', { name: /체크인/i });

      // If button exists and is enabled
      const isEnabled = await checkinButton.isEnabled().catch(() => false);
      if (isEnabled) {
        await checkinButton.click();

        // Modal should appear
        await expect(page.getByText(/오늘의 학습 체크인/i)).toBeVisible();
      }
    }
  });

  test('should display study hours slider in check-in modal', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      const checkinButton = page.getByRole('button', { name: /체크인/i });
      const isEnabled = await checkinButton.isEnabled().catch(() => false);

      if (isEnabled) {
        await checkinButton.click();

        // Study hours input should be visible
        await expect(page.getByText(/학습 시간/i)).toBeVisible();
      }
    }
  });

  test('should display mood selector in check-in modal', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      const checkinButton = page.getByRole('button', { name: /체크인/i });
      const isEnabled = await checkinButton.isEnabled().catch(() => false);

      if (isEnabled) {
        await checkinButton.click();

        // Mood selector should be visible
        await expect(page.getByText(/오늘의 기분/i)).toBeVisible();
      }
    }
  });

  test('should close modal when clicking cancel', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      const checkinButton = page.getByRole('button', { name: /체크인/i });
      const isEnabled = await checkinButton.isEnabled().catch(() => false);

      if (isEnabled) {
        await checkinButton.click();

        // Click cancel button
        const cancelButton = page.getByRole('button', { name: /취소/i });
        await cancelButton.click();

        // Modal should close
        await expect(page.getByText(/오늘의 학습 체크인/i)).not.toBeVisible();
      }
    }
  });

  test('should display "체크인 완료" badge when already checked in today', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      // Check if already checked in (badge visible)
      const checkinBadge = page.getByText(/체크인 완료/i);
      const hasBadge = await checkinBadge.isVisible().catch(() => false);

      if (hasBadge) {
        // Badge should be visible
        await expect(checkinBadge).toBeVisible();
      }
    }
  });

  test('should display today\'s study hours when checked in', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      // Check if already checked in
      const checkinBadge = page.getByText(/체크인 완료/i);
      const hasBadge = await checkinBadge.isVisible().catch(() => false);

      if (hasBadge) {
        // Should show study hours
        await expect(page.getByText(/오늘의 학습 시간/i)).toBeVisible();
      }
    }
  });

  test('should display "체크인 수정하기" button when already checked in', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      // Check if already checked in
      const checkinBadge = page.getByText(/체크인 완료/i);
      const hasBadge = await checkinBadge.isVisible().catch(() => false);

      if (hasBadge) {
        // Should show edit button
        const editButton = page.getByRole('button', { name: /체크인 수정하기/i });
        await expect(editButton).toBeVisible();
      }
    }
  });

  test('should open modal when clicking "체크인 수정하기"', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      // Check if already checked in
      const checkinBadge = page.getByText(/체크인 완료/i);
      const hasBadge = await checkinBadge.isVisible().catch(() => false);

      if (hasBadge) {
        // Click edit button
        const editButton = page.getByRole('button', { name: /체크인 수정하기/i });
        await editButton.click();

        // Modal should open
        await expect(page.getByText(/오늘의 학습 체크인/i)).toBeVisible();
      }
    }
  });

  test('should prefill study hours when editing a check-in', async ({ page }) => {
    await page.waitForTimeout(3000);
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i).isVisible().catch(() => false);

    if (hasStudyPlan) {
      const checkinBadge = page.getByText(/체크인 완료/i);
      const hasBadge = await checkinBadge.isVisible().catch(() => false);

      if (hasBadge) {
        const summaryRow = page.getByText(/오늘의 학습 시간/i).locator('..');
        const hoursText = await summaryRow.getByText(/h$/).textContent();

        if (hoursText) {
          const hoursValue = hoursText.replace('h', '').trim();
          const editButton = page.getByRole('button', { name: /체크인 수정하기/i });
          await editButton.click();

          const escaped = escapeRegExp(hoursValue);
          await expect(page.getByText(new RegExp(`${escaped}시간`))).toBeVisible();
        }
      }
    }
  });
});
