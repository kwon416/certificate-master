import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const ROOT = path.join(__dirname, '../..')

test.describe('Bundle Optimization', () => {
  // Task 1: ReactQueryDevtools는 프로덕션 번들에 포함되지 않아야 함
  test('providers.tsx에서 ReactQueryDevtools를 정적 import하지 않아야 한다', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/lib/providers.tsx'),
      'utf-8'
    )
    // 정적 import가 없어야 함 (dynamic import는 허용)
    expect(content).not.toMatch(
      /^import\s.*ReactQueryDevtools.*from\s+['"]@tanstack\/react-query-devtools['"]/m
    )
  })

  // Task 2: Radix UI 패키지가 optimizePackageImports에 포함되어야 함
  test('next.config.mjs에 Radix UI 패키지가 optimizePackageImports에 포함되어야 한다', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'next.config.mjs'),
      'utf-8'
    )
    expect(content).toContain('@radix-ui/react-dialog')
    expect(content).toContain('@radix-ui/react-select')
    expect(content).toContain('@radix-ui/react-tabs')
    expect(content).toContain('@radix-ui/react-slot')
  })

  // Task 3: globals.css에 tailwind.config.ts와 중복되는 keyframe이 없어야 함
  test('globals.css에 중복 @keyframes 정의가 없어야 한다', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/globals.css'),
      'utf-8'
    )
    // tailwind.config.ts에서 이미 정의된 keyframe들이 globals.css에 없어야 함
    expect(content).not.toMatch(/@keyframes\s+float\s*\{/)
    expect(content).not.toMatch(/@keyframes\s+pulse-glow\s*\{/)
    expect(content).not.toMatch(/@keyframes\s+slide-up\s*\{/)
    expect(content).not.toMatch(/@keyframes\s+slide-in-right\s*\{/)
  })

  test('globals.css에 중복 .animate-* 클래스 정의가 없어야 한다', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/globals.css'),
      'utf-8'
    )
    // 독립 클래스 정의 (animation: <name>) 가 없어야 함
    // prefers-reduced-motion 내 셀렉터(animation: none)는 허용
    expect(content).not.toMatch(/animation:\s*float\s/)
    expect(content).not.toMatch(/animation:\s*pulse-glow\s/)
    expect(content).not.toMatch(/animation:\s*slide-up\s/)
    expect(content).not.toMatch(/animation:\s*slide-in-right\s/)
  })

  // Task 4: Header에서 Sheet를 정적 import하지 않아야 함
  test('header.tsx에서 Sheet(radix-ui/react-dialog)를 정적 import하지 않아야 한다', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/components/layout/header.tsx'),
      'utf-8'
    )
    // Sheet를 정적 import 하면 @radix-ui/react-dialog가 초기 번들에 포함됨
    expect(content).not.toMatch(
      /^import\s*\{[^}]*Sheet[^}]*\}\s*from\s+['"]@\/components\/ui\/sheet['"]/m
    )
  })

  // Task 5: Root layout에서 barrel import 대신 직접 경로를 사용해야 함
  test('layout.tsx에서 barrel import 대신 직접 파일 경로를 사용해야 한다', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/layout.tsx'),
      'utf-8'
    )
    // barrel import (index.ts 경유) 대신 직접 파일 경로 사용
    expect(content).not.toMatch(/from\s+['"]@\/components\/layout['"]/)
    expect(content).not.toMatch(/from\s+['"]@\/components\/seo['"]/)
  })
})
