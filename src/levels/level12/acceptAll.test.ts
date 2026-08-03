import { describe, expect, it } from 'vitest'
import {
  clickAcceptAll,
  createAcceptAllState,
  createSwitchAt,
  DECAY_AMOUNT,
  DECAY_INTERVAL_MS,
  RESTORE_MS,
  SWITCH_AT_MAX,
  SWITCH_AT_MIN,
  TEASE_CEILING,
  tickAcceptAll,
  type AcceptAllState,
} from './acceptAll'

describe('createSwitchAt (GDD Nivel 12 — 016-plan.md)', () => {
  it('always falls within [15, 35]', () => {
    for (let seed = 0; seed < 500; seed++) {
      const switchAt = createSwitchAt(seed)
      expect(switchAt).toBeGreaterThanOrEqual(SWITCH_AT_MIN)
      expect(switchAt).toBeLessThanOrEqual(SWITCH_AT_MAX)
    }
  })

  it('is deterministic for a given seed', () => {
    expect(createSwitchAt(42)).toBe(createSwitchAt(42))
  })

  it('is not the same constant value for every seed (real spread, not a bug that collapsed the range)', () => {
    // Semillas pequeñas y consecutivas arrancan xorshift32 casi sin mezclar
    // (mismo caso que `windows.test.ts`/010 y `shuffle.test.ts`/008): un hash
    // multiplicativo las dispersa por los 32 bits antes de sembrar, igual
    // que en juego real (`Math.floor(Math.random() * 0xffffffff)`).
    const values = new Set(
      Array.from({ length: 50 }, (_, i) => createSwitchAt(Math.imul(i + 1, 2654435761) >>> 0)),
    )
    expect(values.size).toBeGreaterThan(1)
  })
})

describe('clickAcceptAll — clicking through "agree" (016-plan.md)', () => {
  it('each click raises progress by CLICK_INCREMENT and stays in "agree" before switchAt', () => {
    let state = createAcceptAllState(10)
    const { state: next, outcome } = clickAcceptAll(state)
    expect(outcome).toBe('progress')
    expect(next.progress).toBeGreaterThan(state.progress)
    expect(next.phase).toBe('agree')
    expect(next.clicks).toBe(1)
    state = next
  })

  it('a long click series never reaches 100% — the bar is pure theater (test with an unreachable switchAt)', () => {
    let state = createAcceptAllState(Number.MAX_SAFE_INTEGER) // switchAt nunca llega: solo mide el techo del progreso
    for (let i = 0; i < 1000; i++) {
      state = clickAcceptAll(state).state
    }
    expect(state.progress).toBeLessThan(100)
    expect(state.progress).toBeLessThanOrEqual(TEASE_CEILING)
  })

  it('flips to "trap" exactly on the switchAt-th click, and that click itself is still "progress" (016-plan.md, "Decisiones")', () => {
    const switchAt = 5
    let state = createAcceptAllState(switchAt)
    let lastOutcome: string = ''
    for (let i = 0; i < switchAt; i++) {
      const result = clickAcceptAll(state)
      state = result.state
      lastOutcome = result.outcome
    }
    expect(state.clicks).toBe(switchAt)
    expect(state.phase).toBe('trap')
    expect(lastOutcome).toBe('progress') // la pulsación que dispara la trampa NO es derrota
  })

  it('the click right after switchAt (switchAt + 1) loses — it lands on the already-red button', () => {
    const switchAt = 7
    let state = createAcceptAllState(switchAt)
    for (let i = 0; i < switchAt; i++) {
      state = clickAcceptAll(state).state
    }
    const { outcome } = clickAcceptAll(state)
    expect(outcome).toBe('lose')
  })

  it('works identically at both ends of the [15, 35] range', () => {
    for (const switchAt of [SWITCH_AT_MIN, SWITCH_AT_MAX]) {
      let state = createAcceptAllState(switchAt)
      for (let i = 0; i < switchAt; i++) {
        state = clickAcceptAll(state).state
      }
      expect(state.phase).toBe('trap')
      expect(clickAcceptAll(state).outcome).toBe('lose')
    }
  })
})

