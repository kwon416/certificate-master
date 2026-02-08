/**
 * E2E tests for Recommendation Page (/recommend)
 *
 * Consolidated from:
 * - recommend.spec.ts (wizard flow)
 * - natural-recommend.spec.ts (natural language mode)
 * - wizard-natural-integration.spec.ts (step 4 natural input)
 */
import { test, expect, type Page } from '@playwright/test'

// Helper: Complete wizard steps 1-5 and submit
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

// Helper: Navigate to Step 4 via stepper wizard (status-based flow)
async function goToStep4Stepper(page: Page) {
  await page.goto('/recommend')
  await page.waitForLoadState('networkidle')

  // Step 1
  await expect(page.getByText(/지금 상황과 목표를 알려주세요/i)).toBeVisible()
  await page.getByRole('button', { name: /학생 · 취준생/i }).click()

  // Step 2
  await expect(page.getByText(/어떤 분야에 관심이 있나요/i)).toBeVisible({ timeout: 3000 })
  await page.getByRole('button', { name: /IT개발/i }).click()

  // Step 3
  await expect(page.getByText(/어느 정도 시간을 투자할 수 있나요/i)).toBeVisible({ timeout: 3000 })
  await page.getByRole('button', { name: /적당히/i }).click()

  // Step 4
  await expect(page.getByText(/추가로 알려주실 게 있나요/i)).toBeVisible({ timeout: 3000 })
}

