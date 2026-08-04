import { useMemo, useRef, useState, type ReactNode } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Level04 from './Level04'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'
import { FALL_MAX_POPULATION, FALL_MAX_POPULATION_MOBILE } from './board'

function mockPointer(coarse: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: coarse }) as unknown as typeof window.matchMedia,
  )
}

const baseProps: LevelProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

/**
 * El tablero del nivel 4 ya no es su `return` directo: se publica vía
 * `useLevelBoard` (mismo patrón que el recuadro de lluvia del nivel 3, ver
 * `Level03.test.tsx`), así que estos tests necesitan un canal nivel→host de
 * verdad para que llegue a montarse.
 */
function Level04Harness(props: LevelProps) {
  const [board, setBoard] = useState<ReactNode>(null)
  const windowRef = useRef<HTMLDivElement>(null)

  const channel: HostChannelValue = useMemo(
    () => ({
      setFooter: () => {},
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
        <Level04 {...props} />
      </HostChannelContext.Provider>
      {board}
    </div>
  )
}

function paddleTransformX(container: HTMLElement): number {
  const paddle = container.querySelector('[class*="level-04__paddle"]') as HTMLElement | null
  const match = paddle?.style.transform.match(/translate\(([-\d.]+)px/)
  return match ? Number.parseFloat(match[1]) : Number.NaN
}

/**
 * Nota: la captura (colisión física ↔ segmentos ↔ onWin/onLose) NO se
 * reprueba aquí — es física real, no determinista a este nivel sin exponer
 * una semilla desde `Level04.tsx` (que no tiene sentido en juego real). La
 * regla de los segmentos está cubierta exhaustivamente en `segments.test.ts`
 * y el evento de captura en `board.test.ts`; aquí solo se cubre el cableado
 * de renderizado, población por dispositivo y limpieza.
 */
describe('Level04 (GDD Nivel 4 — Plinko, 008-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockPointer(false) // ratón (escritorio) por defecto
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('renders the full falling-piece pool on desktop, all starting as Agree (green fill + text)', () => {
    const { container } = render(<Level04Harness {...baseProps} />)
    expect(container.querySelectorAll('[class*="level-04__falling--agree"]').length).toBe(
      FALL_MAX_POPULATION,
    )
    expect(container.querySelectorAll('[class*="level-04__falling--disagree"]').length).toBe(0)
    // No `screen.getAllByText('Agree')`: la paleta también pinta "Agree" en
    // su propio relleno (ver más abajo), así que contaría de más — se
    // busca el texto solo dentro de las fichas que caen.
    const fallingLabels = container.querySelectorAll('[class*="level-04__falling-label"]')
    expect(fallingLabels.length).toBe(FALL_MAX_POPULATION)
    for (const label of fallingLabels) {
      expect(label.textContent).toBe('Agree')
    }
  })

  it('renders fewer falling pieces on a coarse-pointer (mobile/touch) device', () => {
    mockPointer(true)
    const { container } = render(<Level04Harness {...baseProps} />)
    expect(container.querySelectorAll('[class*="level-04__falling--agree"]').length).toBe(
      FALL_MAX_POPULATION_MOBILE,
    )
  })

  it('the falling pieces are not real click targets (plain divs, no onClick)', () => {
    const onLose = vi.fn()
    const { container } = render(<Level04Harness {...baseProps} onLose={onLose} />)
    // `[class*="level-04__falling--"]` (con guion doble), no solo
    // "level-04__falling": ese prefijo más corto también encajaría con
    // `level-04__falling-label` (el span del texto, guion simple).
    const pieces = container.querySelectorAll('[class*="level-04__falling--"]')
    expect(pieces.length).toBe(FALL_MAX_POPULATION)
    for (const piece of pieces) {
      expect(piece.tagName).toBe('DIV')
      fireEvent.click(piece)
    }
    expect(onLose).not.toHaveBeenCalled()
  })

  it('renders the paddle as a single button, empty (0% fill) at the start', () => {
    const { container } = render(<Level04Harness {...baseProps} />)
    const paddle = container.querySelector('[class*="level-04__paddle"]') as HTMLElement
    expect(paddle.style.getPropertyValue('--agree-fill')).toBe('0')
    expect(paddle.style.getPropertyValue('--disagree-fill')).toBe('0')
    // Un único nodo de paleta con exactamente dos rellenos (agree/disagree),
    // no 6 celdas separadas (ya corregido).
    const fills = container.querySelectorAll('[class*="level-04__fill"]')
    expect(fills.length).toBe(2)
  })

  it('the paddle carries its own Agree/Disagree text labels, one per fill side, completing progressively as it captures', () => {
    const { container } = render(<Level04Harness {...baseProps} />)
    const agreeLabel = container.querySelector('[class*="level-04__paddle-label--agree"]')
    const disagreeLabel = container.querySelector('[class*="level-04__paddle-label--disagree"]')
    expect(agreeLabel?.textContent).toBe('Agree')
    expect(disagreeLabel?.textContent).toBe('Disagree')
  })

  it('syncs the paddle position before the first paint (no flash at the browser default position)', () => {
    const { container } = render(<Level04Harness {...baseProps} />)
    expect(paddleTransformX(container)).not.toBeNaN()
  })

  it('the mouse no longer follows on hover: moving the pointer without pressing does not move the paddle', () => {
    const { container } = render(<Level04Harness {...baseProps} />)
    const startX = paddleTransformX(container)
    const canvas = container.querySelector('[class*="game-area__canvas"]') as HTMLElement

    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 500, clientY: 100 })
    vi.advanceTimersByTime(1000)

    expect(paddleTransformX(container)).toBe(startX)
  })

  it('ArrowRight/ArrowLeft move the paddle (keyboard control)', () => {
    const { container } = render(<Level04Harness {...baseProps} />)
    const startX = paddleTransformX(container)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    vi.advanceTimersByTime(1000)
    fireEvent.keyUp(window, { key: 'ArrowRight' })

    expect(paddleTransformX(container)).toBeGreaterThan(startX)
  })

  it('does not move the paddle via keyboard while paused', () => {
    const { container, rerender } = render(<Level04Harness {...baseProps} paused={true} />)
    const startX = paddleTransformX(container)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    vi.advanceTimersByTime(1000)
    rerender(<Level04Harness {...baseProps} paused={true} />)

    expect(paddleTransformX(container)).toBe(startX)
  })

  it('removes its keyboard listeners on unmount (no leaks)', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Level04Harness {...baseProps} />)

    unmount()

    const removedTypes = removeSpy.mock.calls.map(([type]) => type)
    expect(removedTypes).toContain('keydown')
    expect(removedTypes).toContain('keyup')
  })

  it('unmounts cleanly (physics simulation destroyed) without throwing', () => {
    const { unmount } = render(<Level04Harness {...baseProps} />)
    expect(() => unmount()).not.toThrow()
  })
})
