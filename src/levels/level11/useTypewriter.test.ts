import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { audioManager } from '../../audio/AudioManager'
import { ANSWER_UNLOCK_MS, MS_PER_CHARACTER, useTypewriter } from './useTypewriter'

// El primer fotograma de cada reloj rAF siempre aporta dt=0 (fija el reloj
// interno, mismo comportamiento que `clock.ts`/013-plan.md), así que avanzar
// EXACTAMENTE el tiempo nominal se queda corto por un fotograma. Un margen
// pequeño pero mayor que un fotograma evita acoplar el test a cuántos ms
// exactos dura un fotograma simulado por los fake timers de Vitest, sin ser
// tan grande como para invadir el margen de desbloqueo que se prueba aparte.
const FRAME_SLACK_MS = 80

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  )
}

describe('useTypewriter (015-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('starts with nothing visible and not done', () => {
    const { result } = renderHook(() => useTypewriter('Hi', false))
    expect(result.current.visibleText).toBe('')
    expect(result.current.done).toBe(false)
    expect(result.current.unlocked).toBe(false)
  })

  it('reveals characters over time and becomes done once the full text is written', () => {
    const text = 'A somewhat longer sentence'
    const { result } = renderHook(() => useTypewriter(text, false))

    act(() => {
      vi.advanceTimersByTime(3 * MS_PER_CHARACTER)
    })
    expect(result.current.visibleText.length).toBeGreaterThanOrEqual(1)
    expect(result.current.visibleText.length).toBeLessThan(text.length)
    expect(result.current.done).toBe(false)

    act(() => {
      vi.advanceTimersByTime(text.length * MS_PER_CHARACTER + FRAME_SLACK_MS)
    })
    expect(result.current.visibleText).toBe(text)
    expect(result.current.done).toBe(true)
  })

  it('unlocks only after the answer-unlock margin has passed since finishing', () => {
    const text = 'Hi'
    const { result } = renderHook(() => useTypewriter(text, false))

    act(() => {
      vi.advanceTimersByTime(text.length * MS_PER_CHARACTER + FRAME_SLACK_MS)
    })
    expect(result.current.done).toBe(true)
    expect(result.current.unlocked).toBe(false)

    act(() => {
      vi.advanceTimersByTime(ANSWER_UNLOCK_MS + FRAME_SLACK_MS)
    })
    expect(result.current.unlocked).toBe(true)
  })

  it('skip() completes the text immediately, without waiting for the clock', () => {
    const { result } = renderHook(() => useTypewriter('A much longer sentence', false))

    act(() => {
      result.current.skip()
    })
    expect(result.current.done).toBe(true)
    expect(result.current.visibleText).toBe('A much longer sentence')
  })

  it('paused freezes progress: no characters reveal while paused', () => {
    const { result, rerender } = renderHook(({ paused }) => useTypewriter('Hello there', paused), {
      initialProps: { paused: false },
    })

    act(() => {
      vi.advanceTimersByTime(3 * MS_PER_CHARACTER)
    })
    const revealedBeforePause = result.current.visibleText

    rerender({ paused: true })
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.visibleText).toBe(revealedBeforePause)

    rerender({ paused: false })
    act(() => {
      vi.advanceTimersByTime(3 * MS_PER_CHARACTER)
    })
    expect(result.current.visibleText.length).toBeGreaterThan(revealedBeforePause.length)
  })

  it('starts the voice loop and ducks the music when a new sentence begins (not paused)', () => {
    const startVoiceLoop = vi.spyOn(audioManager, 'startVoiceLoop')
    const duckMusic = vi.spyOn(audioManager, 'duckMusic')
    renderHook(() => useTypewriter('Hi', false))
    expect(startVoiceLoop).toHaveBeenCalled()
    expect(duckMusic).toHaveBeenCalled()
  })

  it('does not start the voice while mounted paused', () => {
    const startVoiceLoop = vi.spyOn(audioManager, 'startVoiceLoop')
    renderHook(() => useTypewriter('Hi', true))
    expect(startVoiceLoop).not.toHaveBeenCalled()
  })

  it('stops the voice and unducks the music exactly when the sentence finishes writing', () => {
    const stopVoiceLoop = vi.spyOn(audioManager, 'stopVoiceLoop')
    const unduckMusic = vi.spyOn(audioManager, 'unduckMusic')
    const text = 'Hi'
    const { result } = renderHook(() => useTypewriter(text, false))

    expect(stopVoiceLoop).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(text.length * MS_PER_CHARACTER + FRAME_SLACK_MS)
    })
    expect(result.current.done).toBe(true)
    expect(stopVoiceLoop).toHaveBeenCalled()
    expect(unduckMusic).toHaveBeenCalled()
  })

  it('pausing mid-sentence stops the voice and restores the music; resuming starts them again', () => {
    const startVoiceLoop = vi.spyOn(audioManager, 'startVoiceLoop')
    const stopVoiceLoop = vi.spyOn(audioManager, 'stopVoiceLoop')
    const { rerender } = renderHook(({ paused }) => useTypewriter('A long sentence here', paused), {
      initialProps: { paused: false },
    })
    startVoiceLoop.mockClear()
    stopVoiceLoop.mockClear()

    rerender({ paused: true })
    expect(stopVoiceLoop).toHaveBeenCalled()

    rerender({ paused: false })
    expect(startVoiceLoop).toHaveBeenCalled()
  })

  it('never leaves the music ducked on unmount, even mid-sentence (no-leaks safety net)', () => {
    const stopVoiceLoop = vi.spyOn(audioManager, 'stopVoiceLoop')
    const unduckMusic = vi.spyOn(audioManager, 'unduckMusic')
    const { unmount } = renderHook(() => useTypewriter('A sentence nobody finishes reading', false))

    act(() => {
      vi.advanceTimersByTime(2 * MS_PER_CHARACTER)
    })
    unmount()

    expect(stopVoiceLoop).toHaveBeenCalled()
    expect(unduckMusic).toHaveBeenCalled()
  })

  it('a new sentence (text changes) resets progress and restarts voice + ducking', () => {
    const startVoiceLoop = vi.spyOn(audioManager, 'startVoiceLoop')
    const { result, rerender } = renderHook(({ text }) => useTypewriter(text, false), {
      initialProps: { text: 'First question' },
    })

    act(() => {
      vi.advanceTimersByTime('First question'.length * MS_PER_CHARACTER + FRAME_SLACK_MS)
    })
    expect(result.current.done).toBe(true)
    startVoiceLoop.mockClear()

    rerender({ text: 'Second question' })
    expect(result.current.visibleText).toBe('')
    expect(result.current.done).toBe(false)
    expect(startVoiceLoop).toHaveBeenCalled()
  })

  it('prefers-reduced-motion (017-plan.md, bloque F): shows the full text immediately, but done/unlocked keep the exact same timing — the input lock never changes', () => {
    mockReducedMotion(true)
    const text = 'A somewhat longer sentence'
    const { result } = renderHook(() => useTypewriter(text, false))

    // De golpe, desde el primer render — no hace falta ni un tick del reloj.
    expect(result.current.visibleText).toBe(text)
    expect(result.current.done).toBe(false)
    expect(result.current.unlocked).toBe(false)

    act(() => {
      vi.advanceTimersByTime(text.length * MS_PER_CHARACTER + FRAME_SLACK_MS)
    })
    expect(result.current.done).toBe(true)
    expect(result.current.unlocked).toBe(false) // todavía falta el margen de desbloqueo

    act(() => {
      vi.advanceTimersByTime(ANSWER_UNLOCK_MS + FRAME_SLACK_MS)
    })
    expect(result.current.unlocked).toBe(true)
  })
})
