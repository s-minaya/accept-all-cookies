import { describe, expect, it } from 'vitest'
import { createRng } from '../../utils/prng'
import { applySwaps, CELL_COUNT, createShuffleScript, ROUND_DURATIONS_MS } from './shuffle'

function isPermutationOf12(arr: readonly number[]): boolean {
  const sorted = [...arr].sort((a, b) => a - b)
  return sorted.length === CELL_COUNT && sorted.every((v, i) => v === i)
}

describe('createShuffleScript (012-plan.md — guion precalculado del trilero)', () => {
  it('produces a bijection: applying every round of swaps to the identity map yields a permutation of 0-11', () => {
    const script = createShuffleScript(createRng(1))
    let buttonAtCell = Array.from({ length: CELL_COUNT }, (_, i) => i)
    for (const round of script.rounds) {
      buttonAtCell = applySwaps(buttonAtCell, round.swaps)
    }
    expect(isPermutationOf12(buttonAtCell)).toBe(true)
  })

  it('finalAgreeCell traces the original Agree button through all 3 rounds correctly', () => {
    const script = createShuffleScript(createRng(42))
    let buttonAtCell = Array.from({ length: CELL_COUNT }, (_, i) => i)
    for (const round of script.rounds) {
      buttonAtCell = applySwaps(buttonAtCell, round.swaps)
    }
    expect(buttonAtCell[script.finalAgreeCell]).toBe(script.agreeIndex)
  })

  it('has exactly 3 rounds with the documented durations (GDD §14)', () => {
    const script = createShuffleScript(createRng(7))
    expect(script.rounds.map((r) => r.durationMs)).toEqual(ROUND_DURATIONS_MS)
  })

  it('the same seed produces the exact same script (reproducibility)', () => {
    const a = createShuffleScript(createRng(123))
    const b = createShuffleScript(createRng(123))
    expect(a).toEqual(b)
  })

  it('different seeds produce a spread of initial Agree positions (dispersion)', () => {
    const positions = new Set<number>()
    for (let i = 1; i <= 40; i++) {
      // Semillas pequeñas y consecutivas (1, 2, 3…) arrancan xorshift32 con
      // un estado casi sin mezclar y su primer `next()` sale muy próximo a
      // 0 para todas — un hash multiplicativo (constante de Knuth) las
      // dispersa por todo el rango de 32 bits antes de sembrar, igual que en
      // juego real (`Math.floor(Math.random() * 0xffffffff)`, nunca un
      // contador pequeño).
      const seed = Math.imul(i, 2654435761) >>> 0
      positions.add(createShuffleScript(createRng(seed)).agreeIndex)
    }
    // 40 semillas distintas sobre 12 celdas: si el reparto fuera razonable
    // debería tocar bastantes más de 1-2 casillas — no exige uniformidad
    // exacta, solo que no colapse siempre en el mismo sitio.
    expect(positions.size).toBeGreaterThan(6)
  })

  it('agreeIndex is always a valid cell (0-11)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { agreeIndex } = createShuffleScript(createRng(seed))
      expect(agreeIndex).toBeGreaterThanOrEqual(0)
      expect(agreeIndex).toBeLessThan(CELL_COUNT)
    }
  })

  it('every swap pair is disjoint within itself (a swap never targets the same cell twice)', () => {
    const script = createShuffleScript(createRng(9))
    for (const round of script.rounds) {
      for (const [a, b] of round.swaps) {
        expect(a).not.toBe(b)
      }
    }
  })
})

describe('applySwaps', () => {
  it('swaps the contents of the two cells for each pair, in order', () => {
    const identity = [0, 1, 2, 3]
    const result = applySwaps(identity, [
      [0, 1],
      [1, 2],
    ])
    // (0,1): [1,0,2,3] → (1,2): [1,2,0,3]
    expect(result).toEqual([1, 2, 0, 3])
  })

  it('is pure: never mutates the input array', () => {
    const identity = [0, 1, 2, 3]
    applySwaps(identity, [[0, 1]])
    expect(identity).toEqual([0, 1, 2, 3])
  })

  it('an empty swap list leaves the map unchanged', () => {
    const identity = [0, 1, 2, 3]
    expect(applySwaps(identity, [])).toEqual(identity)
  })
})
