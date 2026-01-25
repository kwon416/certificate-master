/**
 * E2E tests for Recommendation Wizard (intent-first flow)
 */
import { test, expect, type Page } from '@playwright/test'

async function completeWizard(page: Page, summary?: string) {
  const finalSummary =
    summary ??
    '데이터 분석 직무로 이직하려고 6개월 안에 준비할 수 있는 자격증을 찾고 있어요.'

  await page.getByRole('tab', { name: /추천받기/i }).click()
  await expect(page.getByText(/왜 자격증이 필요한가요/i)).toBeVisible()

  await page.getByRole('button', { name: '취업' }).click()
  await expect(page.getByText(/어떤 분야에 관심이 있나요/i)).toBeVisible()

  await page.getByRole('button', { name: /IT개발/i }).click()
  await expect(page.getByText(/예상 공부 기간은/i)).toBeVisible({ timeout: 3000 })

  await page.getByRole('button', { name: '6개월 이하' }).click()
  await expect(page.getByText(/난이도 선호는 어떤가요/i)).toBeVisible({ timeout: 3000 })

  await page.getByRole('button', { name: '중간' }).click()
  await expect(page.getByText(/한 문장으로/i)).toBeVisible({ timeout: 3000 })
  await page.getByPlaceholder(/데이터 분석 직무로 이직/i).fill(finalSummary)
  await page.getByRole('button', { name: /추천받기/i }).click()
}

test.describe('Recommendation Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Search Tabs', () => {
    test('should display recommendation and search tabs', async ({ page }) => {
      await expect(page.getByRole('tab', { name: /추천받기/i })).toBeVisible()
      await expect(page.getByRole('tab', { name: /직접 검색/i })).toBeVisible()
    })

    test('should switch between tabs', async ({ page }) => {
      await page.getByRole('tab', { name: /추천받기/i }).click()
      await expect(page.getByText(/왜 자격증이 필요한가요/i)).toBeVisible()

      await page.getByRole('tab', { name: /직접 검색/i }).click()
      await expect(page.getByPlaceholder(/자격증명, 분야/i)).toBeVisible()
    })

    test('should default to recommendation tab', async ({ page }) => {
      const recommendTab = page.getByRole('tab', { name: /추천받기/i })
      await expect(recommendTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  test.describe('Wizard Steps', () => {
    test('step 1: purpose options appear and advance', async ({ page }) => {
      await page.getByRole('tab', { name: /추천받기/i }).click()
      await expect(page.getByText(/왜 자격증이 필요한가요/i)).toBeVisible()

      const purposes = ['취업', '이직', '커리어 전문성 강화', '개인 관심 / 교양', '창업 / 실무 활용']
      for (const purpose of purposes) {
        await expect(page.getByRole('button', { name: purpose })).toBeVisible()
      }

      await page.getByRole('button', { name: '이직' }).click()
      await expect(page.getByText(/어떤 분야에 관심이 있나요/i)).toBeVisible({ timeout: 3000 })
    })

    test('step 2: selecting one domain advances to the next step', async ({ page }) => {
      await page.getByRole('tab', { name: /추천받기/i }).click()
      await page.getByRole('button', { name: '취업' }).click()

      const nextButton = page.getByRole('button', { name: /다음/i })
      await expect(nextButton).toBeDisabled()

      await page.getByRole('button', { name: /IT개발/i }).click()
      await expect(page.getByText(/예상 공부 기간은/i)).toBeVisible({ timeout: 3000 })
    })

    test('step 3: study timeline options appear', async ({ page }) => {
      await page.getByRole('tab', { name: /추천받기/i }).click()
      await page.getByRole('button', { name: '취업' }).click()
      await page.getByRole('button', { name: /IT개발/i }).click()
      await expect(page.getByText(/예상 공부 기간은/i)).toBeVisible({ timeout: 3000 })

      const timelines = ['3개월 이하', '6개월 이하', '1년 이하', '1년 이상', '상관없음']
      for (const timeline of timelines) {
        await expect(page.getByRole('button', { name: timeline })).toBeVisible()
      }
    })

    test('step 4: difficulty preference options appear', async ({ page }) => {
      await page.getByRole('tab', { name: /추천받기/i }).click()
      await page.getByRole('button', { name: '취업' }).click()
      await page.getByRole('button', { name: /IT개발/i }).click()
      await expect(page.getByText(/예상 공부 기간은/i)).toBeVisible({ timeout: 3000 })
      await page.getByRole('button', { name: '3개월 이하' }).click()
      await expect(page.getByText(/난이도 선호는 어떤가요/i)).toBeVisible({ timeout: 3000 })

      const difficulties = ['쉬운 편', '중간', '어려워도 상관없음']
      for (const difficulty of difficulties) {
        await expect(page.getByRole('button', { name: difficulty })).toBeVisible()
      }
    })

    test('step 5: summary input optional but editable', async ({ page }) => {
      await page.getByRole('tab', { name: /추천받기/i }).click()
      await page.getByRole('button', { name: '취업' }).click()
      await page.getByRole('button', { name: /IT개발/i }).click()
      await expect(page.getByText(/예상 공부 기간은/i)).toBeVisible({ timeout: 3000 })
      await page.getByRole('button', { name: '6개월 이하' }).click()
      await expect(page.getByText(/난이도 선호는 어떤가요/i)).toBeVisible({ timeout: 3000 })
      await page.getByRole('button', { name: '쉬운 편' }).click()
      await expect(page.getByText(/한 문장으로/i)).toBeVisible({ timeout: 3000 })

      const submitButton = page.getByRole('button', { name: /추천받기/i })
      await expect(submitButton).toBeEnabled()

      await page.getByPlaceholder(/데이터 분석 직무로 이직/i).fill('AI 기반 검색으로 추천되는지 확인 중입니다.')
      await expect(submitButton).toBeEnabled()
    })
  })

  test.describe('Recommendation Results', () => {
    test('should show loading UI during recommendation search', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByText(/추천 검색 중/i)).toBeVisible({ timeout: 2000 })
    })

    test('should show results or empty state', async ({ page }) => {
      await completeWizard(page)

      await expect(page.getByRole('button', { name: /다시 추천/i })).toBeVisible({ timeout: 15000 })

      const hasResultsHeading = await page.getByText(/추천 결과/i).isVisible().catch(() => false)
      const hasNoResultsMessage = await page.getByText(/추천 결과가 없습니다/i).isVisible().catch(() => false)
      const hasResetButton = await page.getByRole('button', { name: /다시 추천/i }).isVisible().catch(() => false)

      expect(hasResultsHeading || hasNoResultsMessage || hasResetButton).toBeTruthy()
    })

    test('should allow starting over', async ({ page }) => {
      await completeWizard(page)

      const resetButton = page.getByRole('button', { name: /다시 추천/i })
      await expect(resetButton).toBeVisible({ timeout: 15000 })

      await resetButton.click()
      await expect(page.getByText(/왜 자격증이 필요한가요/i)).toBeVisible()
    })

    test('should navigate to certificate detail if results exist', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i })).toBeVisible({ timeout: 15000 })

      const cards = page.locator('a[href^="/certificates/"]')
      const cardCount = await cards.count()

      test.skip(cardCount === 0, 'No recommendations to test navigation')

      if (cardCount > 0) {
        await cards.first().click()
        await page.waitForLoadState('networkidle')
        await expect(page.url()).toContain('/certificates/')
      }
    })
  })
})
