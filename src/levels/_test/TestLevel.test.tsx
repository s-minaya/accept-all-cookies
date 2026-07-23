import { act, fireEvent, render, screen } from '@testing-library/react'
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

    const { unmount } = render(
      <TestLevel onWin={() => {}} onLose={() => {}} timeLeft={100} paused={false} />,
    )

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointercancel', expect.any(Function))
  })
})

describe('TestLevel paused (contrato de nivel, 004)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('freezes its own countdown while paused and resumes when unpaused', () => {
    const { rerender } = render(
      <TestLevel onWin={() => {}} onLose={() => {}} timeLeft={100} paused={false} />,
    )

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText('27')).toBeInTheDocument()

    rerender(<TestLevel onWin={() => {}} onLose={() => {}} timeLeft={100} paused={true} />)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText('27')).toBeInTheDocument()

    rerender(<TestLevel onWin={() => {}} onLose={() => {}} timeLeft={100} paused={false} />)
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('ignores win/lose input while paused', () => {
    const onWin = vi.fn()
    const onLose = vi.fn()
    render(<TestLevel onWin={onWin} onLose={onLose} timeLeft={100} paused={true} />)

    fireEvent.click(screen.getByText('Agree'))
    fireEvent.click(screen.getByText('Disagree'))

    expect(onWin).not.toHaveBeenCalled()
    expect(onLose).not.toHaveBeenCalled()
  })
})
