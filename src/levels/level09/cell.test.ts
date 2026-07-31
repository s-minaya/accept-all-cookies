import { describe, expect, it } from 'vitest'
import {
  clear,
  createEmptyCell,
  freeze,
  isEligibleForSpawn,
  spawn,
  unfreeze,
  type CellState,
} from './cell'

describe('createEmptyCell', () => {
  it('starts empty with no type', () => {
    expect(createEmptyCell()).toEqual({ phase: 'empty', type: null })
  })
})

describe('spawn', () => {
  it('makes an empty cell visible with the given type', () => {
    expect(spawn(createEmptyCell(), 'agree')).toEqual({ phase: 'visible', type: 'agree' })
  })

  it('captures the entering button as already frozen when the cell was armed (frozen + empty)', () => {
    const armed: CellState = { phase: 'frozen', type: null }
    expect(spawn(armed, 'disagree')).toEqual({ phase: 'frozen', type: 'disagree' })
  })

  it('is a no-op on an already-occupied cell (visible, or frozen with a button)', () => {
    const visible: CellState = { phase: 'visible', type: 'agree' }
    const frozenWithButton: CellState = { phase: 'frozen', type: 'disagree' }
    expect(spawn(visible, 'disagree')).toEqual(visible)
    expect(spawn(frozenWithButton, 'agree')).toEqual(frozenWithButton)
  })
})

describe('clear', () => {
  it('empties a visible cell', () => {
    const visible: CellState = { phase: 'visible', type: 'agree' }
    expect(clear(visible)).toEqual(createEmptyCell())
  })

  it('leaves frozen and empty cells untouched', () => {
    const frozen: CellState = { phase: 'frozen', type: 'disagree' }
    const empty = createEmptyCell()
    expect(clear(frozen)).toEqual(frozen)
    expect(clear(empty)).toEqual(empty)
  })
})

describe('freeze', () => {
  it('freezes a visible button, keeping its type', () => {
    const visible: CellState = { phase: 'visible', type: 'disagree' }
    expect(freeze(visible)).toEqual({ phase: 'frozen', type: 'disagree' })
  })

  it('arms an empty cell (frozen, no type yet) instead of leaving it untouched', () => {
    expect(freeze(createEmptyCell())).toEqual({ phase: 'frozen', type: null })
  })

  it('is idempotent on an already-frozen cell', () => {
    const frozen: CellState = { phase: 'frozen', type: 'agree' }
    expect(freeze(frozen)).toBe(frozen)
  })
})

describe('unfreeze', () => {
  it('resumes a frozen button as visible again', () => {
    const frozen: CellState = { phase: 'frozen', type: 'agree' }
    expect(unfreeze(frozen)).toEqual({ phase: 'visible', type: 'agree' })
  })

  it('un-arms an empty-armed cell back to plain empty', () => {
    const armed: CellState = { phase: 'frozen', type: null }
    expect(unfreeze(armed)).toEqual(createEmptyCell())
  })

  it('is a no-op on cells that are not frozen', () => {
    const visible: CellState = { phase: 'visible', type: 'agree' }
    const empty = createEmptyCell()
    expect(unfreeze(visible)).toBe(visible)
    expect(unfreeze(empty)).toBe(empty)
  })
})

describe('isEligibleForSpawn', () => {
  it('is true for empty and armed-frozen cells', () => {
    expect(isEligibleForSpawn(createEmptyCell())).toBe(true)
    expect(isEligibleForSpawn({ phase: 'frozen', type: null })).toBe(true)
  })

  it('is false for visible cells and frozen cells holding a button', () => {
    expect(isEligibleForSpawn({ phase: 'visible', type: 'agree' })).toBe(false)
    expect(isEligibleForSpawn({ phase: 'frozen', type: 'disagree' })).toBe(false)
  })
})
