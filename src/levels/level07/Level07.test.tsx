import { useMemo, useState, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Level07 from './Level07'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'

const baseProps: LevelProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

/** Reproduce lo mínimo que `LevelHost` hace de verdad: provee el canal nivel→host y pinta el pie que el nivel registre. */
function Level07Harness(props: LevelProps) {
  const [footer, setFooter] = useState<ReactNode>(null)

  const channel: HostChannelValue = useMemo(
    () => ({
      setFooter,
      setWindowTransform: () => {},
      windowRef: { current: null },
      setBoard: () => {},
    }),
    [],
  )

  return (
    <div>
      <HostChannelContext.Provider value={channel}>
        <Level07 {...props} />
      </HostChannelContext.Provider>
      {footer}
    </div>
  )
}

function drag(element: Element, from: { x: number; y: number }, to: { x: number; y: number }) {
  fireEvent.pointerDown(element, { pointerId: 1, clientX: from.x, clientY: from.y })
  fireEvent.pointerMove(element, { pointerId: 1, clientX: to.x, clientY: to.y })
  fireEvent.pointerUp(element, { pointerId: 1, clientX: to.x, clientY: to.y })
}

function getCover(): HTMLElement {
  // El texto "Disagree" aparece 2 veces (el normal y la cubierta); la
  // cubierta es siempre el último en el DOM (pila del pie, Level07.tsx).
  const disagrees = screen.getAllByText('Disagree')
  return disagrees[disagrees.length - 1].closest('button') as HTMLElement
}

function getPlainDisagree(): HTMLElement {
  const disagrees = screen.getAllByText('Disagree')
  return disagrees[0].closest('button') as HTMLElement
}

function getAgree(): HTMLElement {
  return screen.getByText('Agree').closest('button') as HTMLElement
}

describe('Level07 (GDD Nivel 7 — Data Sharing, 011-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders its own consent text inside the blue frame, like levels 1-2', () => {
    render(<Level07Harness {...baseProps} />)
    const text = document.querySelector('[class*="level-07__text"]')
    expect(text).not.toBeNull()
    expect(text?.textContent?.length).toBeGreaterThan(0)
  })

  it('renders a plain Disagree, a fixed Agree, and a cover reading Disagree on top', () => {
    render(<Level07Harness {...baseProps} />)
    expect(getPlainDisagree()).toBeInTheDocument()
    expect(getAgree()).toBeInTheDocument()
    expect(getCover()).toBeInTheDocument()
  })

  it('tapping the plain Disagree calls onLose(failed)', () => {
    const onLose = vi.fn()
    render(<Level07Harness {...baseProps} onLose={onLose} />)
    fireEvent.click(getPlainDisagree())
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('tapping the cover without dragging calls onLose(failed)', () => {
    const onLose = vi.fn()
    render(<Level07Harness {...baseProps} onLose={onLose} />)
    drag(getCover(), { x: 10, y: 10 }, { x: 12, y: 11 }) // < 8px: se clasifica como tap
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('tapping the exposed Agree calls onWin()', () => {
    const onWin = vi.fn()
    render(<Level07Harness {...baseProps} onWin={onWin} />)
    fireEvent.click(getAgree())
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('a drag ≥ 8px on the cover updates --cover-x/--cover-y and never loses', () => {
    const onLose = vi.fn()
    render(<Level07Harness {...baseProps} onLose={onLose} />)
    const cover = getCover()
    drag(cover, { x: 0, y: 0 }, { x: 50, y: 0 })
    expect(onLose).not.toHaveBeenCalled()
    expect(cover.style.getPropertyValue('--cover-x')).not.toBe('')
  })

  it('dragging the cover once disarms it: a later tap on it neither wins nor loses', () => {
    const onWin = vi.fn()
    const onLose = vi.fn()
    render(<Level07Harness {...baseProps} onWin={onWin} onLose={onLose} />)
    const cover = getCover()
    drag(cover, { x: 0, y: 0 }, { x: 60, y: 0 }) // primer arrastre: no pierde, y la desarma
    expect(onLose).not.toHaveBeenCalled()
    drag(cover, { x: 60, y: 0 }, { x: 61, y: 0 }) // segundo gesto, < 8px: tap sobre la cubierta ya desarmada
    expect(onLose).not.toHaveBeenCalled()
    expect(onWin).not.toHaveBeenCalled()
  })

  it('does not drag, tap-lose or tap-win while paused', () => {
    const onWin = vi.fn()
    const onLose = vi.fn()
    render(<Level07Harness {...baseProps} paused={true} onWin={onWin} onLose={onLose} />)
    expect(getPlainDisagree()).toBeDisabled()
    expect(getAgree()).toBeDisabled()

    const cover = getCover()
    drag(cover, { x: 0, y: 0 }, { x: 12, y: 0 })
    expect(onLose).not.toHaveBeenCalled()
    expect(cover.style.getPropertyValue('--cover-x')).toBe('')
  })

  it('freezes an in-progress drag while paused, without moving further', () => {
    const { rerender } = render(<Level07Harness {...baseProps} />)
    const cover = getCover()
    fireEvent.pointerDown(cover, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(cover, { pointerId: 1, clientX: 40, clientY: 0 })
    const frozenValue = cover.style.getPropertyValue('--cover-x')

    rerender(<Level07Harness {...baseProps} paused={true} />)
    fireEvent.pointerMove(cover, { pointerId: 1, clientX: 200, clientY: 0 })
    expect(cover.style.getPropertyValue('--cover-x')).toBe(frozenValue)

    fireEvent.pointerUp(cover, { pointerId: 1, clientX: 200, clientY: 0 })
  })

  it('unmounts cleanly (usePointer listeners removed) without throwing', () => {
    const { unmount } = render(<Level07Harness {...baseProps} />)
    const cover = getCover()
    fireEvent.pointerDown(cover, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(cover, { pointerId: 1, clientX: 40, clientY: 0 })
    expect(() => unmount()).not.toThrow()
  })
})
