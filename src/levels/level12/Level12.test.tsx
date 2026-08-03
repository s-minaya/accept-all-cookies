import { useMemo, useRef, useState, type ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Level12 from './Level12'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'
import { createSwitchAt, DECAY_INTERVAL_MS, RESTORE_MS } from './acceptAll'
import { WIN_FILL_MS } from './ProgressBar'

const baseProps: LevelProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

/**
 * El pie (Disagree + botón protagonista) y el tablero (`ProgressBar`) se
 * publican vía el canal, no son el `return` directo de `Level12` — mismo
 * patrón que los niveles 3-11 (ver `Level09.test.tsx`).
 */
function Level12Harness(props: LevelProps) {
  const [footer, setFooter] = useState<ReactNode>(null)
  const [board, setBoard] = useState<ReactNode>(null)
  const windowRef = useRef<HTMLDivElement>(null)

  const channel: HostChannelValue = useMemo(
    () => ({
      setFooter,
      setWindowTransform: () => {},
      setWindowZIndex: () => {},
      windowRef,
      titleBarRef: { current: null },
      setBoard,
      setOverlay: () => {},
    }),
    [],
  )

  return (
    <div ref={windowRef}>
      <HostChannelContext.Provider value={channel}>
        <Level12 {...props} />
      </HostChannelContext.Provider>
      {footer}
      {board}
    </div>
  )
}

/** Fija `Math.random()` y devuelve el `switchAt` real que producirá el nivel con ese valor (misma fórmula que `Level12.tsx`). */
function seedSwitchAt(randomValue: number): number {
  vi.spyOn(Math, 'random').mockReturnValue(randomValue)
  return createSwitchAt(Math.floor(randomValue * 0xffffffff))
}

function getButtons(): { disagree: HTMLButtonElement; protagonist: HTMLButtonElement } {
  const buttons = screen.getAllByRole('button') as HTMLButtonElement[]
  // El Disagree fijo es siempre el primero (izquierda); el protagonista, el segundo.
  return { disagree: buttons[0], protagonist: buttons[1] }
}

function getBarFill(): HTMLElement {
  return document.querySelector('[class*="level-12__bar-fill"]') as HTMLElement
}

function progressValue(): number {
  return Number(getBarFill().style.getPropertyValue('--progress'))
}

describe('Level12 (GDD Nivel 12 — Accept All, jefe final, 016-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders its own consent text inside the blue frame, like levels 1-11', () => {
    seedSwitchAt(0.5)
    render(<Level12Harness {...baseProps} />)
    const text = document.querySelector('[class*="level-12__text"]')
    expect(text).not.toBeNull()
    expect(text?.textContent?.length).toBeGreaterThan(0)
  })

  it('renders a fixed red Disagree and a green Agree protagonist button', () => {
    seedSwitchAt(0.5)
    render(<Level12Harness {...baseProps} />)
    const { disagree, protagonist } = getButtons()
    expect(disagree.textContent).toContain('Disagree')
    expect(protagonist.textContent).toContain('Agree')
  })

  it('clicking the fixed Disagree loses immediately, regardless of the protagonist button state', () => {
    seedSwitchAt(0.5)
    const onLose = vi.fn()
    render(<Level12Harness {...baseProps} onLose={onLose} />)
    fireEvent.click(getButtons().disagree)
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('each click on the protagonist button raises the bar a little, and it never reaches 100 by clicking alone', () => {
    const switchAt = seedSwitchAt(0.5)
    render(<Level12Harness {...baseProps} />)
    const before = progressValue()
    fireEvent.click(getButtons().protagonist)
    expect(progressValue()).toBeGreaterThan(before)

    // Agotar la ráfaga completa hasta justo antes de la trampa: sigue sin llegar a 100.
    for (let i = 1; i < switchAt; i++) {
      fireEvent.click(getButtons().protagonist)
    }
    expect(progressValue()).toBeLessThan(100)
  })

  it('flips to a red Disagree exactly on the switchAt-th click, with no warning', () => {
    const switchAt = seedSwitchAt(0.3)
    render(<Level12Harness {...baseProps} />)
    for (let i = 0; i < switchAt - 1; i++) {
      fireEvent.click(getButtons().protagonist)
      expect(getButtons().protagonist.textContent).toContain('Agree')
    }
    fireEvent.click(getButtons().protagonist) // el clic número switchAt
    expect(getButtons().protagonist.textContent).toContain('Disagree')
  })

  it('clicking the protagonist while it is the trap loses', () => {
    const switchAt = seedSwitchAt(0.3)
    const onLose = vi.fn()
    render(<Level12Harness {...baseProps} onLose={onLose} />)
    for (let i = 0; i < switchAt; i++) fireEvent.click(getButtons().protagonist)
    fireEvent.click(getButtons().protagonist) // switchAt + 1: cae en la trampa
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('after 2s without clicking in the trap, the button turns back to Agree on its own', () => {
    const switchAt = seedSwitchAt(0.3)
    render(<Level12Harness {...baseProps} />)
    for (let i = 0; i < switchAt; i++) fireEvent.click(getButtons().protagonist)
    expect(getButtons().protagonist.textContent).toContain('Disagree')

    act(() => vi.advanceTimersByTime(RESTORE_MS + 100))
    expect(getButtons().protagonist.textContent).toContain('Agree')
  })

  it('clicking once restored wins: the bar animates to 100 and onWin fires after the fill animation', () => {
    const switchAt = seedSwitchAt(0.3)
    const onWin = vi.fn()
    render(<Level12Harness {...baseProps} onWin={onWin} />)
    for (let i = 0; i < switchAt; i++) fireEvent.click(getButtons().protagonist)
    act(() => vi.advanceTimersByTime(RESTORE_MS + 100))

    fireEvent.click(getButtons().protagonist)
    expect(onWin).not.toHaveBeenCalled() // todavía animando
    expect(progressValue()).toBe(100)

    act(() => vi.advanceTimersByTime(WIN_FILL_MS + 100))
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('the bar decays over time without clicking', () => {
    seedSwitchAt(0.5)
    render(<Level12Harness {...baseProps} />)
    fireEvent.click(getButtons().protagonist)
    fireEvent.click(getButtons().protagonist)
    const afterClicks = progressValue()

    act(() => vi.advanceTimersByTime(DECAY_INTERVAL_MS * 3))
    expect(progressValue()).toBeLessThan(afterClicks)
  })

  it('both buttons are disabled while paused, and the model does not advance', () => {
    seedSwitchAt(0.5)
    const { rerender } = render(<Level12Harness {...baseProps} />)
    fireEvent.click(getButtons().protagonist)
    const before = progressValue()

    rerender(<Level12Harness {...baseProps} paused={true} />)
    expect(getButtons().disagree).toBeDisabled()
    expect(getButtons().protagonist).toBeDisabled()

    act(() => vi.advanceTimersByTime(DECAY_INTERVAL_MS * 5))
    expect(progressValue()).toBe(before) // congelado: ni decae ni avanza
  })

  it('unmounts cleanly (rAF loops + no leaks) without throwing', () => {
    seedSwitchAt(0.5)
    const { unmount } = render(<Level12Harness {...baseProps} />)
    fireEvent.click(getButtons().protagonist)
    expect(() => unmount()).not.toThrow()
  })

  it('does not keep animating after unmount (no leaked rAF loop)', () => {
    seedSwitchAt(0.5)
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')
    const { unmount } = render(<Level12Harness {...baseProps} />)
    act(() => vi.advanceTimersByTime(100))
    unmount()
    expect(cancelSpy).toHaveBeenCalled()
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow()
  })
})
