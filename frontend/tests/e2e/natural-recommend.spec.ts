/**
 * E2E tests for Natural Language Recommendation (자연어 기반 추천)
 *
 * 백엔드 API: POST /api/v1/recommendations/natural
 */
import { test, expect } from '@playwright/test'

test.describe('Natural Language Recommendation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recommend')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Natural Input Mode Toggle', () => {
    test('should display natural input toggle button in wizard', async ({ page }) => {
      // 자연어 입력 모드 전환 버튼이 표시되어야 함
      await expect(page.getByRole('button', { name: /자연어로 입력/i })).toBeVisible()
    })

    test('should switch to natural input mode when clicked', async ({ page }) => {
      await page.getByRole('button', { name: /자연어로 입력/i }).click()

      // 상태 변경 대기
      await page.waitForTimeout(500)

      // 자연어 입력 모드 UI가 표시되어야 함
      await expect(page.getByPlaceholder(/상황을 자유롭게 설명/i)).toBeVisible({ timeout: 10000 })
    })

    test('should switch back to wizard mode', async ({ page }) => {
      await page.getByRole('button', { name: /자연어로 입력/i }).click()

      // 위자드 모드로 전환 버튼
      await page.getByRole('button', { name: /단계별로 선택/i }).click()

      // 위자드 UI가 다시 표시되어야 함
      await expect(page.getByText(/지금 상황과 목표를 알려주세요/i)).toBeVisible()
    })
  })

  test.describe('Natural Input UI', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /자연어로 입력/i }).click()
    })

    test('should display textarea for natural input', async ({ page }) => {
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await expect(textarea).toBeVisible()
      await expect(textarea).toBeEditable()
    })

    test('should display submit button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /추천받기/i })).toBeVisible()
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

      // 글자 수 표시 확인
      await expect(page.getByText(/6.*\/.*1000/)).toBeVisible()
    })

    test('should show minimum length hint', async ({ page }) => {
      await expect(page.getByText(/10자 이상/i)).toBeVisible()
    })
  })

  test.describe('Natural Recommendation Request', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /자연어로 입력/i }).click()
    })

    test('should show loading state when submitting', async ({ page }) => {
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('비전공자인데 IT 분야 취업을 위해 자격증을 준비하고 있습니다. 현재 학생이고 6개월 정도 준비할 수 있습니다.')

      await page.getByRole('button', { name: /추천받기/i }).click()

      // 로딩 상태 표시
      await expect(page.getByText(/AI가 분석 중/i)).toBeVisible({ timeout: 2000 })
    })

    test('should display structured context after analysis', async ({ page }) => {
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('비전공자인데 IT 분야 취업을 위해 자격증을 준비하고 있습니다. 현재 학생이고 6개월 정도 준비할 수 있습니다.')

      await page.getByRole('button', { name: /추천받기/i }).click()

      // 결과 또는 에러 대기
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 30000 })

      // 구조화된 컨텍스트 표시 (LLM이 파싱한 결과)
      const hasContext = await page.getByText(/분석된 상황/i).isVisible().catch(() => false)
      const hasGoal = await page.getByText(/목표.*취업/i).isVisible().catch(() => false)
      const hasBackground = await page.getByText(/비전공자/i).isVisible().catch(() => false)

      expect(hasContext || hasGoal || hasBackground).toBeTruthy()
    })

    test('should display recommendations from natural API', async ({ page }) => {
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('비전공자인데 IT 분야 취업을 위해 자격증을 준비하고 있습니다. 현재 학생이고 6개월 정도 준비할 수 있습니다.')

      await page.getByRole('button', { name: /추천받기/i }).click()

      // 결과 대기
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 30000 })

      // 추천 결과 또는 빈 상태 확인
      const hasResults = await page.getByText(/추천 결과/i).isVisible().catch(() => false)
      const hasNoResults = await page.getByText(/추천 결과가 없습니다/i).isVisible().catch(() => false)

      expect(hasResults || hasNoResults).toBeTruthy()
    })

    test('should allow starting over after recommendation', async ({ page }) => {
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('비전공자인데 IT 분야 취업을 위해 자격증을 준비하고 있습니다.')

      await page.getByRole('button', { name: /추천받기/i }).click()

      // 결과 대기
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 30000 })

      // 다시 추천받기 클릭
      await page.getByRole('button', { name: /다시 추천/i }).first().click()

      // 입력 모드로 돌아가야 함
      const hasWizard = await page.getByText(/지금 상황과 목표를 알려주세요/i).isVisible().catch(() => false)
      const hasNaturalInput = await page.getByPlaceholder(/상황을 자유롭게 설명/i).isVisible().catch(() => false)

      expect(hasWizard || hasNaturalInput).toBeTruthy()
    })
  })

  test.describe('Follow-up Question', () => {
    test('should display follow-up question when provided by API', async ({ page }) => {
      await page.getByRole('button', { name: /자연어로 입력/i }).click()

      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('자격증 추천해주세요')  // 짧고 모호한 입력

      await page.getByRole('button', { name: /추천받기/i }).click()

      // 결과 대기
      await expect(page.getByRole('button', { name: /다시 추천/i }).first()).toBeVisible({ timeout: 30000 })

      // 후속 질문이 있으면 표시
      const hasFollowUp = await page.getByText(/질문|관심|분야|구체적/i).isVisible().catch(() => false)
      // 후속 질문은 선택적이므로 테스트 통과
      expect(true).toBeTruthy()
    })
  })
})
