import { useMemo, useRef, useState, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Level03 from './Level03'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'
import { RAIN_MAX_POPULATION, RAIN_MAX_POPULATION_MOBILE } from './rain'

function mockPointer(coarse: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: coarse }) as unknown as typeof window.matchMedia,
  )
}

const baseProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

/**
 * Reproduce lo mínimo que `LevelHost` hace de verdad: provee el canal
 * nivel→host (007-plan.md) con un nodo real para `windowRef` (para que
 * `usePointer` pueda engancharse) y pinta el pie que el nivel registre,
 * exponiendo la transformación publicada como atributo para comprobarla.
 */
function Level03Harness(props: LevelProps) {
  const [footer, setFooter] = useState<ReactNode>(null)
  const [board, setBoard] = useState<ReactNode>(null)
  const [transform, setTransform] = useState<string | null>(null)
  const windowRef = useRef<HTMLDivElement>(null)

  const channel: HostChannelValue = useMemo(
    () => ({ setFooter, setWindowTransform: setTransform, windowRef, setBoard }),
    [],
  )

  return (
    <div ref={windowRef} data-testid="window" data-transform={transform ?? ''}>
      <HostChannelContext.Provider value={channel}>
        <Level03 {...props} />
      </HostChannelContext.Provider>
      {board}
      {footer}
    </div>
  )
}

function drag(element: Element, from: { x: number; y: number }, to: { x: number; y: number }) {
  fireEvent.pointerDown(element, { pointerId: 1, clientX: from.x, clientY: from.y })
  fireEvent.pointerMove(element, { pointerId: 1, clientX: to.x, clientY: to.y })
  fireEvent.pointerUp(element, { pointerId: 1, clientX: to.x, clientY: to.y })
}

describe('Level03 (GDD Nivel 3 — la ventana rota, el Agree está oculto dentro de la lluvia)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockPointer(false) // ratón (escritorio) por defecto en estos tests
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('renders its own consent text inside the blue frame, like levels 1-2 (no separate consent box)', () => {
    render(<Level03Harness {...baseProps} />)

    const text = document.querySelector('[class*="level-03__text"]')
    expect(text).not.toBeNull()
    expect(text?.textContent?.length).toBeGreaterThan(0)
  })

  it('renders fewer rain Disagrees on a coarse-pointer (mobile) device', () => {
    mockPointer(true)
    render(<Level03Harness {...baseProps} />)

    // El fijo del pie + el pool reducido de la lluvia.
    expect(screen.getAllByText('Disagree').length).toBe(1 + RAIN_MAX_POPULATION_MOBILE)
  })

  it('renders the fixed Disagree in the footer and the max rain population, both calling onLose(failed)', () => {
    const onLose = vi.fn()
    render(<Level03Harness {...baseProps} onLose={onLose} />)

    const disagreeButtons = screen.getAllByText('Disagree')
    // 1 fijo del pie + el pool completo de la lluvia.
    expect(disagreeButtons.length).toBe(1 + RAIN_MAX_POPULATION)

    fireEvent.click(disagreeButtons[0])
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('renders the Agree button inside the rain box and calls onWin when tapped', () => {
    const onWin = vi.fn()
    render(<Level03Harness {...baseProps} onWin={onWin} />)

    fireEvent.click(screen.getByText('Agree'))
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('dragging on the window rotates it: publishes a changing --window-rotation-ready transform', () => {
    render(<Level03Harness {...baseProps} />)
    const windowEl = screen.getByTestId('window')

    expect(windowEl.dataset.transform).toBe('0deg')

    // Arranca a la derecha del centro (0,0 en jsdom, rect degenerada) y se
    // mueve hacia abajo: gira ~90° en sentido horario.
    drag(windowEl, { x: 100, y: 0 }, { x: 0, y: 100 })

    expect(windowEl.dataset.transform).not.toBe('0deg')
    expect(windowEl.dataset.transform).toMatch(/^-?\d+(\.\d+)?deg$/)
  })

  it('a drag that starts on the fixed Disagree button rotates instead of losing', () => {
    const onLose = vi.fn()
    render(<Level03Harness {...baseProps} onLose={onLose} />)
    const windowEl = screen.getByTestId('window')
    const disagreeButton = screen.getAllByText('Disagree')[0]

    drag(disagreeButton, { x: 100, y: 0 }, { x: 0, y: 100 })

    expect(onLose).not.toHaveBeenCalled()
    expect(windowEl.dataset.transform).not.toBe('0deg')
  })

  it('does not rotate while paused', () => {
    render(<Level03Harness {...baseProps} paused={true} />)
    const windowEl = screen.getByTestId('window')

    drag(windowEl, { x: 100, y: 0 }, { x: 0, y: 100 })

    expect(windowEl.dataset.transform).toBe('0deg')
  })

  it('disables the footer Disagree, the rain Disagrees and the Agree while paused', () => {
    render(<Level03Harness {...baseProps} paused={true} />)

    for (const button of screen.getAllByText('Disagree')) {
      expect(button.closest('button')).toBeDisabled()
    }
    expect(screen.getByText('Agree').closest('button')).toBeDisabled()
  })

  it('unmounts cleanly (physics simulation destroyed) without throwing', () => {
    const { unmount } = render(<Level03Harness {...baseProps} />)
    expect(() => unmount()).not.toThrow()
  })
})