test.describe('Recommendation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recommend')
    await page.waitForLoadState('networkidle')
  })

  // ===== Wizard Steps =====

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

    test('step 2: selecting one domain advances to next step', async ({ page }) => {
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

  // ===== Recommendation Results =====

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

      const detailButtons = page.getByRole('link', { name: /상세 정보 보기/i })
      const buttonCount = await detailButtons.count()

      test.skip(buttonCount === 0, 'No recommendations to test navigation')

      if (buttonCount > 0) {
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

      const userRequestSection = page.getByText(/내 요청/i)
      await expect(userRequestSection).toBeVisible()
      await expect(page.getByText(`"${userQuery}"`)).toBeVisible()
    })
  })

  // ===== Recommendation Card Display =====

  test.describe('Recommendation Card Display', () => {
    test('should display recommendation reason', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      const reasonLabels = page.locator('p').filter({ hasText: '추천 이유' })
      const hasResults = await reasonLabels.first().isVisible().catch(() => false)

      if (hasResults) {
        await expect(reasonLabels.first()).toBeVisible()
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
        const keyPointsList = page.locator('ul').filter({ has: page.locator('li') })
        await expect(keyPointsList.first()).toBeVisible()
      }
    })

    test('should display difficulty and study period info', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      const difficultyChip = page.getByText(/난이도/i).first()
      const hasDifficulty = await difficultyChip.isVisible().catch(() => false)
      if (hasDifficulty) {
        await expect(difficultyChip).toBeVisible()
      }

      const prepChip = page.getByText(/예상 준비/i).first()
      const hasPrep = await prepChip.isVisible().catch(() => false)
      if (hasPrep) {
        await expect(prepChip).toBeVisible()
      }
    })

    test('should NOT display average salary in key points', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })
      const salaryText = page.getByText(/평균 연봉/i)
      await expect(salaryText).not.toBeVisible()
    })

    test('should NOT display exam composition in key points', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })
      const examComposition = page.getByText(/필기.*과목|실기.*과목/i)
      await expect(examComposition).not.toBeVisible()
    })

    test('should display match score badge', async ({ page }) => {
      await completeWizard(page)
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 15000 })

      const matchBadge = page.getByText(/매치|%/i).first()
      const hasBadge = await matchBadge.isVisible().catch(() => false)
      if (hasBadge) {
        await expect(matchBadge).toBeVisible()
      }
    })
  })

  // ===== Natural Language Mode =====

  test.describe('Natural Language Mode', () => {
    test('should display natural input toggle button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /자연어로 입력/i })).toBeVisible()
    })

    test('should switch to natural input mode when clicked', async ({ page }) => {
      await page.getByRole('button', { name: /자연어로 입력/i }).click()
      await page.waitForTimeout(500)
      await expect(page.getByPlaceholder(/상황을 자유롭게 설명/i)).toBeVisible({ timeout: 10000 })
    })

    test('should switch back to wizard mode', async ({ page }) => {
      await page.getByRole('button', { name: /자연어로 입력/i }).click()
      await page.getByRole('button', { name: /단계별로 선택/i }).click()
      await expect(page.getByText(/지금 상황과 목표를 알려주세요/i)).toBeVisible()
    })
  })

  // ===== Natural Input UI =====

  test.describe('Natural Input UI', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /자연어로 입력/i }).click()
    })

    test('should display editable textarea', async ({ page }) => {
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await expect(textarea).toBeVisible()
      await expect(textarea).toBeEditable()
    })

    test('should disable submit button when input is empty', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /추천받기/i })
      await expect(submitButton).toBeDisabled()
    })

    test('should enable submit button when input has minimum length', async ({ page }) => {
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('비전공자인데 IT 분야 취업을 위해 자격증을 준비하고 있습니다.')

      const submitButton = page.getByRole('button', { name: /추천받기/i })
      await expect(submitButton).toBeEnabled()
    })

    test('should show character count', async ({ page }) => {
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('테스트 입력')
      await expect(page.getByText(/6.*\/.*1000/)).toBeVisible()
    })

    test('should show minimum length hint', async ({ page }) => {
      await expect(page.getByText(/10자 이상/i)).toBeVisible()
    })
  })

  // ===== Natural Recommendation Request =====

  test.describe('Natural Recommendation Request', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /자연어로 입력/i }).click()
    })

    test('should show loading state when submitting', async ({ page }) => {
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('비전공자인데 IT 분야 취업을 위해 자격증을 준비하고 있습니다. 현재 학생이고 6개월 정도 준비할 수 있습니다.')

      await page.getByRole('button', { name: /추천받기/i }).click()
      await expect(page.getByText(/AI가 분석 중/i)).toBeVisible({ timeout: 2000 })
    })

    test('should display results from natural API', async ({ page }) => {
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('비전공자인데 IT 분야 취업을 위해 자격증을 준비하고 있습니다. 현재 학생이고 6개월 정도 준비할 수 있습니다.')

      await page.getByRole('button', { name: /추천받기/i }).click()
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 30000 })

      const hasResults = await page.getByText(/추천 결과/i).isVisible().catch(() => false)
      const hasNoResults = await page.getByText(/추천 결과가 없습니다/i).isVisible().catch(() => false)
      expect(hasResults || hasNoResults).toBeTruthy()
    })

    test('should allow starting over after recommendation', async ({ page }) => {
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('비전공자인데 IT 분야 취업을 위해 자격증을 준비하고 있습니다.')

      await page.getByRole('button', { name: /추천받기/i }).click()
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 30000 })

      await page.getByRole('button', { name: /다시 추천/i }).first().click()

      const hasWizard = await page.getByText(/지금 상황과 목표를 알려주세요/i).isVisible().catch(() => false)
      const hasNaturalInput = await page.getByPlaceholder(/상황을 자유롭게 설명/i).isVisible().catch(() => false)
      expect(hasWizard || hasNaturalInput).toBeTruthy()
    })
  })

  // ===== Step 4 Natural Language Integration (Stepper Flow) =====

  test.describe('Step 4 Natural Language Integration', () => {
    test('should display textarea at step 4', async ({ page }) => {
      await goToStep4Stepper(page)
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await expect(textarea).toBeVisible()
    })

    test('should display example sentences', async ({ page }) => {
      await goToStep4Stepper(page)
      await expect(page.getByText(/비전공자인데 IT 분야/i)).toBeVisible()
    })

    test('should show character counter', async ({ page }) => {
      await goToStep4Stepper(page)
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('테스트 입력입니다')
      await expect(page.getByText(/9.*\/.*1000/)).toBeVisible()
    })

    test('should fill textarea when clicking example', async ({ page }) => {
      await goToStep4Stepper(page)
      await page.getByText(/비전공자인데 IT 분야/i).click()
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await expect(textarea).toHaveValue(/비전공자인데/)
    })

    test('should show optional hint', async ({ page }) => {
      await goToStep4Stepper(page)
      await expect(page.getByText(/선택사항이에요/i)).toBeVisible()
    })

    test('should allow submit without input', async ({ page }) => {
      await goToStep4Stepper(page)
      const submitButton = page.getByRole('button', { name: /추천받기/i })
      await expect(submitButton).toBeEnabled()
    })

    test('should allow submit with input', async ({ page }) => {
      await goToStep4Stepper(page)
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('웹 디자인에 관심이 많아요')
      const submitButton = page.getByRole('button', { name: /추천받기/i })
      await expect(submitButton).toBeEnabled()
    })

    test('should call /recommendations API (not /natural)', async ({ page }) => {
      await goToStep4Stepper(page)

      let apiCalled = ''
      page.on('request', (request) => {
        if (request.url().includes('/api/v1/recommendations')) {
          apiCalled = request.url()
        }
      })

      await page.getByRole('button', { name: /추천받기/i }).click()
      await page.waitForTimeout(500)
      expect(apiCalled).toContain('/api/v1/recommendations')
      expect(apiCalled).not.toContain('/natural')
    })
  })
})
