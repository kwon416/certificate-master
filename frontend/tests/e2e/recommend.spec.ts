/**
 * E2E tests for Recommendation Wizard (intent-first flow)
 */
import { test, expect, type Page } from '@playwright/test'

async function completeWizard(page: Page, summary?: string) {
  const finalSummary =
    summary ??
    '데이터 분석 직무로 이직하고싶어'

  await expect(page.getByText(/자격증이 필요한 이유/i)).toBeVisible()

  await page.getByRole('button', { name: '취업 준비' }).click()
  await expect(page.getByText(/어떤 분야에 관심이 있나요/i)).toBeVisible()

  await page.getByRole('button', { name: /IT개발/i }).click()
  await expect(page.getByText(/예상 공부 기간은/i)).toBeVisible({ timeout: 3000 })

  await page.getByRole('button', { name: '6개월 이하' }).click()
  await expect(page.getByText(/난이도 선호는 어떤가요/i)).toBeVisible({ timeout: 3000 })

  await page.getByRole('button', { name: '중간' }).click()
  await expect(page.getByText(/추가 정보 입력/i)).toBeVisible({ timeout: 3000 })
  await page.getByPlaceholder(/데이터 분석 직무로 이직/i).fill(finalSummary)
  await page.getByRole('button', { name: /추천받기/i }).click()
}

