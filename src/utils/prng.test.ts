import { describe, expect, it } from 'vitest'
import { createRng } from './prng'

describe('createRng (xorshift32 con semilla, compartido por los niveles 4 y 5)', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)

    const sequenceA = Array.from({ length: 20 }, () => a())
    const sequenceB = Array.from({ length: 20 }, () => b())

    expect(sequenceA).toEqual(sequenceB)
  })

  it('produces a different sequence for a different seed', () => {
    const a = createRng(1)
    const b = createRng(2)

    const sequenceA = Array.from({ length: 10 }, () => a())
    const sequenceB = Array.from({ length: 10 }, () => b())

    expect(sequenceA).not.toEqual(sequenceB)
  })

  it('every value stays within [0, 1)', () => {
    const rng = createRng(7)
    for (let i = 0; i < 500; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('a seed of 0 does not get stuck (state normalized to a non-zero value)', () => {
    const rng = createRng(0)
    const values = Array.from({ length: 20 }, () => rng())
    expect(new Set(values).size).toBeGreaterThan(1)
  })
})
