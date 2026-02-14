import { test, expect } from '@playwright/test'

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    // localStorage 초기화하여 시스템 테마가 기본으로 적용되게 함
    await page.goto('/')
  })

  test('시스템 다크 모드 시 dark 클래스가 적용된다', async ({ page }) => {
    // Playwright는 기본적으로 prefers-color-scheme: light이므로
    // 다크 모드로 에뮬레이션
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')

    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
  })

  test('시스템 라이트 모드 시 dark 클래스가 없다', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    const html = page.locator('html')
    await expect(html).not.toHaveClass(/dark/)
  })

  test('테마 토글 버튼이 헤더에 표시된다', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /테마/ })
    await expect(themeToggle).toBeVisible()
  })

  test('테마 토글 클릭 시 다크/라이트 모드가 전환된다', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    const html = page.locator('html')
    // 시스템이 라이트 모드이므로 dark 클래스가 없어야 함
    await expect(html).not.toHaveClass(/dark/)

    // 테마 토글 클릭 → 다크 모드로 전환
    const themeToggle = page.getByRole('button', { name: /테마/ })
    await themeToggle.click()

    await expect(html).toHaveClass(/dark/)
  })

  test('테마 선택이 localStorage에 저장된다', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    // 테마 토글 클릭
    const themeToggle = page.getByRole('button', { name: /테마/ })
    await themeToggle.click()

    // localStorage에 저장 확인
    const theme = await page.evaluate(() => localStorage.getItem('theme'))
    expect(theme).toBe('dark')
  })

  test('저장된 테마가 페이지 새로고침 후에도 유지된다', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    // 다크 모드로 전환
    const themeToggle = page.getByRole('button', { name: /테마/ })
    await themeToggle.click()

    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)

    // 페이지 새로고침
    await page.reload()

    // 다크 모드가 유지되어야 함
    await expect(html).toHaveClass(/dark/)
  })

  test('라이트 모드에서 배경이 밝은 색상이다', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    const body = page.locator('body')
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })

    // 밝은 배경 (RGB 값이 높아야 함)
    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      const [, r, g, b] = match.map(Number)
      // 라이트 모드에서 배경색은 충분히 밝아야 함 (각 채널 200 이상)
      expect(r).toBeGreaterThan(200)
      expect(g).toBeGreaterThan(200)
      expect(b).toBeGreaterThan(200)
    }
  })
})