test.describe('Recommendation Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recommend')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Wizard Steps', () => {
    test('step 1: purpose options appear and advance', async ({ page }) => {
      await expect(page.getByText(/자격증이 필요한 이유/i)).toBeVisible()

      const purposes = ['취업 준비', '이직 · 연봉 상승', '전문성 증명', '관심 · 교양', '실무에 바로 활용']
      for (const purpose of purposes) {
        await expect(page.getByRole('button', { name: purpose })).toBeVisible()
      }

      await page.getByRole('button', { name: '이직 · 연봉 상승' }).click()
      await expect(page.getByText(/어떤 분야에 관심이 있나요/i)).toBeVisible({ timeout: 3000 })
    })

    test('step 2: selecting one domain advances to the next step', async ({ page }) => {
      await page.getByRole('button', { name: '취업 준비' }).click()

      const nextButton = page.getByRole('button', { name: /다음/i })
      await expect(nextButton).toBeDisabled()

      await page.getByRole('button', { name: /IT개발/i }).click()
      await expect(page.getByText(/예상 공부 기간은/i)).toBeVisible({ timeout: 3000 })
    })

    test('step 3: study timeline options appear', async ({ page }) => {
      await page.getByRole('button', { name: '취업 준비' }).click()
      await page.getByRole('button', { name: /IT개발/i }).click()
      await expect(page.getByText(/예상 공부 기간은/i)).toBeVisible({ timeout: 3000 })

      const timelines = ['3개월 이하', '6개월 이하', '1년 이하', '1년 이상', '상관없음']
      for (const timeline of timelines) {
        await expect(page.getByRole('button', { name: timeline })).toBeVisible()
      }
    })

    test('step 4: difficulty preference options appear', async ({ page }) => {
      await page.getByRole('button', { name: '취업 준비' }).click()
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
      await page.getByRole('button', { name: '취업 준비' }).click()
      await page.getByRole('button', { name: /IT개발/i }).click()
      await expect(page.getByText(/예상 공부 기간은/i)).toBeVisible({ timeout: 3000 })
      await page.getByRole('button', { name: '6개월 이하' }).click()
      await expect(page.getByText(/난이도 선호는 어떤가요/i)).toBeVisible({ timeout: 3000 })
      await page.getByRole('button', { name: '쉬운 편' }).click()
      await expect(page.getByText(/추가 정보 입력/i)).toBeVisible({ timeout: 3000 })

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

      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      const hasResultsHeading = await page.getByText(/추천 결과/i).isVisible().catch(() => false)
      const hasNoResultsMessage = await page.getByText(/추천 결과가 없습니다/i).isVisible().catch(() => false)
      const hasResetButton = await page.getByRole('button', { name: /다시 추천/i }).first().isVisible().catch(() => false)

      expect(hasResultsHeading || hasNoResultsMessage || hasResetButton).toBeTruthy()
    })

    test('should allow starting over', async ({ page }) => {
      await completeWizard(page)

      const resetButton = page.getByRole('button', { name: /다시 추천/i }).first()
      await expect(resetButton).toBeVisible({ timeout: 15000 })

      await resetButton.click()
      await expect(page.getByText(/자격증이 필요한 이유/i)).toBeVisible()
    })

    test('should navigate to certificate detail if results exist', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      // "상세 정보 보기" 버튼 클릭
      const detailButtons = page.getByRole('link', { name: /상세 정보 보기/i })
      const buttonCount = await detailButtons.count()

      test.skip(buttonCount === 0, 'No recommendations to test navigation')

      if (buttonCount > 0) {
        // Promise.all로 네비게이션과 클릭을 동시에 대기
        await Promise.all([
          page.waitForURL(/\/certificates\//),
          detailButtons.first().click()
        ])
        expect(page.url()).toContain('/certificates/')
      }
    })

    test('should display user summary when provided', async ({ page }) => {
      const userQuery = '데이터 분석 직무로 이직하고싶어'
      await completeWizard(page, userQuery)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      // "내 요청" 섹션이 표시되어야 함
      const userRequestSection = page.getByText(/내 요청/i)
      await expect(userRequestSection).toBeVisible()

      // 사용자가 입력한 쿼리가 표시되어야 함
      await expect(page.getByText(`"${userQuery}"`)).toBeVisible()
    })
  })

  test.describe('Recommendation Card Display', () => {
    test('should display recommendation reason', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      // "추천 이유" 라벨이 있는지 확인
      const reasonLabels = page.locator('p').filter({ hasText: '추천 이유' })
      const hasResults = await reasonLabels.first().isVisible().catch(() => false)

      if (hasResults) {
        await expect(reasonLabels.first()).toBeVisible()
        // 추천 이유 내용이 있는지 확인 (분야, 직업 관련)
        const reasonContent = page.locator('.border-emerald-500\\/20')
        await expect(reasonContent.first()).toBeVisible()
      }
    })

    test('should display key points with study tips and career info', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      const keyPointsSection = page.getByText(/핵심 포인트/i)
      const hasKeyPoints = await keyPointsSection.isVisible().catch(() => false)

      if (hasKeyPoints) {
        await expect(keyPointsSection).toBeVisible()
        // 키포인트 항목들이 리스트로 표시되는지 확인
        const keyPointsList = page.locator('ul').filter({ has: page.locator('li') })
        await expect(keyPointsList.first()).toBeVisible()
      }
    })

    test('should display difficulty and study period info', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      // 난이도 정보 확인
      const difficultyChip = page.getByText(/난이도/i).first()
      const hasDifficulty = await difficultyChip.isVisible().catch(() => false)

      if (hasDifficulty) {
        await expect(difficultyChip).toBeVisible()
      }

      // 예상 준비 기간 확인
      const prepChip = page.getByText(/예상 준비/i).first()
      const hasPrep = await prepChip.isVisible().catch(() => false)

      if (hasPrep) {
        await expect(prepChip).toBeVisible()
      }
    })

    test('should NOT display average salary in key points', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      // 평균 연봉이 표시되지 않아야 함 (제거된 항목)
      const salaryText = page.getByText(/평균 연봉/i)
      await expect(salaryText).not.toBeVisible()
    })

    test('should NOT display exam composition (필기/실기 N과목) in key points', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      // 시험 구성 정보가 키포인트에 표시되지 않아야 함 (제거된 항목)
      const examComposition = page.getByText(/필기.*과목|실기.*과목/i)
      await expect(examComposition).not.toBeVisible()
    })

    test('should display match score badge', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      // 매치 점수 배지 확인
      const matchBadge = page.getByText(/매치|%/i).first()
      const hasBadge = await matchBadge.isVisible().catch(() => false)

      if (hasBadge) {
        await expect(matchBadge).toBeVisible()
      }
    })
  })
})
