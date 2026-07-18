import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TestLevel from './TestLevel'

describe('TestLevel cleanup on unmount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('clears its internal countdown interval and removes its pointer listeners', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    const removeEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener')

    const { unmount } = render(<TestLevel onWin={() => {}} onLose={() => {}} timeLeft={100} />)

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointercancel', expect.any(Function))
  })
})
