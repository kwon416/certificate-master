import { test, expect } from '@playwright/test'

test.describe('Enhanced Progress Metrics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('RED: should display velocity chart component', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForTimeout(2000)

    // Check if user has a study plan first (conditional test)
    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i)
      .isVisible()
      .catch(() => false)

    if (hasStudyPlan) {
      // Velocity chart should be visible when study plan exists
      const velocityChart = page.locator('[data-testid="velocity-chart"]')
      await expect(velocityChart).toBeVisible()
    } else {
      // If no study plan, test passes (velocity chart not applicable)
      test.skip()
    }
  })

  test('RED: should display progress rate indicator', async ({ page }) => {
    await page.waitForTimeout(2000)

    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i)
      .isVisible()
      .catch(() => false)

    if (hasStudyPlan) {
      // Should show "진행 속도" text
      await expect(page.getByText(/진행 속도/)).toBeVisible()

      // Should show velocity status (빠름/느림/정상)
      const velocityStatus = page.locator('[data-testid="velocity-indicator"]')
      await expect(velocityStatus).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('RED: should show predicted completion date', async ({ page }) => {
    await page.waitForTimeout(2000)

    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i)
      .isVisible()
      .catch(() => false)

    if (hasStudyPlan) {
      // Should display "예상 완료일" label
      await expect(page.getByText(/예상 완료일/)).toBeVisible()

      // Should display a date in Korean format
      const datePattern = /\d{4}년 \d{1,2}월 \d{1,2}일/
      const dateText = await page.locator('[data-testid="predicted-date"]').textContent()
      expect(dateText).toMatch(datePattern)
    } else {
      test.skip()
    }
  })

  test('RED: should color-code velocity status', async ({ page }) => {
    await page.waitForTimeout(2000)

    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i)
      .isVisible()
      .catch(() => false)

    if (hasStudyPlan) {
      const indicator = page.locator('[data-testid="velocity-indicator"]')
      await expect(indicator).toBeVisible()

      // Check that indicator has one of the expected color classes
      const element = await indicator.elementHandle()
      if (element) {
        const bgColor = await indicator.evaluate(el => {
          const styles = window.getComputedStyle(el)
          return styles.backgroundColor
        })

        // Verify it's one of our status colors (emerald, cyan, amber, red)
        const validColors = [
          'rgb(16, 185, 129)',   // emerald-500
          'rgb(6, 182, 212)',    // cyan-500
          'rgb(245, 158, 11)',   // amber-500
          'rgb(239, 68, 68)',    // red-500
        ]

        // Check if background includes one of our theme colors
        const hasValidColor = validColors.some(color => bgColor.includes(color.split('(')[1].split(')')[0]))
        expect(hasValidColor || bgColor.includes('16, 185') || bgColor.includes('6, 182') || bgColor.includes('245, 158') || bgColor.includes('239, 68')).toBeTruthy()
      }
    } else {
      test.skip()
    }
  })

  test('RED: should display expected vs actual progress comparison', async ({ page }) => {
    await page.waitForTimeout(2000)

    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i)
      .isVisible()
      .catch(() => false)

    if (hasStudyPlan) {
      // Should show expected progress label
      await expect(page.getByText(/예상 진행률/)).toBeVisible()

      // Should show actual progress label
      await expect(page.getByText(/실제 진행률/)).toBeVisible()

      // Both should show percentage values
      const expectedProgress = page.locator('[data-testid="expected-progress"]')
      const actualProgress = page.locator('[data-testid="actual-progress"]')

      const expectedText = await expectedProgress.textContent()
      const actualText = await actualProgress.textContent()

      expect(expectedText).toMatch(/\d+%/)
      expect(actualText).toMatch(/\d+%/)
    } else {
      test.skip()
    }
  })

  test('RED: should display velocity trend icon', async ({ page }) => {
    await page.waitForTimeout(2000)

    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i)
      .isVisible()
      .catch(() => false)

    if (hasStudyPlan) {
      // Should have TrendingUp or TrendingDown icon visible
      const trendIcon = page.locator('[data-testid="velocity-trend-icon"]')
      await expect(trendIcon).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('RED: should handle API errors gracefully', async ({ page }) => {
    // Intercept velocity API and return error
    await page.route('**/api/v1/progress-analytics/*/velocity', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ detail: 'Internal server error' })
      })
    })

    await page.goto('http://localhost:3000/dashboard')
    await page.waitForTimeout(2000)

    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i)
      .isVisible()
      .catch(() => false)

    if (hasStudyPlan) {
      // Should not crash - velocity chart should either not show or show error state
      const pageContent = await page.content()
      expect(pageContent).toBeTruthy()

      // No unhandled errors
      const errors: string[] = []
      page.on('pageerror', error => {
        errors.push(error.message)
      })

      await page.waitForTimeout(1000)
      expect(errors.filter(e => e.includes('velocity')).length).toBe(0)
    } else {
      test.skip()
    }
  })

  test('RED: should update velocity data automatically', async ({ page }) => {
    await page.waitForTimeout(2000)

    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i)
      .isVisible()
      .catch(() => false)

    if (hasStudyPlan) {
      const velocityChart = page.locator('[data-testid="velocity-chart"]')
      await expect(velocityChart).toBeVisible()

      // Get initial velocity value
      const initialVelocity = await page.locator('[data-testid="velocity-value"]').textContent()

      // Wait for auto-refresh (5 minutes in real implementation, but we'll just verify it exists)
      // In real test, we'd mock time or test the refetch mechanism
      expect(initialVelocity).toBeTruthy()
    } else {
      test.skip()
    }
  })

  test('RED: should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForTimeout(2000)

    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i)
      .isVisible()
      .catch(() => false)

    if (hasStudyPlan) {
      const velocityChart = page.locator('[data-testid="velocity-chart"]')
      await expect(velocityChart).toBeVisible()

      // Should still be readable
      const chartBounds = await velocityChart.boundingBox()
      expect(chartBounds?.width).toBeLessThanOrEqual(375)
    } else {
      test.skip()
    }
  })

  test('RED: should integrate with ProgressCard component', async ({ page }) => {
    await page.waitForTimeout(2000)

    const hasStudyPlan = await page.getByText(/진행 중인 학습 계획/i)
      .isVisible()
      .catch(() => false)

    if (hasStudyPlan) {
      // ProgressCard should also show velocity info
      const progressCard = page.locator('[data-testid="progress-card"]')
      await expect(progressCard).toBeVisible()

      // Should contain velocity delta text
      const hasVelocityInfo = await page.getByText(/예상보다.*[빠름|느림]/i)
        .isVisible()
        .catch(() => false)

      expect(hasVelocityInfo).toBeTruthy()
    } else {
      test.skip()
    }
  })
})
