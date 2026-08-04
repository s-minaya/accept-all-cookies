import { renderHook, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

interface FakeMediaQueryList {
  matches: boolean
  media: string
  listeners: Set<() => void>
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

function mockMatchMedia(initialMatches: boolean): FakeMediaQueryList {
  const listeners = new Set<() => void>()
  const mql: FakeMediaQueryList = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    listeners,
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
  return mql
}

describe('usePrefersReducedMotion (017-plan.md, bloque F)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the system preference on mount', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('defaults to false when the preference is not set', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('reacts live to the system preference changing mid-session (no reload needed)', () => {
    const mql = mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)

    act(() => {
      mql.matches = true
      mql.listeners.forEach((listener) => listener())
    })
    expect(result.current).toBe(true)
  })

  it('does not throw and defaults to false when matchMedia is unavailable (jsdom by default)', () => {
    vi.unstubAllGlobals() // sin mock: exactamente el jsdom real de este proyecto
    expect(() => renderHook(() => usePrefersReducedMotion())).not.toThrow()
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('unsubscribes from the media query listener on unmount (no leaks)', () => {
    const mql = mockMatchMedia(false)
    const { unmount } = renderHook(() => usePrefersReducedMotion())
    expect(mql.listeners.size).toBe(1)
    unmount()
    expect(mql.listeners.size).toBe(0)
  })
})
