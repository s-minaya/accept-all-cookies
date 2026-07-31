import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGridClock, type GridClock } from './clock'

describe('createGridClock (013-plan.md — un único reloj sobre rAF para las 12 casillas)', () => {
  let clock: GridClock | null

  beforeEach(() => {
    vi.useFakeTimers()
    clock = null
  })

  afterEach(() => {
    clock?.destroy()
    vi.useRealTimers()
  })

  it('calls onTick with the elapsed delta on each unpaused frame', () => {
    const onTick = vi.fn()
    clock = createGridClock({ onTick })
    vi.advanceTimersByTime(100)
    expect(onTick).toHaveBeenCalled()
    // Primer fotograma siempre aporta dt=0 (fija el reloj interno) — todas las llamadas posteriores deben ser >0.
    const deltas = onTick.mock.calls.map(([dt]) => dt)
    expect(deltas.some((dt) => dt > 0)).toBe(true)
  })

  it('paused stops calling onTick entirely', () => {
    const onTick = vi.fn()
    clock = createGridClock({ onTick })
    vi.advanceTimersByTime(50)
    const callsBeforePause = onTick.mock.calls.length

    clock.setPaused(true)
    vi.advanceTimersByTime(1000)
    expect(onTick.mock.calls.length).toBe(callsBeforePause)

    clock.setPaused(false)
    vi.advanceTimersByTime(50)
    expect(onTick.mock.calls.length).toBeGreaterThan(callsBeforePause)
  })

  it('destroy() stops the rAF loop for good (no leaks)', () => {
    const onTick = vi.fn()
    const created = createGridClock({ onTick })
    vi.advanceTimersByTime(50)
    const callsBeforeDestroy = onTick.mock.calls.length

    created.destroy()
    vi.advanceTimersByTime(1000)
    expect(onTick.mock.calls.length).toBe(callsBeforeDestroy)
  })

  it('resuming after a pause does not deliver a huge catch-up delta (the paused interval is not counted)', () => {
    const onTick = vi.fn()
    clock = createGridClock({ onTick })
    vi.advanceTimersByTime(20)
    clock.setPaused(true)
    vi.advanceTimersByTime(5000) // tiempo real transcurrido en pausa
    clock.setPaused(false)
    vi.advanceTimersByTime(20)
    const deltas = onTick.mock.calls.map(([dt]) => dt)
    expect(Math.max(...deltas)).toBeLessThan(1000) // ningún delta refleja los 5s de pausa
  })
})
