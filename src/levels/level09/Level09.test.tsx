import { useMemo, useRef, useState, type ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Level09 from './Level09'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'
import { CELL_COUNT, SIMULTANEOUS_COUNT } from './cycle'

const baseProps: LevelProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

/** Tiempo de sobra para que el primer ciclo (`CYCLE_MS` = 450ms en `Level09Grid.tsx`) haya disparado. */
const AFTER_FIRST_CYCLE_MS = 500

/**
 * La cuadrícula se publica vía `useLevelBoard`, no es el `return` directo de
 * `Level09` — mismo patrón que los niveles 3-8 (ver `Level08.test.tsx`).
 */
function Level09Harness(props: LevelProps) {
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
        <Level09 {...props} />
      </HostChannelContext.Provider>
      {board}
    </div>
  )
}

function getCells(): HTMLDivElement[] {
  return Array.from(document.querySelectorAll('[class*="level-09-grid__cell"]'))
}

/** Botones REALMENTE visibles ahora mismo (montaje condicional: una casilla vacía no tiene ningún `<button>` dentro). */
function getButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll('[class*="level-09-grid__button"]'))
}

function getCellButton(index: number): HTMLButtonElement | null {
  return getCells()[index]?.querySelector('button') ?? null
}

/** Da a cada casilla un rect distinto (jsdom no hace layout real) para que el hit-test por coordenadas encuentre la casilla correcta. */
function stubCellRects(container: HTMLElement, cells: HTMLElement[]) {
  container.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 1000,
      width: 1000,
      height: 1000,
      x: 0,
      y: 0,
      toJSON() {},
    }) as DOMRect
  cells.forEach((cell, i) => {
    const left = i * 50
    cell.getBoundingClientRect = () =>
      ({
        left,
        top: 0,
        right: left + 40,
        bottom: 40,
        width: 40,
        height: 40,
        x: left,
        y: 0,
        toJSON() {},
      }) as DOMRect
  })
}

/**
 * Fija `Math.random()` a un valor conocido: como `Level09Grid` siembra un
 * único `rng` compartido para todo el grid (nunca uno por casilla), el
 * valor determina EXACTAMENTE qué casillas recibe cada ciclo y de qué tipo
 * — calculado aparte reproduciendo `chooseCycleBatch` en Node.
 */
function seedRandom(randomValue: number) {
  vi.spyOn(Math, 'random').mockReturnValue(randomValue)
}

function advanceOneCycle() {
  act(() => vi.advanceTimersByTime(AFTER_FIRST_CYCLE_MS))
}

