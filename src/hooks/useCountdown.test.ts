import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down one second per tick starting from the initial value', () => {
    const { result } = renderHook(() => useCountdown(5))

    expect(result.current.remaining).toBe(5)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remaining).toBe(4)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.remaining).toBe(2)
  })

  it('pauses and resumes', () => {
    const { result } = renderHook(() => useCountdown(5))

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    act(() => {
      result.current.pause()
    })
    expect(result.current.remaining).toBe(4)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.remaining).toBe(4)

    act(() => {
      result.current.resume()
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remaining).toBe(3)
  })

  it('resets to the initial value and restarts', () => {
    const { result } = renderHook(() => useCountdown(5))

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.remaining).toBe(2)

    act(() => {
      result.current.reset()
    })
    expect(result.current.remaining).toBe(5)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.remaining).toBe(4)
  })

  it('calls onComplete exactly once when reaching 0, and stops', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useCountdown(2, { onComplete }))

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.remaining).toBe(0)
    expect(onComplete).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('clears its interval on unmount, leaving no live timers', () => {
    const clearSpy = vi.spyOn(window, 'clearInterval')
    const { unmount } = renderHook(() => useCountdown(10))

    unmount()

    expect(clearSpy).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
