/**
 * E2E tests for Step 4 Natural Language Integration
 *
 * 위자드 Step 4에서 자연어 입력이 선택적으로 가능한지 테스트합니다.
 * - 자연어 입력은 user_summary로 전달됨
 * - 별도의 API 없이 기존 /recommendations API 사용
 */
import { test, expect, type Page } from '@playwright/test'

// Helper: Step 1-3까지 진행
async function goToStep4(page: Page) {
  await page.goto('/recommend')
  await page.waitForLoadState('networkidle')

  // Step 1: 상황+목표 선택
  await expect(page.getByText(/지금 상황과 목표를 알려주세요/i)).toBeVisible()
  await page.getByRole('button', { name: /학생 · 취준생/i }).click()

  // Step 2: 관심 분야 선택
  await expect(page.getByText(/어떤 분야에 관심이 있나요/i)).toBeVisible({ timeout: 3000 })
  await page.getByRole('button', { name: /IT개발/i }).click()

  // Step 3: 투자 시간 선택
  await expect(page.getByText(/어느 정도 시간을 투자할 수 있나요/i)).toBeVisible({ timeout: 3000 })
  await page.getByRole('button', { name: /적당히/i }).click()

  // Step 4에 도달해야 함
  await expect(page.getByText(/추가로 알려주실 게 있나요/i)).toBeVisible({ timeout: 3000 })
}

test.describe('Step 4 자연어 통합', () => {
  test.describe('UI 테스트', () => {
    test('Step 4에 자연어 입력 Textarea 표시', async ({ page }) => {
      await goToStep4(page)

      // 자연어 입력 Textarea가 표시되어야 함
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await expect(textarea).toBeVisible()
    })

    test('Step 4에 예시 문장 표시', async ({ page }) => {
      await goToStep4(page)

      // 예시 문장이 표시되어야 함
      await expect(page.getByText(/비전공자인데 IT 분야/i)).toBeVisible()
    })

    test('글자 수 카운터 표시', async ({ page }) => {
      await goToStep4(page)

      // Textarea에 텍스트 입력
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('테스트 입력입니다')

      // 글자 수 카운터가 표시되어야 함
      await expect(page.getByText(/9.*\/.*1000/)).toBeVisible()
    })

    test('예시 문장 클릭 시 입력됨', async ({ page }) => {
      await goToStep4(page)

      // 예시 문장 클릭
      await page.getByText(/비전공자인데 IT 분야/i).click()

      // Textarea에 입력됨
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await expect(textarea).toHaveValue(/비전공자인데/)
    })

    test('선택사항 힌트 표시', async ({ page }) => {
      await goToStep4(page)

      // 선택사항 힌트가 표시되어야 함
      await expect(page.getByText(/선택사항이에요/i)).toBeVisible()
    })
  })

  test.describe('기능 테스트', () => {
    test('입력 없이도 추천받기 가능', async ({ page }) => {
      await goToStep4(page)

      // 아무 입력 없이 추천받기 버튼이 활성화되어야 함
      const submitButton = page.getByRole('button', { name: /추천받기/i })
      await expect(submitButton).toBeEnabled()
    })

    test('입력 있어도 추천받기 가능', async ({ page }) => {
      await goToStep4(page)

      // 텍스트 입력
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('웹 디자인에 관심이 많아요')

      // 추천받기 버튼이 활성화되어야 함
      const submitButton = page.getByRole('button', { name: /추천받기/i })
      await expect(submitButton).toBeEnabled()
    })

    test('항상 /recommendations API 호출 (입력 없을 때)', async ({ page }) => {
      await goToStep4(page)

      // API 호출 모니터링
      let apiCalled = ''
      page.on('request', (request) => {
        if (request.url().includes('/api/v1/recommendations')) {
          apiCalled = request.url()
        }
      })

      // 입력 없이 추천받기 클릭
      await page.getByRole('button', { name: /추천받기/i }).click()

      // 기존 API 호출 확인
      await page.waitForTimeout(500)
      expect(apiCalled).toContain('/api/v1/recommendations')
      expect(apiCalled).not.toContain('/natural')
    })

    test('항상 /recommendations API 호출 (입력 있을 때)', async ({ page }) => {
      await goToStep4(page)

      // API 호출 모니터링
      let apiCalled = ''
      page.on('request', (request) => {
        if (request.url().includes('/api/v1/recommendations')) {
          apiCalled = request.url()
        }
      })

      // 텍스트 입력
      const textarea = page.getByPlaceholder(/상황을 자유롭게 설명/i)
      await textarea.fill('웹 디자인에 관심이 많아요')

      // 추천받기 클릭
      await page.getByRole('button', { name: /추천받기/i }).click()

      // 기존 API 호출 확인 (natural이 아닌)
      await page.waitForTimeout(500)
      expect(apiCalled).toContain('/api/v1/recommendations')
      expect(apiCalled).not.toContain('/natural')
    })
  })

  test.describe('상단 버튼 제거 확인', () => {
    test('상단 "자연어로 입력하기" 버튼 없음', async ({ page }) => {
      await page.goto('/recommend')
      await page.waitForLoadState('networkidle')

      // Step 1에서 상단 자연어 버튼이 없어야 함
      await expect(page.getByText(/지금 상황과 목표를 알려주세요/i)).toBeVisible()

      // "자연어로 입력하기" 버튼이 없어야 함
      const naturalButton = page.getByRole('button', { name: /자연어로 입력하기/i })
      await expect(naturalButton).not.toBeVisible()
    })
  })
})
