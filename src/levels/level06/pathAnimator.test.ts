import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPathAnimator, type PathAnimator } from './pathAnimator'
import type { Cell } from './boardLogic'

function makePath(length: number): Cell[] {
  return Array.from({ length }, (_, i) => ({ row: 0, col: i }))
}

describe('createPathAnimator (010-plan.md — reproducción del camino precalculado)', () => {
  let animator: PathAnimator | null

  beforeEach(() => {
    vi.useFakeTimers()
    animator = null
  })

  afterEach(() => {
    animator?.destroy()
    vi.useRealTimers()
  })

  it('delivers each cell in order at the configured rate', () => {
    const onStep = vi.fn()
    const onComplete = vi.fn()
    animator = createPathAnimator({ camino: makePath(5), cellsPerSecond: 10, onStep, onComplete })

    vi.advanceTimersByTime(250) // 10 casillas/s = 100ms/casilla → 2.5 casillas
    expect(onStep).toHaveBeenCalledTimes(2)
    expect(onStep).toHaveBeenNthCalledWith(1, { row: 0, col: 0 })
    expect(onStep).toHaveBeenNthCalledWith(2, { row: 0, col: 1 })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('calls onComplete exactly once after the full path is delivered, with no extra onStep calls afterward', () => {
    const onStep = vi.fn()
    const onComplete = vi.fn()
    animator = createPathAnimator({ camino: makePath(3), cellsPerSecond: 10, onStep, onComplete })

    vi.advanceTimersByTime(1000) // de sobra para las 3 casillas (300ms)
    expect(onStep).toHaveBeenCalledTimes(3)
    expect(onComplete).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1000)
    expect(onStep).toHaveBeenCalledTimes(3) // sin más pasos tras completar
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('catches up all due steps within a single long frame (background tab / dispositivo lento) instead of skipping any', () => {
    const onStep = vi.fn()
    const onComplete = vi.fn()
    animator = createPathAnimator({ camino: makePath(20), cellsPerSecond: 10, onStep, onComplete })

    vi.advanceTimersByTime(550) // un único salto largo: 5.5 casillas de golpe
    expect(onStep).toHaveBeenCalledTimes(5)
  })

  it('paused freezes progress without losing it', () => {
    const onStep = vi.fn()
    const onComplete = vi.fn()
    animator = createPathAnimator({ camino: makePath(5), cellsPerSecond: 10, onStep, onComplete })

    vi.advanceTimersByTime(150) // 1 casilla entregada
    expect(onStep).toHaveBeenCalledTimes(1)

    animator.setPaused(true)
    vi.advanceTimersByTime(1000)
    expect(onStep).toHaveBeenCalledTimes(1) // congelado de verdad

    animator.setPaused(false)
    vi.advanceTimersByTime(150)
    expect(onStep).toHaveBeenCalledTimes(2) // sigue donde se quedó
  })

  it('destroy() stops delivering steps (no leaked rAF loop)', () => {
    const onStep = vi.fn()
    const onComplete = vi.fn()
    const created = createPathAnimator({
      camino: makePath(5),
      cellsPerSecond: 10,
      onStep,
      onComplete,
    })

    vi.advanceTimersByTime(150) // 100ms/casilla + margen: el primer fotograma de rAF siempre aporta dt=0 (fija `lastTs`), así que el reloj efectivo empieza a correr un poco más tarde de lo esperado — margen intencional, no un umbral exacto.
    expect(onStep).toHaveBeenCalledTimes(1)

    created.destroy()
    vi.advanceTimersByTime(1000)
    expect(onStep).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('an empty camino completes immediately without throwing (defensive fallback)', async () => {
    const onStep = vi.fn()
    const onComplete = vi.fn()
    animator = createPathAnimator({ camino: [], cellsPerSecond: 10, onStep, onComplete })

    await Promise.resolve() // deja correr el microtask de finalización inmediata
    expect(onStep).not.toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
