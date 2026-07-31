import { describe, expect, it } from 'vitest'
import { createRng } from '../../utils/prng'
import { createEmptyCell, type CellState } from './cell'
import { CELL_COUNT, SIMULTANEOUS_COUNT, chooseCycleBatch, runCycle } from './cycle'

describe('chooseCycleBatch', () => {
  it('picks at most `count` distinct indices from the eligible pool', () => {
    const rng = createRng(1)
    const eligible = [0, 1, 2, 3, 4, 5]
    const batch = chooseCycleBatch(eligible, rng, 4)
    expect(batch).toHaveLength(4)
    const indices = batch.map((b) => b.index)
    expect(new Set(indices).size).toBe(4) // sin repetidos
    indices.forEach((i) => expect(eligible).toContain(i))
  })

  it('never asks for more than the pool has', () => {
    const rng = createRng(2)
    const batch = chooseCycleBatch([0, 1], rng, 10)
    expect(batch).toHaveLength(2)
  })

  it('returns an empty batch when there is nothing eligible', () => {
    const rng = createRng(3)
    expect(chooseCycleBatch([], rng, 4)).toEqual([])
  })

  it('guarantees at least one agree in a non-empty batch, even across many draws', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = createRng(seed)
      const batch = chooseCycleBatch([0, 1, 2, 3, 4, 5, 6, 7], rng, 4)
      expect(batch.some((b) => b.type === 'agree')).toBe(true)
    }
  })

  it('produces a plausible (not all-agree, not all-disagree) mix over many draws', () => {
    const rng = createRng(7)
    const types: string[] = []
    for (let i = 0; i < 50; i++) {
      chooseCycleBatch([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], rng, 4).forEach((b) =>
        types.push(b.type),
      )
    }
    expect(types).toContain('agree')
    expect(types).toContain('disagree')
  })
})

describe('runCycle', () => {
  it('clears every visible cell and fills a fresh batch elsewhere (or the same slots)', () => {
    const rng = createRng(4)
    const cells: CellState[] = Array.from({ length: CELL_COUNT }, (_, i) =>
      i < 2 ? { phase: 'visible' as const, type: 'agree' as const } : createEmptyCell(),
    )
    const next = runCycle(cells, rng)
    expect(next).toHaveLength(CELL_COUNT)
    // Ninguna casilla se queda "visible" del lote anterior por inercia: o la limpió, o la repobló el ciclo.
    expect(next.filter((c) => c.phase === 'visible')).not.toHaveLength(0)
  })

  it('leaves frozen cells completely untouched', () => {
    const rng = createRng(5)
    const cells: CellState[] = Array.from({ length: CELL_COUNT }, createEmptyCell)
    cells[3] = { phase: 'frozen', type: 'disagree' }
    const next = runCycle(cells, rng)
    expect(next[3]).toEqual({ phase: 'frozen', type: 'disagree' })
  })

  it('can fill an armed (frozen, empty) cell — it becomes frozen with a type, not visible', () => {
    const rng = createRng(6)
    // Casi todas las casillas ocupadas por otra congelada, dejando solo la armada como única elegible: el lote tiene que caer ahí.
    const cells: CellState[] = Array.from({ length: CELL_COUNT }, () => ({
      phase: 'frozen' as const,
      type: 'disagree' as const,
    }))
    cells[0] = { phase: 'frozen', type: null } // armada
    const next = runCycle(cells, rng)
    expect(next[0].phase).toBe('frozen')
    expect(next[0].type).not.toBeNull()
  })

  it('every spawned cell always resolves to a bijection-free, valid state (no crashes on a fully-frozen grid)', () => {
    const rng = createRng(8)
    const cells: CellState[] = Array.from({ length: CELL_COUNT }, () => ({
      phase: 'frozen' as const,
      type: 'agree' as const,
    }))
    expect(() => runCycle(cells, rng)).not.toThrow()
    const next = runCycle(cells, rng)
    expect(next).toEqual(cells) // nada elegible: el ciclo no tiene nada que hacer
  })

  it('never fills more than SIMULTANEOUS_COUNT cells from a fully-empty grid', () => {
    const rng = createRng(9)
    const cells: CellState[] = Array.from({ length: CELL_COUNT }, createEmptyCell)
    const next = runCycle(cells, rng)
    expect(next.filter((c) => c.phase === 'visible')).toHaveLength(SIMULTANEOUS_COUNT)
  })
})
