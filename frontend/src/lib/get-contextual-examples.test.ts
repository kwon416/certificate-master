import { describe, it, expect } from 'vitest'
import { getContextualExamples } from './get-contextual-examples'

describe('getContextualExamples', () => {
  it('항상 3개의 예시 문장을 반환한다', () => {
    const examples = getContextualExamples('student_employment', 'IT개발')
    expect(examples).toHaveLength(3)
  })

  it('모든 예시 문장이 빈 문자열이 아니다', () => {
    const examples = getContextualExamples('student_employment', 'IT개발')
    examples.forEach((example) => {
      expect(example.length).toBeGreaterThan(0)
    })
  })

  it('IT개발 선택 시 IT/개발 관련 키워드가 포함된다', () => {
    const examples = getContextualExamples('student_employment', 'IT개발')
    const combined = examples.join(' ')
    expect(combined).toMatch(/IT|개발|프로그래밍|소프트웨어|정보처리/)
  })

  it('디자인 선택 시 디자인 관련 키워드가 포함된다', () => {
    const examples = getContextualExamples('student_employment', '디자인')
    const combined = examples.join(' ')
    expect(combined).toMatch(/디자인|그래픽|UI|UX|컬러리스트/)
  })

  it('의료 선택 시 의료 관련 키워드가 포함된다', () => {
    const examples = getContextualExamples('student_employment', '의료')
    const combined = examples.join(' ')
    expect(combined).toMatch(/의료|간호|보건|병원|약|임상/)
  })

  it('건설/건축 선택 시 건설 관련 키워드가 포함된다', () => {
    const examples = getContextualExamples('student_employment', '건설/건축')
    const combined = examples.join(' ')
    expect(combined).toMatch(/건설|건축|시공|토목|안전/)
  })

  it('회계/세무/재무 선택 시 회계 관련 키워드가 포함된다', () => {
    const examples = getContextualExamples('junior_career', '회계/세무/재무')
    const combined = examples.join(' ')
    expect(combined).toMatch(/회계|세무|재무|세금|경리/)
  })

  it('상황이 student_employment일 때 학생/취준 관련 문맥이 포함된다', () => {
    const examples = getContextualExamples('student_employment', 'IT개발')
    const combined = examples.join(' ')
    expect(combined).toMatch(/학생|취업|취준|비전공|졸업/)
  })

  it('상황이 junior_career일 때 직장인/이직 관련 문맥이 포함된다', () => {
    const examples = getContextualExamples('junior_career', '데이터')
    const combined = examples.join(' ')
    expect(combined).toMatch(/직장|이직|현직|경력|연봉/)
  })

  it('상황이 career_break_restart일 때 경력 단절/재취업 관련 문맥이 포함된다', () => {
    const examples = getContextualExamples('career_break_restart', '총무/법무/사무')
    const combined = examples.join(' ')
    expect(combined).toMatch(/경력 단절|재취업|복귀|휴직/)
  })

  it('같은 분야라도 상황이 다르면 다른 예시 문장을 반환한다', () => {
    const studentExamples = getContextualExamples('student_employment', 'IT개발')
    const seniorExamples = getContextualExamples('senior_expertise', 'IT개발')
    // 최소 하나의 예시 문장이 달라야 함
    const isDifferent = studentExamples.some(
      (example, i) => example !== seniorExamples[i]
    )
    expect(isDifferent).toBe(true)
  })

  it('인자가 undefined이면 기본 예시 문장을 반환한다', () => {
    const examples = getContextualExamples(undefined, undefined)
    expect(examples).toHaveLength(3)
    examples.forEach((example) => {
      expect(example.length).toBeGreaterThan(0)
    })
  })

  it('관심 분야만 undefined이면 상황에 맞는 일반 예시를 반환한다', () => {
    const examples = getContextualExamples('student_employment', undefined)
    expect(examples).toHaveLength(3)
    const combined = examples.join(' ')
    expect(combined).toMatch(/학생|취업|취준|비전공|졸업/)
  })

  it('상황만 undefined이면 분야에 맞는 일반 예시를 반환한다', () => {
    const examples = getContextualExamples(undefined, '데이터')
    expect(examples).toHaveLength(3)
    const combined = examples.join(' ')
    expect(combined).toMatch(/데이터|분석|통계|SQL|파이썬/)
  })
})
