import { test, expect } from '@playwright/test'

test.describe('Infinite Scroll Layout Stability', () => {
  test('should maintain stable layout during loading', async ({ page }) => {
    await page.goto('/')

    // 검색어 입력하여 결과 표시
    await page.getByPlaceholder('자격증 이름을 입력하세요').fill('정보')
    await page.waitForTimeout(500) // 디바운스 대기

    // 결과가 로드될 때까지 대기
    await page.waitForSelector('[data-testid="certificate-card"]', { timeout: 10000 })

    // 최하단 로딩 영역의 초기 위치 측정
    const loadingArea = page.locator('[data-testid="infinite-scroll-trigger"]')
    const initialBox = await loadingArea.boundingBox()

    expect(initialBox).not.toBeNull()
    const initialHeight = initialBox!.height

    // 스크롤하여 다음 페이지 로딩 트리거
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    // 로딩 중 상태에서 높이 측정
    await page.waitForTimeout(100) // 로딩 시작 대기
    const loadingBox = await loadingArea.boundingBox()

    expect(loadingBox).not.toBeNull()
    const loadingHeight = loadingBox!.height

    // 높이가 유지되는지 확인 (±5px 허용)
    expect(Math.abs(loadingHeight - initialHeight)).toBeLessThan(5)
  })

  test('should have consistent height when showing "all loaded" message', async ({ page }) => {
    await page.goto('/')

    // 매우 구체적인 검색어로 적은 결과 표시
    await page.getByPlaceholder('자격증 이름을 입력하세요').fill('정보처리기사')
    await page.waitForTimeout(500)

    // 결과가 로드될 때까지 대기
    await page.waitForSelector('[data-testid="certificate-card"]', { timeout: 10000 })

    // 끝까지 스크롤
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    // "모든 결과를 불러왔습니다" 메시지 대기
    await page.waitForSelector('text=모든 결과를 불러왔습니다', { timeout: 5000 })

    // 최하단 영역의 높이 측정
    const loadingArea = page.locator('[data-testid="infinite-scroll-trigger"]')
    const finalBox = await loadingArea.boundingBox()

    expect(finalBox).not.toBeNull()

    // 최소 높이가 있는지 확인 (빈 공간이 아님)
    expect(finalBox!.height).toBeGreaterThan(40)
  })

  test('should not cause scroll jump during pagination', async ({ page }) => {
    await page.goto('/')

    await page.getByPlaceholder('자격증 이름을 입력하세요').fill('기사')
    await page.waitForTimeout(500)

    await page.waitForSelector('[data-testid="certificate-card"]', { timeout: 10000 })

    // 페이지 중간으로 스크롤
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })

    const initialScrollY = await page.evaluate(() => window.scrollY)

    // 추가 로딩 트리거
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    await page.waitForTimeout(1000) // 로딩 완료 대기

    // 사용자가 스크롤하지 않았을 때 위치가 크게 변하지 않는지 확인
    // (새 컨텐츠가 추가되므로 약간의 변화는 정상)
    const currentScrollY = await page.evaluate(() => window.scrollY)

    // 스크롤이 위로 튀지 않았는지 확인 (아래로만 가능)
    expect(currentScrollY).toBeGreaterThanOrEqual(initialScrollY - 100)
  })
})
