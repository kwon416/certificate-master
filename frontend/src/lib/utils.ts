import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * URL 정규식 패턴
 * http://, https:// 로 시작하는 URL을 매칭합니다.
 */
const URL_REGEX = /https?:\/\/[^\s<>'")\]]+/g

/**
 * 문자열이 URL인지 확인합니다.
 */
export function isUrl(text: string): boolean {
  const trimmed = text.trim()
  return /^https?:\/\/[^\s<>'")\]]+$/.test(trimmed)
}

/**
 * 텍스트에서 URL을 추출하여 { type, value } 배열로 분할합니다.
 * - type: 'text' | 'url'
 * - value: 해당 부분의 문자열
 */
export function splitByUrls(text: string): Array<{ type: 'text' | 'url'; value: string }> {
  const parts: Array<{ type: 'text' | 'url'; value: string }> = []
  let lastIndex = 0

  const regex = new RegExp(URL_REGEX.source, 'g')
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // 매치 이전의 텍스트
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    // URL 부분
    parts.push({ type: 'url', value: match[0] })
    lastIndex = regex.lastIndex
  }

  // 남은 텍스트
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return parts
}
