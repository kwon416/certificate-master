/**
 * Study Plans E2E Tests
 * 
 * Tests for study plan creation, viewing, and management
 */

import { test, expect } from '@playwright/test'

test.describe('Study Plans', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:5100/login')
    
    // 테스트 계정으로 로그인
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'test123456')
    await page.click('button[type="submit"]')
    
    // 로그인 완료 대기
    await page.waitForURL('**/dashboard', { timeout: 10000 })
  })

  test('should redirect study plans list to dashboard', async ({ page }) => {
    await page.goto('http://localhost:5100/study-plans')
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('should display empty state when no study plans exist', async ({ page }) => {
    // Dashboard에서 학습 계획이 없는 경우
    await page.goto('http://localhost:5100/dashboard')
    
    // Empty state 확인
    await expect(page.getByText('아직 학습 계획이 없습니다')).toBeVisible()
    await expect(page.getByText('자격증 검색하기')).toBeVisible()
  })

  test('should navigate to certificates page to create plan', async ({ page }) => {
    await page.goto('http://localhost:5100/dashboard')
    
    // '새 학습 계획' 버튼 클릭
    await page.click('text=새 학습 계획')
    
    // 자격증 검색 페이지로 이동 확인
    await expect(page).toHaveURL(/.*search/)
  })

  test('should create a new study plan', async ({ page }) => {
    // 1. 자격증 페이지로 이동
    await page.goto('http://localhost:5100/search')
    
    // 2. 자격증 선택 (첫 번째 자격증 클릭)
    await page.waitForSelector('[data-testid="certificate-card"]', { timeout: 10000 })
    const firstCert = page.locator('[data-testid="certificate-card"]').first()
    await firstCert.click()
    
    // 3. 자격증 상세 페이지에서 '학습 계획 만들기' 버튼 클릭
    await page.waitForSelector('text=학습 계획 만들기', { timeout: 5000 })
    await page.click('text=학습 계획 만들기')
    
    // 4. 학습 계획 생성 폼 작성
    await page.waitForSelector('[data-testid="study-plan-form"]', { timeout: 5000 })
    
    // 목표 날짜 설정 (3개월 후)
    const targetDate = new Date()
    targetDate.setMonth(targetDate.getMonth() + 3)
    const dateString = targetDate.toISOString().split('T')[0]
    await page.fill('input[name="target_date"]', dateString)
    
    // 하루 학습 시간 설정
    await page.fill('input[name="daily_hours"]', '3')
    
    // 5. 폼 제출
    await page.click('button[type="submit"]:has-text("학습 계획 생성")')
    
    // 6. 성공 메시지 확인
    await expect(page.getByText(/학습 계획이 생성되었습니다/)).toBeVisible({ timeout: 5000 })
    
    // 7. 학습 대시보드 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 })
  })

  test('should display study plan list', async ({ page }) => {
    // 학습 계획이 있는 상태에서
    await page.goto('http://localhost:5100/dashboard')
    
    // 로딩 완료 대기
    await page.waitForSelector('[data-testid="study-plan-card"]', { 
      timeout: 10000,
      state: 'visible' 
    })
    
    // 학습 계획 카드가 표시되는지 확인
    const planCards = page.locator('[data-testid="study-plan-card"]')
    await expect(planCards).toHaveCount(1, { timeout: 5000 })
    
    // 카드 내용 확인
    await expect(planCards.first()).toContainText('진행 중')
    await expect(planCards.first()).toContainText('목표:')
    await expect(planCards.first()).toContainText('진행률')
  })

  test('should show study plan details', async ({ page }) => {
    await page.goto('http://localhost:5100/dashboard')
    
    // 첫 번째 학습 계획 카드 대기
    await page.waitForSelector('[data-testid="study-plan-card"]', { timeout: 10000 })
    
    // '상세 보기' 버튼 클릭
    await page.click('button:has-text("상세 보기")')
    
    // 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/.*study-plans\/[a-f0-9-]+/)
    
    // 상세 정보 확인
    await expect(page.getByText('학습 계획 상세')).toBeVisible()
    await expect(page.getByText('마일스톤')).toBeVisible()
  })

  test('should delete a study plan', async ({ page }) => {
    await page.goto('http://localhost:5100/dashboard')
    
    // 학습 계획 카드 대기
    await page.waitForSelector('[data-testid="study-plan-card"]', { timeout: 10000 })
    
    // 삭제 버튼 클릭
    page.on('dialog', dialog => dialog.accept()) // confirm 대화상자 자동 승인
    await page.click('[aria-label="삭제"]')
    
    // 삭제 후 empty state 확인
    await expect(page.getByText('아직 학습 계획이 없습니다')).toBeVisible({ timeout: 5000 })
  })

  test('should update milestone completion', async ({ page }) => {
    await page.goto('http://localhost:5100/dashboard')
    
    // 상세 페이지로 이동
    await page.waitForSelector('[data-testid="study-plan-card"]', { timeout: 10000 })
    await page.click('button:has-text("상세 보기")')
    
    // 첫 번째 마일스톤 체크박스 클릭
    await page.waitForSelector('[data-testid="milestone-checkbox"]', { timeout: 5000 })
    const firstCheckbox = page.locator('[data-testid="milestone-checkbox"]').first()
    await firstCheckbox.check()
    
    // 진행률 업데이트 확인
    await expect(page.getByText(/진행률.*%/)).toBeVisible()
  })

  test('should pause and resume study plan', async ({ page }) => {
    await page.goto('http://localhost:5100/dashboard')
    
    // 상세 페이지로 이동
    await page.waitForSelector('[data-testid="study-plan-card"]', { timeout: 10000 })
    await page.click('button:has-text("상세 보기")')
    
    // 일시 중지 버튼 클릭
    await page.click('button:has-text("일시 중지")')
    
    // 상태 변경 확인
    await expect(page.getByText('일시 중지')).toBeVisible()
    
    // 다시 시작 버튼 클릭
    await page.click('button:has-text("다시 시작")')
    
    // 진행 중 상태로 변경 확인
    await expect(page.getByText('진행 중')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // 네트워크 오류 시뮬레이션
    await page.route('**/api/v1/study-plans/**', route => route.abort())
    
    await page.goto('http://localhost:5100/dashboard')
    
    // 에러 메시지 확인
    await expect(page.getByText(/데이터를 불러오는데 실패했습니다/)).toBeVisible({
      timeout: 10000
    })
  })

  test('should validate form inputs', async ({ page }) => {
    // 자격증 페이지로 이동하여 학습 계획 생성 시도
    await page.goto('http://localhost:5100/certificates')
    
    await page.waitForSelector('[data-testid="certificate-card"]', { timeout: 10000 })
    await page.locator('[data-testid="certificate-card"]').first().click()
    
    await page.click('text=학습 계획 만들기')
    
    // 폼 대기
    await page.waitForSelector('[data-testid="study-plan-form"]', { timeout: 5000 })
    
    // 유효하지 않은 입력
    await page.fill('input[name="daily_hours"]', '15') // 12시간 초과
    
    // 제출 시도
    await page.click('button[type="submit"]')
    
    // 유효성 검사 에러 메시지 확인
    await expect(page.getByText(/0.5.*12.*사이/)).toBeVisible()
  })
})

test.describe('Study Plans - Authentication', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // 로그아웃 상태에서 학습 계획 페이지 접근
    await page.goto('http://localhost:5100/dashboard')
    
    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 })
  })

  test('should maintain study plans after page refresh', async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:5100/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'test123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
    
    // 학습 계획 페이지로 이동
    await page.goto('http://localhost:5100/dashboard')
    await page.waitForSelector('[data-testid="study-plan-card"]', { timeout: 10000 })
    
    // 페이지 새로고침
    await page.reload()
    
    // 여전히 학습 계획이 표시되는지 확인
    await expect(page.locator('[data-testid="study-plan-card"]')).toBeVisible({ timeout: 10000 })
  })
})