describe('tickAcceptAll — decay (016-plan.md)', () => {
  it('decays by DECAY_AMOUNT for every whole DECAY_INTERVAL_MS elapsed without a click', () => {
    let state: AcceptAllState = { ...createAcceptAllState(20), progress: 50 }
    state = tickAcceptAll(state, DECAY_INTERVAL_MS)
    expect(state.progress).toBe(50 - DECAY_AMOUNT)
  })

  it('applies multiple decay steps in one tick (a long paused/backgrounded frame)', () => {
    let state: AcceptAllState = { ...createAcceptAllState(20), progress: 50 }
    state = tickAcceptAll(state, DECAY_INTERVAL_MS * 3)
    expect(state.progress).toBe(50 - DECAY_AMOUNT * 3)
  })

  it('never decays below 0', () => {
    let state: AcceptAllState = { ...createAcceptAllState(20), progress: 0.5 }
    state = tickAcceptAll(state, DECAY_INTERVAL_MS * 10)
    expect(state.progress).toBe(0)
  })

  it('a click resets sinceLastClick, so decay only resumes counting from the click', () => {
    let state = createAcceptAllState(20)
    state = tickAcceptAll(state, DECAY_INTERVAL_MS - 1) // a punto de decaer
    state = clickAcceptAll(state).state // resetea sinceLastClick
    state = tickAcceptAll(state, 1) // el ms que faltaba, de no resetear, decaería
    expect(state.sinceLastClick).toBe(1)
  })

  it('many small ticks (real rAF deltas, ~16ms) decay exactly like one big tick — regression: sinceLastClick must not be reduced mod DECAY_INTERVAL_MS between ticks, or it can never reach RESTORE_MS either', () => {
    let bigTick: AcceptAllState = { ...createAcceptAllState(20), progress: 50 }
    bigTick = tickAcceptAll(bigTick, DECAY_INTERVAL_MS * 4) // 2000ms de una vez

    let manySmallTicks: AcceptAllState = { ...createAcceptAllState(20), progress: 50 }
    for (let i = 0; i < 125; i++) {
      manySmallTicks = tickAcceptAll(manySmallTicks, 16) // 125 × 16ms ≈ 2000ms, como un rAF real
    }

    expect(manySmallTicks.progress).toBe(bigTick.progress)
    expect(manySmallTicks.sinceLastClick).toBeCloseTo(bigTick.sinceLastClick, 0)
  })
})

describe('tickAcceptAll — restoring from "trap" (016-plan.md)', () => {
  function trappedState(switchAt: number): AcceptAllState {
    let state = createAcceptAllState(switchAt)
    for (let i = 0; i < switchAt; i++) state = clickAcceptAll(state).state
    return state
  }

  it('stays "trap" just before RESTORE_MS', () => {
    let state = trappedState(10)
    state = tickAcceptAll(state, RESTORE_MS - 1)
    expect(state.phase).toBe('trap')
  })

  it('flips to "restored" exactly at RESTORE_MS — the boundary click loses just before, wins at/after', () => {
    const state = trappedState(10)
    // Justo antes: sigue en trap, pulsar pierde.
    const before = tickAcceptAll(state, RESTORE_MS - 1)
    expect(clickAcceptAll(before).outcome).toBe('lose')

    // En el límite exacto: ya restaurado, pulsar gana.
    const atLimit = tickAcceptAll(state, RESTORE_MS)
    expect(atLimit.phase).toBe('restored')
    expect(clickAcceptAll(atLimit).outcome).toBe('win')
  })

  it('restores after many small ticks totalling RESTORE_MS, same as one big tick (regression, a real rAF loop never sends one 2000ms tick)', () => {
    let state = trappedState(10)
    for (let i = 0; i < 130; i++) {
      state = tickAcceptAll(state, 16) // 130 × 16ms ≈ 2080ms > RESTORE_MS
    }
    expect(state.phase).toBe('restored')
  })

  it('continues decaying while in "trap", waiting to restore (tension, not mechanics, per GDD)', () => {
    let state = trappedState(10)
    const before = state.progress
    state = tickAcceptAll(state, DECAY_INTERVAL_MS)
    expect(state.progress).toBeLessThan(before)
    expect(state.phase).toBe('trap')
  })

  it('clicking in "restored" completes the bar to 100 and wins', () => {
    let state = trappedState(10)
    state = tickAcceptAll(state, RESTORE_MS)
    const { state: next, outcome } = clickAcceptAll(state)
    expect(outcome).toBe('win')
    expect(next.progress).toBe(100)
  })

  it('a failed click while still trapped resets the 2s timer (sinceLastClick back to 0)', () => {
    let state = trappedState(10)
    state = tickAcceptAll(state, RESTORE_MS - 100) // casi restaurado
    const { state: next } = clickAcceptAll(state) // pulsación fallida: reinicia el temporizador
    expect(next.sinceLastClick).toBe(0)
    expect(next.phase).toBe('trap')
  })
})
