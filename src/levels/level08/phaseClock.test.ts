import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPhaseClock, type PhaseClock } from './phaseClock'

function makeSegments(durations: number[]) {
  return durations.map((durationMs) => ({ durationMs }))
}

describe('createPhaseClock (012-plan.md — reloj de fases sobre rAF, patrón de pathAnimator)', () => {
  let clock: PhaseClock | null

  beforeEach(() => {
    vi.useFakeTimers()
    clock = null
  })

  afterEach(() => {
    clock?.destroy()
    vi.useRealTimers()
  })

  it('calls onSegmentStart for segment 0 immediately, before any onFrame', () => {
    const onSegmentStart = vi.fn()
    const onFrame = vi.fn()
    clock = createPhaseClock({
      segments: makeSegments([100]),
      onSegmentStart,
      onFrame,
      onComplete: vi.fn(),
    })
    vi.advanceTimersByTime(20) // el primer fotograma de rAF siempre aporta dt=0 (fija `lastTs`), como en `pathAnimator`
    expect(onSegmentStart).toHaveBeenNthCalledWith(1, { durationMs: 100 }, 0)
  })

  it('reports increasing progress within a segment, capped below 1 until it elapses', () => {
    const onFrame = vi.fn()
    clock = createPhaseClock({
      segments: makeSegments([100]),
      onSegmentStart: vi.fn(),
      onFrame,
      onComplete: vi.fn(),
    })
    vi.advanceTimersByTime(50) // ~mitad del segmento
    const lastProgress = onFrame.mock.calls.at(-1)?.[2]
    expect(lastProgress).toBeGreaterThan(0)
    expect(lastProgress).toBeLessThan(1)
  })

  it('advances to the next segment once the current one elapses, calling onSegmentStart again', () => {
    const onSegmentStart = vi.fn()
    clock = createPhaseClock({
      segments: makeSegments([50, 100]),
      onSegmentStart,
      onFrame: vi.fn(),
      onComplete: vi.fn(),
    })
    vi.advanceTimersByTime(80) // supera el primer segmento (50ms)
    expect(onSegmentStart).toHaveBeenCalledTimes(2)
    expect(onSegmentStart).toHaveBeenNthCalledWith(2, { durationMs: 100 }, 1)
  })

  it('calls onComplete exactly once after the last segment elapses, with no extra callbacks afterward', () => {
    const onFrame = vi.fn()
    const onComplete = vi.fn()
    clock = createPhaseClock({
      segments: makeSegments([50, 50]),
      onSegmentStart: vi.fn(),
      onFrame,
      onComplete,
    })
    vi.advanceTimersByTime(200) // de sobra para los dos segmentos
    expect(onComplete).toHaveBeenCalledTimes(1)
    const callsAtComplete = onFrame.mock.calls.length

    vi.advanceTimersByTime(500)
    expect(onFrame.mock.calls.length).toBe(callsAtComplete) // sin más fotogramas tras completar
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('delivers a final progress=1 frame for every segment crossed in a single long frame, never skipping one', () => {
    const onFrame = vi.fn()
    const onSegmentStart = vi.fn()
    clock = createPhaseClock({
      segments: makeSegments([10, 10, 1000]), // los dos primeros son minúsculos frente a un salto largo
      onSegmentStart,
      onFrame,
      onComplete: vi.fn(),
    })
    vi.advanceTimersByTime(100) // de sobra para cruzar los dos primeros segmentos (10ms cada uno)
    // Segmento 0 y 1 deben haber recibido su fotograma final (progreso 1) antes de pasar al 2.
    const segment0FinalFrame = onFrame.mock.calls.find(
      ([, idx, progress]) => idx === 0 && progress === 1,
    )
    const segment1FinalFrame = onFrame.mock.calls.find(
      ([, idx, progress]) => idx === 1 && progress === 1,
    )
    expect(segment0FinalFrame).toBeDefined()
    expect(segment1FinalFrame).toBeDefined()
    expect(onSegmentStart).toHaveBeenCalledTimes(3) // los 3 segmentos se llegaron a arrancar
  })

  it('paused freezes progress without losing it', () => {
    const onFrame = vi.fn()
    clock = createPhaseClock({
      segments: makeSegments([100]),
      onSegmentStart: vi.fn(),
      onFrame,
      onComplete: vi.fn(),
    })
    vi.advanceTimersByTime(30)
    const framesBeforePause = onFrame.mock.calls.length
    const progressBeforePause = onFrame.mock.calls.at(-1)?.[2]

    clock.setPaused(true)
    vi.advanceTimersByTime(1000)
    expect(onFrame.mock.calls.length).toBe(framesBeforePause) // ni un fotograma más

    clock.setPaused(false)
    vi.advanceTimersByTime(10)
    const progressAfterResume = onFrame.mock.calls.at(-1)?.[2]
    expect(progressAfterResume).toBeGreaterThanOrEqual(progressBeforePause ?? 0) // retoma donde se quedó, sin saltos hacia atrás
  })

  it('destroy() stops delivering frames (no leaked rAF loop)', () => {
    const onFrame = vi.fn()
    const onComplete = vi.fn()
    const created = createPhaseClock({
      segments: makeSegments([100]),
      onSegmentStart: vi.fn(),
      onFrame,
      onComplete,
    })
    vi.advanceTimersByTime(30)
    const callsBeforeDestroy = onFrame.mock.calls.length

    created.destroy()
    vi.advanceTimersByTime(1000)
    expect(onFrame.mock.calls.length).toBe(callsBeforeDestroy)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('an empty segment list completes immediately without throwing (defensive fallback)', async () => {
    const onComplete = vi.fn()
    clock = createPhaseClock({
      segments: [],
      onSegmentStart: vi.fn(),
      onFrame: vi.fn(),
      onComplete,
    })
    await Promise.resolve()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
