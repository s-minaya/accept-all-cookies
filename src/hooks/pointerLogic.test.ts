import { describe, expect, it } from 'vitest'
import { classifyGesture, isStill, updateStillness } from './pointerLogic'

describe('classifyGesture', () => {
  it('classifies movement at or under the threshold as a tap', () => {
    expect(classifyGesture({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe('tap')
    expect(classifyGesture({ x: 0, y: 0 }, { x: 8, y: 0 })).toBe('tap')
  })

  it('classifies movement past the threshold as a drag', () => {
    expect(classifyGesture({ x: 0, y: 0 }, { x: 8.01, y: 0 })).toBe('drag')
    expect(classifyGesture({ x: 0, y: 0 }, { x: 6, y: 6 })).toBe('drag')
  })

  it('respects a custom threshold', () => {
    expect(classifyGesture({ x: 0, y: 0 }, { x: 20, y: 0 }, 30)).toBe('tap')
    expect(classifyGesture({ x: 0, y: 0 }, { x: 20, y: 0 }, 10)).toBe('drag')
  })

  it('works identically regardless of input source (mouse vs touch produce the same points)', () => {
    const mouseGesture = classifyGesture({ x: 10, y: 10 }, { x: 12, y: 11 })
    const touchGesture = classifyGesture({ x: 10, y: 10 }, { x: 12, y: 11 })
    expect(mouseGesture).toBe(touchGesture)
  })
})

describe('updateStillness / isStill', () => {
  it('starts a new stillness anchor on the first sample', () => {
    const state = updateStillness(null, { x: 5, y: 5 }, 1000)
    expect(state).toEqual({ anchor: { x: 5, y: 5 }, since: 1000 })
  })

  it('keeps the same anchor and since while jitter stays within threshold', () => {
    const first = updateStillness(null, { x: 5, y: 5 }, 1000)
    const second = updateStillness(first, { x: 8, y: 6 }, 1200)
    expect(second).toBe(first)
  })

  it('resets the anchor once movement exceeds the jitter threshold', () => {
    const first = updateStillness(null, { x: 5, y: 5 }, 1000)
    const second = updateStillness(first, { x: 50, y: 50 }, 1200)
    expect(second).toEqual({ anchor: { x: 50, y: 50 }, since: 1200 })
  })

  it('reports not still before the configured duration has elapsed', () => {
    const state = updateStillness(null, { x: 0, y: 0 }, 0)
    expect(isStill(state, 500, 1000)).toBe(false)
  })

  it('reports still once the configured duration has elapsed', () => {
    const state = updateStillness(null, { x: 0, y: 0 }, 0)
    expect(isStill(state, 1000, 1000)).toBe(true)
  })

  it('reports not still when there is no state yet', () => {
    expect(isStill(null, 1000, 1000)).toBe(false)
  })
})
