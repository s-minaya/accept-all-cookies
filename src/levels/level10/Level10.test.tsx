import { useMemo, useRef, useState, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Level10 from './Level10'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'

const baseProps: LevelProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

/**
 * Reproduce lo mínimo que `LevelHost` hace de verdad para este nivel: provee
 * el canal nivel→host con un `titleBarRef` real (para que `usePointer` de la
 * ventana nº 1 pueda engancharse, 014-plan.md) y pinta pie/overlay tal y
 * como los publica el nivel.
 */
function Level10Harness(props: LevelProps) {
  const [footer, setFooter] = useState<ReactNode>(null)
  const [overlay, setOverlay] = useState<ReactNode>(null)
  const [transform, setTransform] = useState<string | null>(null)
  const [zIndex, setZIndex] = useState<number | null>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const titleBarRef = useRef<HTMLDivElement>(null)

  const channel: HostChannelValue = useMemo(
    () => ({
      setFooter,
      setWindowTransform: setTransform,
      setWindowZIndex: setZIndex,
      windowRef,
      titleBarRef,
      setBoard: () => {},
      setOverlay,
    }),
    [],
  )

  return (
    <div>
      <div
        ref={windowRef}
        data-testid="window"
        data-transform={transform ?? ''}
        data-zindex={zIndex ?? ''}
      >
        <div ref={titleBarRef} data-testid="host-title-bar" />
        <HostChannelContext.Provider value={channel}>
          <Level10 {...props} />
        </HostChannelContext.Provider>
        {footer}
      </div>
      {overlay}
    </div>
  )
}

function dragBy(element: Element, dx: number, dy: number) {
  fireEvent.pointerDown(element, { pointerId: 1, clientX: 0, clientY: 0 })
  fireEvent.pointerMove(element, { pointerId: 1, clientX: dx, clientY: dy })
  fireEvent.pointerUp(element, { pointerId: 1, clientX: dx, clientY: dy })
}

/** Solo la barra de título raíz de cada copia — excluye sus hijos BEM (`__counter`, `__title`…). */
function getCloneTitleBars() {
  return Array.from(
    document.querySelectorAll('[class*="level-10-clone"] [class*="title-bar"]:not([class*="__"])'),
  )
}

/** Textos de los botones del pie de la copia a la que pertenece esta barra de título. */
function cloneButtonTexts(titleBar: Element) {
  const clone = titleBar.closest('[class*="level-10-clone"]')
  return Array.from(clone?.querySelectorAll('button[class*="xp-button"]') ?? []).map(
    (b) => b.textContent,
  )
}

/** `--window-z` (escrito por ref, `LevelWindow.tsx`) de la copia a la que pertenece esta barra. */
function cloneZIndex(titleBar: Element) {
  const clone = titleBar.closest('[class*="level-10-clone"]') as HTMLElement | null
  return Number(clone?.style.getPropertyValue('--window-z'))
}

describe('Level10 (GDD Nivel 10 — ventanas que se duplican al arrastrarse)', () => {
  beforeEach(() => {
    // Rect uniforme para todos los elementos: simplifica la aritmética de
    // arrastre (misma técnica que otros niveles con `usePointer` + rects) sin
    // afectar a la corrección — el clamping/posicionamiento en sí ya está
    // cubierto de forma exhaustiva en `windows.test.ts`.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      toJSON() {},
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders its own consent text inside the blue frame (no separate consent box)', () => {
    render(<Level10Harness {...baseProps} />)
    const text = document.querySelector('[class*="level-10__text"]')
    expect(text).not.toBeNull()
    expect(text?.textContent?.length).toBeGreaterThan(0)
  })

  it('starts with both footer buttons saying Disagree', () => {
    render(<Level10Harness {...baseProps} />)
    expect(screen.getAllByText('Disagree')).toHaveLength(2)
    expect(screen.queryByText('Agree')).toBeNull()
  })

  it('both buttons are red (disagree variant) before the reveal — no green button hiding in plain sight', () => {
    render(<Level10Harness {...baseProps} />)
    for (const label of screen.getAllByText('Disagree')) {
      const button = label.closest('button')
      expect(button?.className).toContain('xp-button--disagree')
      expect(button?.className).not.toContain('xp-button--agree')
    }
  })

  it('clicking the left (red) Disagree loses', () => {
    const onLose = vi.fn()
    render(<Level10Harness {...baseProps} onLose={onLose} />)
    fireEvent.click(screen.getAllByText('Disagree')[0])
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('clicking the right button loses too before the 7th window appears (still red/Disagree)', () => {
    const onLose = vi.fn()
    render(<Level10Harness {...baseProps} onLose={onLose} />)
    fireEvent.click(screen.getAllByText('Disagree')[1])
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('dragging the host title bar by more than 8px spawns exactly one clone', () => {
    render(<Level10Harness {...baseProps} />)
    expect(getCloneTitleBars()).toHaveLength(0)

    dragBy(screen.getByTestId('host-title-bar'), 50, 0)

    expect(getCloneTitleBars()).toHaveLength(1)
  })

  it('a clone renders its consent text with the exact same styled wrapper as window 1 (same node, reused)', () => {
    render(<Level10Harness {...baseProps} />)
    dragBy(screen.getByTestId('host-title-bar'), 50, 0)

    const cloneText = document.querySelector('[class*="level-10-clone"] [class*="level-10__text"]')
    expect(cloneText).not.toBeNull()
    // Mismo bloque blanco (`.level-10`) envolviendo el párrafo estilado
    // (`.level-10__text`), no un `<p>` suelto sin clase — regresión: las
    // copias se quedaban sin el estilo de texto (ni el fondo blanco) que sí
    // tenía la ventana nº 1.
    expect(cloneText?.parentElement?.className).toContain('level-10')
    expect(cloneText?.textContent).toBe(
      document.querySelector('[class*="level-10__text"]')?.textContent,
    )
  })

  it('does not spawn while paused', () => {
    render(<Level10Harness {...baseProps} paused={true} />)
    dragBy(screen.getByTestId('host-title-bar'), 50, 0)
    expect(getCloneTitleBars()).toHaveLength(0)
  })

  it('disables both footer buttons while paused', () => {
    render(<Level10Harness {...baseProps} paused={true} />)
    for (const button of screen.getAllByText('Disagree')) {
      expect(button.closest('button')).toBeDisabled()
    }
  })

  it('a window only spawns once: dragging the host again after its first spawn does not create a second clone', () => {
    render(<Level10Harness {...baseProps} />)
    dragBy(screen.getByTestId('host-title-bar'), 50, 0)
    expect(getCloneTitleBars()).toHaveLength(1)

    dragBy(screen.getByTestId('host-title-bar'), 20, 0)
    expect(getCloneTitleBars()).toHaveLength(1)
  })

  it('clicking the X of a clone loses with reason "closed"', () => {
    const onLose = vi.fn()
    render(<Level10Harness {...baseProps} onLose={onLose} />)
    dragBy(screen.getByTestId('host-title-bar'), 50, 0)

    const closeButton = document.querySelector('[class*="level-10-clone"] [class*="close-button"]')
    expect(closeButton).not.toBeNull()
    fireEvent.click(closeButton as Element)

    expect(onLose).toHaveBeenCalledWith('closed')
  })

  it('reaching 7 windows draws exactly one Agree; clicking it wins, clicking any other Disagree loses', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // semilla determinista del nivel

    const onWin = vi.fn()
    const onLose = vi.fn()
    render(<Level10Harness {...baseProps} onWin={onWin} onLose={onLose} />)

    // Cada ventana pare una única vez: hay que encadenar el arrastre sobre la
    // copia recién nacida cada vez (host -> copia 2 -> copia 3 -> ... -> 7).
    dragBy(screen.getByTestId('host-title-bar'), 10, 0)
    for (let i = 0; i < 5; i++) {
      const bars = getCloneTitleBars()
      dragBy(bars[bars.length - 1], 10, 0)
    }
    expect(getCloneTitleBars()).toHaveLength(6) // 6 copias + la ventana nº 1 = 7

    const agreeButtons = screen.getAllByText('Agree')
    expect(agreeButtons).toHaveLength(1)
    // El único botón Agree es también el único verde: las otras 13 siguen
    // siendo rojas, ninguna se delata por el color antes de leer el texto.
    expect(agreeButtons[0].closest('button')?.className).toContain('xp-button--agree')

    const disagreeButtons = screen.getAllByText('Disagree')
    expect(disagreeButtons).toHaveLength(13) // 14 botones en total (7 x 2), 1 es Agree
    for (const label of disagreeButtons) {
      expect(label.closest('button')?.className).toContain('xp-button--disagree')
    }

    fireEvent.click(disagreeButtons[0])
    expect(onLose).toHaveBeenCalledWith('failed')
    expect(onWin).not.toHaveBeenCalled()

    fireEvent.click(agreeButtons[0])
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('does not spawn an 8th window once the cap is reached', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    render(<Level10Harness {...baseProps} />)

    dragBy(screen.getByTestId('host-title-bar'), 10, 0)
    for (let i = 0; i < 5; i++) {
      const bars = getCloneTitleBars()
      dragBy(bars[bars.length - 1], 10, 0)
    }
    expect(getCloneTitleBars()).toHaveLength(6)

    const lastBar = getCloneTitleBars()[5]
    dragBy(lastBar, 10, 0)
    expect(getCloneTitleBars()).toHaveLength(6) // sigue en 6 copias (7 ventanas): tope alcanzado
  })

  it('the last-created window (the one that reached 7) never carries the Agree', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    render(<Level10Harness {...baseProps} />)

    dragBy(screen.getByTestId('host-title-bar'), 10, 0)
    for (let i = 0; i < 5; i++) {
      const bars = getCloneTitleBars()
      dragBy(bars[bars.length - 1], 10, 0)
    }
    const bars = getCloneTitleBars()
    expect(bars).toHaveLength(6)

    const lastBar = bars[bars.length - 1] // la última creada (id 7)
    expect(cloneButtonTexts(lastBar)).toEqual(['Disagree', 'Disagree'])
    // Y sigue habiendo exactamente un Agree, en alguna de las otras seis.
    expect(screen.getAllByText('Agree')).toHaveLength(1)
  })

  it('antiespoiler: before the draw, every open window shows byte-identical footer markup — nothing in the DOM flags the future Agree (feature 017, bloque C)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    render(<Level10Harness {...baseProps} />)

    dragBy(screen.getByTestId('host-title-bar'), 10, 0)
    for (let i = 0; i < 2; i++) {
      const bars = getCloneTitleBars()
      dragBy(bars[bars.length - 1], 10, 0)
    }
    // 3 copias + la ventana nº 1 = 4 ventanas, todavía lejos del sorteo (7): `agreeWindowId` es `null`.
    expect(getCloneTitleBars()).toHaveLength(3)

    const footers = Array.from(document.querySelectorAll('[class*="level-10__buttons"]'))
    expect(footers).toHaveLength(4)
    const footerHTML = footers.map((f) => f.innerHTML)
    expect(new Set(footerHTML).size).toBe(1) // las 4 son byte-idénticas

    // Ningún atributo delata qué ventana ganará el sorteo (ids, "agree" fuera
    // del texto visible de un botón, etc.) — la única fuente de verdad es
    // `agreeWindowId`, que vive en JS, nunca en el DOM.
    expect(document.querySelectorAll('[data-window-id], [data-agree], [data-id]')).toHaveLength(0)
  })

  it('antiespoiler: after the draw, the six non-Agree windows stay byte-identical to each other — only the winning button differs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    render(<Level10Harness {...baseProps} />)

    dragBy(screen.getByTestId('host-title-bar'), 10, 0)
    for (let i = 0; i < 5; i++) {
      const bars = getCloneTitleBars()
      dragBy(bars[bars.length - 1], 10, 0)
    }
    expect(getCloneTitleBars()).toHaveLength(6)

    const footers = Array.from(document.querySelectorAll('[class*="level-10__buttons"]'))
    expect(footers).toHaveLength(7)
    const agreeFooterHTML = footers.find((f) => f.textContent?.includes('Agree'))?.innerHTML
    const losingFooterHTML = footers
      .filter((f) => f.innerHTML !== agreeFooterHTML)
      .map((f) => f.innerHTML)
    expect(losingFooterHTML).toHaveLength(6)
    expect(new Set(losingFooterHTML).size).toBe(1) // las 6 perdedoras, idénticas entre sí

    expect(document.querySelectorAll('[data-window-id], [data-agree], [data-id]')).toHaveLength(0)
  })

  it('grabbing a window brings it to the front, even one that already spawned (no re-clone)', () => {
    render(<Level10Harness {...baseProps} />)

    dragBy(screen.getByTestId('host-title-bar'), 10, 0) // host -> spawns copia 2, host pasa al frente
    const [clone2Bar] = getCloneTitleBars()
    const hostZAfterFirstDrag = Number(screen.getByTestId('window').dataset.zindex)
    const clone2Z = cloneZIndex(clone2Bar)
    expect(hostZAfterFirstDrag).toBeGreaterThan(clone2Z) // el host se llevó consigo el frente

    dragBy(clone2Bar, 10, 0) // agarrar la copia 2 la trae al frente (y pare la copia 3)
    const clone2ZAfterOwnDrag = cloneZIndex(clone2Bar)
    expect(clone2ZAfterOwnDrag).toBeGreaterThan(hostZAfterFirstDrag)

    dragBy(screen.getByTestId('host-title-bar'), 15, 0) // el host ya parió: no debe clonar más, solo volver al frente
    expect(getCloneTitleBars()).toHaveLength(2) // sigue en 2 copias, no 3
    const hostZAfterSecondDrag = Number(screen.getByTestId('window').dataset.zindex)
    expect(hostZAfterSecondDrag).toBeGreaterThan(clone2ZAfterOwnDrag)
  })

  it('unmounts cleanly (drag listeners cleaned up) without throwing', () => {
    const { unmount } = render(<Level10Harness {...baseProps} />)
    dragBy(screen.getByTestId('host-title-bar'), 50, 0)
    expect(() => unmount()).not.toThrow()
  })
})
