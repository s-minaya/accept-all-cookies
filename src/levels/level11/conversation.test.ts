import { describe, expect, it } from 'vitest'
import { answer, SCRIPT } from './conversation'

describe('conversation (GDD Nivel 11 — 015-plan.md)', () => {
  it('has 8 steps: two identical rounds of the same 4 questions', () => {
    expect(SCRIPT).toHaveLength(8)
    expect(SCRIPT.slice(0, 4).map((step) => step.questionKey)).toEqual(
      SCRIPT.slice(4).map((step) => step.questionKey),
    )
    expect(SCRIPT.slice(0, 4).map((step) => step.expected)).toEqual(
      SCRIPT.slice(4).map((step) => step.expected),
    )
  })

  it('only steps 4 and 8 (index 3 and 7) expect "yes"; the rest expect "no"', () => {
    SCRIPT.forEach((step, index) => {
      const expectedAnswer = index === 3 || index === 7 ? 'yes' : 'no'
      expect(step.expected).toBe(expectedAnswer)
    })
  })

  it('no two consecutive steps share the same question (useTypewriter relies on this to detect a new sentence)', () => {
    for (let i = 0; i < SCRIPT.length - 1; i += 1) {
      expect(SCRIPT[i].questionKey).not.toBe(SCRIPT[i + 1].questionKey)
    }
  })

  it('a full correct playthrough advances 7 times and wins on the 8th answer', () => {
    for (let step = 0; step < SCRIPT.length - 1; step += 1) {
      expect(answer(step, SCRIPT[step].expected)).toBe('advance')
    }
    expect(answer(7, SCRIPT[7].expected)).toBe('win')
  })

  it('a wrong answer loses immediately, at every one of the 8 positions', () => {
    SCRIPT.forEach((step, index) => {
      const wrongAnswer = step.expected === 'yes' ? 'no' : 'yes'
      expect(answer(index, wrongAnswer)).toBe('lose')
    })
  })

  it('an out-of-range step loses (defensive: never called by Level11.tsx, but must not throw)', () => {
    expect(answer(8, 'yes')).toBe('lose')
    expect(answer(-1, 'no')).toBe('lose')
  })
})