describe('Level09 (GDD Nivel 9 — Fingerprinting, 013-plan.md: ciclos sincronizados, no subida independiente por casilla)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders its own consent text inside the blue frame, like levels 1-8', () => {
    render(<Level09Harness {...baseProps} />)
    const text = document.querySelector('[class*="level-09__text"]')
    expect(text).not.toBeNull()
    expect(text?.textContent?.length).toBeGreaterThan(0)
  })

  it('renders 12 empty cells at mount (nothing spawned yet)', () => {
    render(<Level09Harness {...baseProps} />)
    expect(getCells()).toHaveLength(CELL_COUNT)
    expect(screen.queryByText('Agree')).toBeNull()
    expect(screen.queryByText('Disagree')).toBeNull()
  })

  it('after the first cycle, exactly SIMULTANEOUS_COUNT cells show a button at once, with at least one Agree (guaranteed, not probabilistic)', () => {
    render(<Level09Harness {...baseProps} />)
    advanceOneCycle()
    expect(getButtons()).toHaveLength(SIMULTANEOUS_COUNT)
    expect(screen.getAllByText('Agree').length).toBeGreaterThanOrEqual(1)
  })

  it('the next cycle clears the previous batch and fills a fresh, disjoint set of cells (verified deterministically with a seed)', () => {
    seedRandom(0.3) // ciclo 1 ocupa {5,0,7,11}; ciclo 2 ocupa {2,10,1,3} — calculado aparte, sin solapar
    render(<Level09Harness {...baseProps} />)
    advanceOneCycle()
    expect([5, 0, 7, 11].every((i) => getCellButton(i) !== null)).toBe(true)

    advanceOneCycle()
    expect([5, 0, 7, 11].every((i) => getCellButton(i) === null)).toBe(true) // el lote anterior se limpió de golpe
    expect([2, 10, 1, 3].every((i) => getCellButton(i) !== null)).toBe(true) // lote nuevo
  })

  it('clicking an Agree button wins immediately', () => {
    seedRandom(0.3) // celda 0 = agree tras el primer ciclo (calculado aparte)
    const onWin = vi.fn()
    render(<Level09Harness {...baseProps} onWin={onWin} />)
    advanceOneCycle()
    fireEvent.click(getCellButton(0) as HTMLButtonElement)
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('clicking a Disagree button loses immediately', () => {
    seedRandom(0.5) // celda 5 = disagree tras el primer ciclo (calculado aparte)
    const onLose = vi.fn()
    render(<Level09Harness {...baseProps} onLose={onLose} />)
    advanceOneCycle()
    fireEvent.click(getCellButton(5) as HTMLButtonElement)
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('touching down on a currently-visible Agree wins immediately, even if a cycle that would have cleared it fires right after (corrección de playtesting: toque real en móvil que no ganaba)', () => {
    seedRandom(0.3) // celda 0 = agree tras el primer ciclo (calculado aparte)
    const onWin = vi.fn()
    render(<Level09Harness {...baseProps} onWin={onWin} />)
    advanceOneCycle()

    const container = document.querySelector('[class*="level-09-grid"]') as HTMLElement
    stubCellRects(container, getCells())
    // Solo `pointerdown` — nunca llega a hacer falta un `click`/`pointerup`
    // para ganar: se resuelve en el mismo turno síncrono del toque, antes de
    // que el siguiente ciclo (~450ms) tenga ninguna oportunidad de borrar el
    // botón por debajo del dedo (lo que antes causaba el bug: un `click`
    // sintetizado tardío leía la casilla ya vacía y no hacía nada).
    fireEvent.pointerDown(container, { clientX: 20, clientY: 20, pointerId: 1 })
    expect(onWin).toHaveBeenCalledTimes(1)

    // El ciclo siguiente, que en el bug original se llevaba el botón por
    // delante de un `click` todavía pendiente, no cambia nada: ya se ganó.
    advanceOneCycle()
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('touching down on a currently-visible Disagree loses immediately, the same way', () => {
    seedRandom(0.5) // celda 5 = disagree tras el primer ciclo (calculado aparte)
    const onLose = vi.fn()
    render(<Level09Harness {...baseProps} onLose={onLose} />)
    advanceOneCycle()

    const container = document.querySelector('[class*="level-09-grid"]') as HTMLElement
    stubCellRects(container, getCells())
    fireEvent.pointerDown(container, { clientX: 270, clientY: 20, pointerId: 1 }) // casilla 5: left = 5*50 = 250
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('touching down on an empty cell does nothing (no false win/lose from a bare press)', () => {
    seedRandom(0.3) // celda 1 se queda vacía tras el primer ciclo (fuera de {5,0,7,11})
    const onWin = vi.fn()
    const onLose = vi.fn()
    render(<Level09Harness {...baseProps} onWin={onWin} onLose={onLose} />)
    advanceOneCycle()

    const container = document.querySelector('[class*="level-09-grid"]') as HTMLElement
    stubCellRects(container, getCells())
    fireEvent.pointerDown(container, { clientX: 70, clientY: 20, pointerId: 1 }) // casilla 1: left = 1*50 = 50
    expect(onWin).not.toHaveBeenCalled()
    expect(onLose).not.toHaveBeenCalled()
  })

  it('resolving via pointerdown does not also fire a second time from the click that follows on the same button', () => {
    seedRandom(0.3) // celda 0 = agree
    const onWin = vi.fn()
    render(<Level09Harness {...baseProps} onWin={onWin} />)
    advanceOneCycle()

    const container = document.querySelector('[class*="level-09-grid"]') as HTMLElement
    stubCellRects(container, getCells())
    fireEvent.pointerDown(container, { clientX: 20, clientY: 20, pointerId: 1 })
    expect(onWin).toHaveBeenCalledTimes(1)

    fireEvent.click(getCellButton(0) as HTMLButtonElement)
    expect(onWin).toHaveBeenCalledTimes(1) // sigue en 1: el guard evita un segundo desenlace
  })

  it('clicking an empty cell (no button inside) does nothing', () => {
    seedRandom(0.3) // celda 1 se queda vacía tras el primer ciclo (fuera de {5,0,7,11})
    const onWin = vi.fn()
    const onLose = vi.fn()
    render(<Level09Harness {...baseProps} onWin={onWin} onLose={onLose} />)
    advanceOneCycle()
    expect(getCellButton(1)).toBeNull()
    fireEvent.click(getCells()[1])
    expect(onWin).not.toHaveBeenCalled()
    expect(onLose).not.toHaveBeenCalled()
  })

  // Estas dos pruebas usan la estrategia PROACTIVA (fijar una casilla VACÍA
  // antes de que le toque nada, no "atrapar" lo que ya se ve): congelar
  // tarda ~1s (`STILLNESS_MS`), más que un ciclo entero (~450ms,
  // `CYCLE_MS`) — cualquier botón YA visible en el instante en que empiezas
  // a fijar la vista se limpia antes de que la congelación llegue a
  // completarse, así que "atrapar lo que ya se ve" nunca funciona (ni debe
  // funcionar: el GDD pide fijar la casilla ANTES). Con la semilla 0.3, la
  // celda 6 no le toca nada en los ciclos 1-2, pero SÍ en el 3 (Disagree) y
  // en el 4 (Agree) — calculado aparte reproduciendo `chooseCycleBatch`.
  it('holding the pointer still over an empty cell arms it: it catches whatever the next cycle assigns and survives later cycles that would have reassigned it', () => {
    seedRandom(0.3)
    render(<Level09Harness {...baseProps} />)
    const container = document.querySelector('[class*="level-09-grid"]') as HTMLElement
    stubCellRects(container, getCells())
    fireEvent.pointerEnter(container, { clientX: 320, clientY: 20 }) // dentro de la casilla 6, todavía vacía
    fireEvent.pointerMove(container, { clientX: 320, clientY: 20 })

    act(() => vi.advanceTimersByTime(1400)) // arma la 6 (~1s) y deja pasar el ciclo 3, que le asigna Disagree
    expect(getCellButton(6)?.textContent).toContain('Disagree')

    act(() => vi.advanceTimersByTime(500)) // ciclo 4: a la 6 le tocaría Agree de NO estar congelada
    expect(getCellButton(6)?.textContent).toContain('Disagree') // sigue igual: la congelación ganó
  })

  it('moving the pointer away unfreezes the cell, exposing it to the next cycle again', () => {
    seedRandom(0.3)
    render(<Level09Harness {...baseProps} />)
    const container = document.querySelector('[class*="level-09-grid"]') as HTMLElement
    stubCellRects(container, getCells())
    fireEvent.pointerEnter(container, { clientX: 320, clientY: 20 }) // casilla 6, vacía
    fireEvent.pointerMove(container, { clientX: 320, clientY: 20 })

    act(() => vi.advanceTimersByTime(1400)) // se arma y atrapa el Disagree del ciclo 3
    expect(getCellButton(6)?.textContent).toContain('Disagree')

    fireEvent.pointerMove(container, { clientX: 20, clientY: 400 }) // se aleja bien lejos: descongela
    act(() => vi.advanceTimersByTime(500)) // ciclo 4: a la 6 le toca Agree — y ya no está congelada para resistirlo
    expect(getCellButton(6)?.textContent).toContain('Agree') // respondió al ciclo nuevo, ya no está pegada al Disagree
  })

  it('antiespoiler: a frozen cell is structurally identical to a plain one showing the same button — nothing marks it as frozen (feature 017, bloque C)', () => {
    // Referencia "sin congelar": un Disagree corriente tras el primer ciclo.
    seedRandom(0.5) // celda 5 = disagree tras el primer ciclo (calculado aparte)
    const { unmount } = render(<Level09Harness {...baseProps} />)
    advanceOneCycle()
    const plainDisagreeClassName = getCellButton(5)?.className
    const plainWrapperClassName = getCells()[0].className
    unmount()
    vi.restoreAllMocks()

    // Ahora, la misma casilla (6) pero CONGELADA atrapando un Disagree.
    seedRandom(0.3)
    render(<Level09Harness {...baseProps} />)
    const container = document.querySelector('[class*="level-09-grid"]') as HTMLElement
    stubCellRects(container, getCells())
    fireEvent.pointerEnter(container, { clientX: 320, clientY: 20 }) // celda 6, todavía vacía
    fireEvent.pointerMove(container, { clientX: 320, clientY: 20 })
    act(() => vi.advanceTimersByTime(1400)) // arma la 6 y atrapa el Disagree del ciclo 3
    expect(getCellButton(6)?.textContent).toContain('Disagree')

    expect(getCellButton(6)?.className).toBe(plainDisagreeClassName)
    // Los 12 wrappers, congelado incluido, comparten SIEMPRE la misma clase:
    // el estado "frozen" vive solo en `cell.ts`, nunca se refleja en el DOM.
    const wrapperClassNames = getCells().map((c) => c.className)
    expect(new Set(wrapperClassNames)).toEqual(new Set([plainWrapperClassName]))
    expect(document.querySelectorAll('[data-frozen], [data-armed]')).toHaveLength(0)
  })

  it('does not accept clicks while paused (buttons disabled)', () => {
    seedRandom(0.3)
    render(<Level09Harness {...baseProps} paused={true} />)
    advanceOneCycle()
    // En pausa el reloj no debería ni haber corrido el primer ciclo, pero por si acaso: nada clicable.
    expect(getButtons().every((btn) => btn.disabled)).toBe(true)
  })

  it('freezes all cycling while paused: no new batch appears', () => {
    const { rerender } = render(<Level09Harness {...baseProps} />)
    rerender(<Level09Harness {...baseProps} paused={true} />)
    advanceOneCycle()
    advanceOneCycle()
    expect(getButtons()).toHaveLength(0) // nunca llegó a correr el primer ciclo
  })

  it('unmounts cleanly (grid clock + pointer listeners torn down) without throwing', () => {
    const { unmount } = render(<Level09Harness {...baseProps} />)
    advanceOneCycle()
    expect(() => unmount()).not.toThrow()
  })

  it('does not keep animating after unmount (no leaked rAF loop)', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')
    const { unmount } = render(<Level09Harness {...baseProps} />)
    act(() => vi.advanceTimersByTime(100))
    unmount()
    expect(cancelSpy).toHaveBeenCalled()
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow()
  })
})
