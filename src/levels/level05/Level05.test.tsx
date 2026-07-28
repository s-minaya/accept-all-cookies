import { useMemo, useRef, useState, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Level05 from './Level05'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'
import { REEL_COUNT } from './slotMachine'

const baseProps: LevelProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

/**
 * El tablero (los 3 rodillos + Stops) se publica vía `useLevelBoard`, no es
 * el `return` directo de `Level05` — mismo patrón que los niveles 3 y 4
 * (ver `Level04.test.tsx`), necesita un canal nivel→host de verdad.
 */
function Level05Harness(props: LevelProps) {
  const [board, setBoard] = useState<ReactNode>(null)
  const windowRef = useRef<HTMLDivElement>(null)

  const channel: HostChannelValue = useMemo(
    () => ({ setFooter: () => {}, setWindowTransform: () => {}, windowRef, setBoard }),
    [],
  )

  return (
    <div ref={windowRef}>
      <HostChannelContext.Provider value={channel}>
        <Level05 {...props} />
      </HostChannelContext.Provider>
      {board}
    </div>
  )
}

describe('Level05 (GDD Nivel 5 — tragaperras, 009-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders its own consent text inside the blue frame, like levels 1-4', () => {
    render(<Level05Harness {...baseProps} />)
    const text = document.querySelector('[class*="level-05-consent__text"]')
    expect(text).not.toBeNull()
    expect(text?.textContent?.length).toBeGreaterThan(0)
  })

  it('renders REEL_COUNT reels and REEL_COUNT Stop buttons, no footer', () => {
    render(<Level05Harness {...baseProps} />)
    const reels = document.querySelectorAll('[class*="reel__track"]')
    expect(reels.length).toBe(REEL_COUNT)
    expect(screen.getAllByText('Stop').length).toBe(REEL_COUNT)
  })

  it('every reel starts spinning: the track custom property changes over time', () => {
    render(<Level05Harness {...baseProps} />)
    const tracks = Array.from(document.querySelectorAll('[class*="reel__track"]')) as HTMLElement[]
    const before = tracks.map((track) => track.style.getPropertyValue('--reel-offset'))

    vi.advanceTimersByTime(500)

    const after = tracks.map((track) => track.style.getPropertyValue('--reel-offset'))
    expect(after).not.toEqual(before)
  })

  it('Stop buttons are all enabled at the start; clicking one disables just that reel', () => {
    render(<Level05Harness {...baseProps} />)
    vi.advanceTimersByTime(200)

    const stops = screen.getAllByText('Stop').map((el) => el.closest('button') as HTMLButtonElement)
    expect(stops.every((btn) => !btn.disabled)).toBe(true)

    fireEvent.click(stops[0])

    expect(stops[0].disabled).toBe(true)
    expect(stops[1].disabled).toBe(false)
    expect(stops[2].disabled).toBe(false)
  })

  it('clicking an already-stopped reel again does nothing (still disabled, no crash)', () => {
    render(<Level05Harness {...baseProps} />)
    const stops = screen.getAllByText('Stop').map((el) => el.closest('button') as HTMLButtonElement)

    fireEvent.click(stops[0])
    expect(() => fireEvent.click(stops[0])).not.toThrow()
    expect(stops[0].disabled).toBe(true)
  })

  it('disables all Stops and freezes the reels while paused', () => {
    render(<Level05Harness {...baseProps} paused={true} />)
    const stops = screen.getAllByText('Stop').map((el) => el.closest('button') as HTMLButtonElement)
    expect(stops.every((btn) => btn.disabled)).toBe(true)

    const tracks = Array.from(document.querySelectorAll('[class*="reel__track"]')) as HTMLElement[]
    const before = tracks.map((track) => track.style.getPropertyValue('--reel-offset'))
    vi.advanceTimersByTime(1000)
    const after = tracks.map((track) => track.style.getPropertyValue('--reel-offset'))
    expect(after).toEqual(before)
  })

  it('does not call onLose just from clicking Stop on a spinning reel while paused', () => {
    const onLose = vi.fn()
    render(<Level05Harness {...baseProps} paused={true} onLose={onLose} />)
    const stops = screen.getAllByText('Stop').map((el) => el.closest('button') as HTMLButtonElement)

    fireEvent.click(stops[0])
    expect(onLose).not.toHaveBeenCalled()
  })

  it('unmounts cleanly (rAF loops and the respin timer torn down) without throwing', () => {
    const { unmount } = render(<Level05Harness {...baseProps} />)
    vi.advanceTimersByTime(500)
    expect(() => unmount()).not.toThrow()
  })

  it('does not keep animating after unmount (no leaked rAF loop)', () => {
    const { unmount } = render(<Level05Harness {...baseProps} />)
    const track = document.querySelector('[class*="reel__track"]') as HTMLElement
    unmount()
    const afterUnmount = track.style.getPropertyValue('--reel-offset')
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow()
    expect(track.style.getPropertyValue('--reel-offset')).toBe(afterUnmount)
  })
})
