import { useMemo, useRef, useState, type ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Level06 from './Level06'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'

const baseProps: LevelProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

/**
 * El tablero (grid + panel de dirección) y el pie (Agree/Disagree) se
 * publican vía `useLevelBoard`/`useLevelFooter`, no son el `return` directo
 * de `Level06` — mismo patrón que los niveles 3-5 (ver `Level04.test.tsx`),
 * necesita un canal nivel→host de verdad.
 */
function Level06Harness(props: LevelProps) {
  const [board, setBoard] = useState<ReactNode>(null)
  const [footer, setFooter] = useState<ReactNode>(null)
  const windowRef = useRef<HTMLDivElement>(null)

  const channel: HostChannelValue = useMemo(
    () => ({ setFooter, setWindowTransform: () => {}, windowRef, setBoard }),
    [],
  )

  return (
    <div ref={windowRef}>
      <HostChannelContext.Provider value={channel}>
        <Level06 {...props} />
      </HostChannelContext.Provider>
      {board}
      {footer}
    </div>
  )
}

/** Avanza el tiempo simulado lo bastante para que cualquier cadena de esta tabla (67 casillas como máximo) termine de sobra. */
function finishChain() {
  act(() => vi.advanceTimersByTime(8000))
}

function getAgree(): HTMLElement {
  return screen.getByText('Agree').closest('button') as HTMLElement
}

function getDisagree(): HTMLElement {
  return screen.getByText('Disagree').closest('button') as HTMLElement
}

/**
 * En jsdom no se evalúan media queries: el panel de dirección del tablero
 * (desktop/tablet) y su copia compacta del pie (xs/sm, mientras el candado
 * sigue cerrado) están AMBOS en el DOM a la vez, con el mismo `aria-label`
 * — `getByLabelText` a secas fallaría con "multiple elements found". Da
 * igual cuál de las dos copias se pulse: las dos llaman al mismo
 * `handleDirection`.
 */
function getDirectionButtons(label: string): HTMLElement[] {
  return screen.getAllByLabelText(label)
}

function pressDirection(label: string) {
  fireEvent.click(getDirectionButtons(label)[0])
}

function directionIsDisabled(label: string): boolean {
  return getDirectionButtons(label).every((el) => (el as HTMLButtonElement).disabled)
}

describe('Level06 (GDD Nivel 6 — Cross-Site Tracking, 010-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders its own consent text inside the blue frame, like levels 1-5', () => {
    render(<Level06Harness {...baseProps} />)
    const text = document.querySelector('[class*="level-06-consent__text"]')
    expect(text).not.toBeNull()
    expect(text?.textContent?.length).toBeGreaterThan(0)
  })

  it('renders the direction panel (4 labeled buttons, desktop copy + compact mobile-footer copy) and the footer (Agree disabled, Disagree enabled)', () => {
    render(<Level06Harness {...baseProps} />)
    expect(getDirectionButtons('Arriba')).toHaveLength(2)
    expect(getDirectionButtons('Abajo')).toHaveLength(2)
    expect(getDirectionButtons('Izquierda')).toHaveLength(2)
    expect(getDirectionButtons('Derecha')).toHaveLength(2)

    expect(getAgree()).toBeDisabled()
    expect(getDisagree()).not.toBeDisabled()
  })

  it('the compact mobile-footer direction copy disappears once the lock opens, leaving only the desktop panel copy', () => {
    render(<Level06Harness {...baseProps} />)
    expect(getDirectionButtons('Derecha')).toHaveLength(2)
    const solution = ['Derecha', 'Abajo', 'Derecha', 'Abajo', 'Arriba', 'Derecha']
    for (const label of solution) {
      pressDirection(label)
      finishChain()
    }
    expect(getAgree()).not.toBeDisabled()
    expect(getDirectionButtons('Derecha')).toHaveLength(1)
  })

  it('pressing a direction that immediately bounces (rebote) does not open the lock', () => {
    render(<Level06Harness {...baseProps} />)
    pressDirection('Arriba') // D0 ↑ = rebote, vuelve al origen
    finishChain()
    expect(getAgree()).toBeDisabled()
  })

  it('direction buttons disable while a chain is in progress, and re-enable once it completes', () => {
    render(<Level06Harness {...baseProps} />)
    pressDirection('Derecha') // D0 → D1: cadena de 8 casillas, no instantánea
    expect(directionIsDisabled('Derecha')).toBe(true)

    finishChain()
    expect(directionIsDisabled('Derecha')).toBe(false)
  })

  it('ignores further direction presses while a chain is already animating', () => {
    render(<Level06Harness {...baseProps} />)
    pressDirection('Derecha') // arranca la cadena D0 → D1
    act(() => vi.advanceTimersByTime(50)) // a medio camino, la cadena sigue en curso
    pressDirection('Abajo') // debe ignorarse

    finishChain()
    // Si el segundo pulso NO se hubiera ignorado, habría interrumpido la
    // cadena D0→D1 a mitad de camino — en vez de eso, sigue siendo el mismo
    // recorrido de 8 casillas y termina en D1, no en un estado inconsistente.
    expect(getAgree()).toBeDisabled() // (D1 no es el candado, esto solo confirma que no reventó nada)
  })

  it('plays the full documented solution (→ ↓ → ↓ ↑ →) and reaches the lock, enabling Agree', () => {
    render(<Level06Harness {...baseProps} />)
    const solution = ['Derecha', 'Abajo', 'Derecha', 'Abajo', 'Arriba', 'Derecha']
    for (const label of solution) {
      pressDirection(label)
      finishChain()
    }
    expect(getAgree()).not.toBeDisabled()
  })

  it('clicking Agree once the lock is open calls onWin()', () => {
    const onWin = vi.fn()
    render(<Level06Harness {...baseProps} onWin={onWin} />)
    for (const label of ['Derecha', 'Abajo', 'Derecha', 'Abajo', 'Arriba', 'Derecha']) {
      pressDirection(label)
      finishChain()
    }
    fireEvent.click(getAgree())
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('clicking Disagree at any point calls onLose(failed)', () => {
    const onLose = vi.fn()
    render(<Level06Harness {...baseProps} onLose={onLose} />)
    fireEvent.click(getDisagree())
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('the ArrowRight key does the same as pressing the Right button', () => {
    render(<Level06Harness {...baseProps} />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(directionIsDisabled('Derecha')).toBe(true) // la cadena D0→D1 arrancó
  })

  it('does not move (ignores clicks and keyboard) while paused', () => {
    render(<Level06Harness {...baseProps} paused={true} />)
    expect(directionIsDisabled('Derecha')).toBe(true)
    expect(getDisagree()).toBeDisabled()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    finishChain()
    // Sigue deshabilitado tras "avanzar el tiempo": nunca llegó a arrancar
    // ninguna cadena real mientras estaba en pausa.
    expect(getAgree()).toBeDisabled()
  })

  it('freezes an in-progress chain while paused, resuming without losing progress', () => {
    const { rerender } = render(<Level06Harness {...baseProps} />)
    pressDirection('Derecha') // D0 → D1, 8 casillas
    act(() => vi.advanceTimersByTime(50))

    rerender(<Level06Harness {...baseProps} paused={true} />)
    act(() => vi.advanceTimersByTime(5000)) // no debería completar la cadena estando en pausa
    expect(directionIsDisabled('Derecha')).toBe(true)

    rerender(<Level06Harness {...baseProps} paused={false} />)
    finishChain()
    expect(directionIsDisabled('Derecha')).toBe(false)
  })

  it('removes its keyboard listener on unmount (no leaks)', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Level06Harness {...baseProps} />)
    unmount()
    const removedTypes = removeSpy.mock.calls.map(([type]) => type)
    expect(removedTypes).toContain('keydown')
  })

  it('unmounts cleanly mid-chain (animator torn down) without throwing', () => {
    const { unmount } = render(<Level06Harness {...baseProps} />)
    pressDirection('Derecha')
    act(() => vi.advanceTimersByTime(50))
    expect(() => unmount()).not.toThrow()
  })
})
