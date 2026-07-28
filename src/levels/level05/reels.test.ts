import { describe, expect, it } from 'vitest'
import { createRng } from '../../utils/prng'
import { generateReel, REEL_AGREE_RATIO, REEL_LENGTH } from './reels'

describe('generateReel (GDD Nivel 5 — tira cíclica de la tragaperras, 009-plan.md)', () => {
  it('generates REEL_LENGTH symbols by default', () => {
    const reel = generateReel(createRng(1))
    expect(reel.length).toBe(REEL_LENGTH)
  })

  it('respects a custom length', () => {
    const reel = generateReel(createRng(1), 20)
    expect(reel.length).toBe(20)
  })

  it('is deterministic for the same seed', () => {
    const reelA = generateReel(createRng(555))
    const reelB = generateReel(createRng(555))
    expect(reelA).toEqual(reelB)
  })

  it('splits Agree/Disagree ~REEL_AGREE_RATIO over a large sample of independent reels', () => {
    expect(REEL_AGREE_RATIO).toBe(0.4)
    const rng = createRng(1234)
    const SAMPLE_REELS = 500
    let agreeCount = 0
    let total = 0

    for (let i = 0; i < SAMPLE_REELS; i++) {
      for (const symbol of generateReel(rng)) {
        total++
        if (symbol === 'agree') agreeCount++
      }
    }

    const ratio = agreeCount / total
    expect(ratio).toBeGreaterThan(0.35)
    expect(ratio).toBeLessThan(0.45)
  })

  it('repairs an all-Agree reel so it always has at least one Disagree', () => {
    const alwaysAgreeRng = () => 0 // < cualquier ratio > 0 → siempre 'agree'
    const reel = generateReel(alwaysAgreeRng)
    expect(reel).toContain('agree')
    expect(reel).toContain('disagree')
  })

  it('repairs an all-Disagree reel so it always has at least one Agree', () => {
    const alwaysDisagreeRng = () => 0.99 // >= REEL_AGREE_RATIO → siempre 'disagree'
    const reel = generateReel(alwaysDisagreeRng)
    expect(reel).toContain('agree')
    expect(reel).toContain('disagree')
  })

  it('never produces a degenerate reel across many different seeds', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const reel = generateReel(createRng(seed))
      expect(reel).toContain('agree')
      expect(reel).toContain('disagree')
    }
  })
})
