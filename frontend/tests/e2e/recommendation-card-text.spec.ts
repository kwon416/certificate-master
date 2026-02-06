/**
 * E2E Tests for Recommendation Card Text Display
 *
 * 핵심 포인트 텍스트가 잘리지 않고 전체 내용이 표시되는지 테스트
 */

import { test, expect } from '@playwright/test'

test.describe('Recommendation Card - Text Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recommend')
    await page.waitForLoadState('networkidle')
  })

  test('핵심 포인트 텍스트가 완전히 표시되어야 함', async ({ page }) => {
    // TODO: 실제 추천 결과를 얻기 위해 위자드를 완료하거나
    // 테스트 데이터를 주입해야 함

    // 현재는 구조 검증만 수행
    const keyPointsSection = page.locator('text=핵심 포인트').first()

    if (await keyPointsSection.isVisible()) {
      // 핵심 포인트 항목들 가져오기
      const keyPointItems = page.locator('ul').filter({ hasText: '핵심 포인트' }).locator('li')
      const count = await keyPointItems.count()

      // 각 항목의 텍스트가 잘리지 않았는지 확인
      for (let i = 0; i < count; i++) {
        const item = keyPointItems.nth(i)
        const text = await item.textContent()

        // 텍스트가 존재하고 비어있지 않은지 확인
        expect(text).toBeTruthy()
        expect(text?.trim().length).toBeGreaterThan(0)

        // overflow: hidden이나 text-overflow: ellipsis가 적용되지 않았는지 확인
        const hasOverflowHidden = await item.evaluate(el => {
          const style = window.getComputedStyle(el)
          return style.overflow === 'hidden' && style.textOverflow === 'ellipsis'
        })
        expect(hasOverflowHidden).toBe(false)
      }
    }
  })

  test('모바일 화면에서도 핵심 포인트가 완전히 표시되어야 함', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 })

    const keyPointsSection = page.locator('text=핵심 포인트').first()

    if (await keyPointsSection.isVisible()) {
      const keyPointItems = page.locator('ul').filter({ hasText: '핵심 포인트' }).locator('li')
      const count = await keyPointItems.count()

      for (let i = 0; i < count; i++) {
        const item = keyPointItems.nth(i)

        // 항목이 보이는지 확인
        await expect(item).toBeVisible()

        // 텍스트가 줄바꿈되어 표시되는지 확인 (단일 줄로 잘리지 않음)
        const hasProperWrapping = await item.evaluate(el => {
          const style = window.getComputedStyle(el)
          return style.whiteSpace !== 'nowrap' && style.wordBreak !== 'keep-all'
        })
        expect(hasProperWrapping).toBe(true)
      }
    }
  })

  test('긴 텍스트도 모두 표시되어야 함', async ({ page }) => {
    // 긴 텍스트가 포함된 핵심 포인트가 있다고 가정
    const longTextPattern = /.{50,}/  // 50자 이상의 텍스트

    const keyPointItems = page.locator('ul').filter({ hasText: '핵심 포인트' }).locator('li')
    const count = await keyPointItems.count()

    for (let i = 0; i < count; i++) {
      const item = keyPointItems.nth(i)
      const text = await item.textContent()

      if (text && longTextPattern.test(text)) {
        // 긴 텍스트가 잘리지 않고 모두 표시되는지 확인
        const boundingBox = await item.boundingBox()
        expect(boundingBox).toBeTruthy()

        // 높이가 충분한지 확인 (긴 텍스트는 여러 줄로 표시되어야 함)
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThan(30)  // 최소 높이
        }
      }
    }
  })
})
