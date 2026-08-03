import { describe, expect, it } from 'vitest'
import {
  createTypewriterState,
  isTypewriterDone,
  isTypewriterUnlocked,
  skipTypewriter,
  tickTypewriter,
  visibleCharCount,
} from './typewriter'

describe('typewriter (015-plan.md, "reloj rAF de la casa")', () => {
  it('starts with nothing written and not done', () => {
    const state = createTypewriterState()
    expect(state.elapsedMs).toBe(0)
    expect(isTypewriterDone(state)).toBe(false)
  })

  it('advances elapsedMs on each tick while writing', () => {
    let state = createTypewriterState()
    state = tickTypewriter(state, 10, 100)
    expect(state.elapsedMs).toBe(10)
    expect(isTypewriterDone(state)).toBe(false)
  })

  it('clamps elapsedMs at totalMs and flips to done exactly when it reaches it', () => {
    let state = createTypewriterState()
    state = tickTypewriter(state, 150, 100)
    expect(state.elapsedMs).toBe(100)
    expect(isTypewriterDone(state)).toBe(true)
    expect(state.sinceDoneMs).toBe(0)
  })

  it('keeps advancing sinceDoneMs on every tick after done, elapsedMs frozen', () => {
    let state = createTypewriterState()
    state = tickTypewriter(state, 100, 100)
    state = tickTypewriter(state, 50, 100)
    state = tickTypewriter(state, 30, 100)
    expect(state.elapsedMs).toBe(100)
    expect(state.sinceDoneMs).toBe(80)
  })

  it('skipTypewriter jumps straight to done, as if the clock had reached the end', () => {
    const state = skipTypewriter(100)
    expect(state.elapsedMs).toBe(100)
    expect(isTypewriterDone(state)).toBe(true)
    expect(state.sinceDoneMs).toBe(0)
  })

  it('visibleCharCount maps elapsed time to a clamped character count', () => {
    const state = { elapsedMs: 55, sinceDoneMs: -1 }
    expect(visibleCharCount(state, 25, 10)).toBe(2) // floor(55/25) = 2
    expect(visibleCharCount({ elapsedMs: 1000, sinceDoneMs: 0 }, 25, 10)).toBe(10) // saturado a textLength
  })

  it('isTypewriterUnlocked requires both done and the unlock margin elapsed', () => {
    const writing = tickTypewriter(createTypewriterState(), 50, 100)
    expect(isTypewriterUnlocked(writing, 200)).toBe(false)

    let done = tickTypewriter(createTypewriterState(), 100, 100)
    expect(isTypewriterUnlocked(done, 200)).toBe(false) // done pero sin margen aún

    done = tickTypewriter(done, 200, 100)
    expect(isTypewriterUnlocked(done, 200)).toBe(true)
  })
})
