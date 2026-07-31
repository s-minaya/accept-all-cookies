import { useMemo, useRef, useState, type ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Level08 from './Level08'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'
import { createRng } from '../../utils/prng'
import { createShuffleScript, CELL_COUNT, ROUND_DURATIONS_MS } from './shuffle'

const baseProps: LevelProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

/**
 * La cuadrícula se publica vía `useLevelBoard`, no es el `return` directo de
 * `Level08` — mismo patrón que los niveles 3-7 (ver `Level06.test.tsx`).
 */
function Level08Harness(props: LevelProps) {
  const [board, setBoard] = useState<ReactNode>(null)
  const windowRef = useRef<HTMLDivElement>(null)

  const channel: HostChannelValue = useMemo(
    () => ({ setFooter: () => {}, setWindowTransform: () => {}, windowRef, setBoard }),
    [],
  )

  return (
    <div ref={windowRef}>
      <HostChannelContext.Provider value={channel}>
        <Level08 {...props} />
      </HostChannelContext.Provider>
      {board}
    </div>
  )
}

/** Tiempo de sobra para completar flip (400ms) + las 3 rondas (2000+1500+1000ms). */
const FULL_SHUFFLE_MS = 6000

function finishShuffle() {
  act(() => vi.advanceTimersByTime(FULL_SHUFFLE_MS))
}

function getCells(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll('[class*="level-08-grid__cell"]'))
}

/**
 * Fija `Math.random()` a un valor conocido y devuelve el guion exacto que
 * `Level08` va a generar (misma fórmula que el componente:
 * `createShuffleScript(createRng(Math.floor(Math.random() * 0xffffffff)))`)
 * — así los tests de victoria/derrota pueden saber de antemano qué botón
 * gana sin depender del azar real.
 */
function seedRandom(randomValue: number) {
  vi.spyOn(Math, 'random').mockReturnValue(randomValue)
  return createShuffleScript(createRng(Math.floor(randomValue * 0xffffffff)))
}

describe('Level08 (GDD Nivel 8 — Third-Party Providers, el trilero, 012-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders its own consent text inside the blue frame, like levels 1-7', () => {
    render(<Level08Harness {...baseProps} />)
    const text = document.querySelector('[class*="level-08__text"]')
    expect(text).not.toBeNull()
    expect(text?.textContent?.length).toBeGreaterThan(0)
  })

  it('reveal: renders 12 cells, exactly 1 Agree and 11 Disagree', () => {
    render(<Level08Harness {...baseProps} />)
    expect(getCells()).toHaveLength(CELL_COUNT)
    expect(screen.getAllByText('Agree')).toHaveLength(1)
    expect(screen.getAllByText('Disagree')).toHaveLength(11)
  })

  it('clicking a Disagree cell during reveal calls onLose(failed) immediately', () => {
    const onLose = vi.fn()
    render(<Level08Harness {...baseProps} onLose={onLose} />)
    fireEvent.click(screen.getAllByText('Disagree')[0])
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('clicking the Agree cell during reveal does not win immediately: it starts the flip and disables every cell', () => {
    const onWin = vi.fn()
    render(<Level08Harness {...baseProps} onWin={onWin} />)
    fireEvent.click(screen.getByText('Agree'))
    expect(onWin).not.toHaveBeenCalled()
    expect(getCells().every((cell) => cell.disabled)).toBe(true)
  })

  it('after the flip + all 3 rounds finish, every cell shows the neutral "???" face and is enabled again (choosing)', () => {
    render(<Level08Harness {...baseProps} />)
    fireEvent.click(screen.getByText('Agree'))
    finishShuffle()

    const cells = getCells()
    expect(cells.every((cell) => !cell.disabled)).toBe(true)
    expect(screen.getAllByText('???')).toHaveLength(CELL_COUNT)
    expect(screen.queryByText('Agree')).toBeNull()
    expect(screen.queryByText('Disagree')).toBeNull()
  })

  it('indistinguishability: after the flip, all 12 cells share the exact same class list (nothing in the DOM marks the original Agree)', () => {
    render(<Level08Harness {...baseProps} />)
    fireEvent.click(screen.getByText('Agree'))
    finishShuffle()

    const classNames = getCells().map((cell) => cell.className)
    expect(new Set(classNames).size).toBe(1)
  })

  it('clicking a cell mid-shuffle has no effect (input ignored while flipping/shuffling)', () => {
    const onWin = vi.fn()
    const onLose = vi.fn()
    render(<Level08Harness {...baseProps} onWin={onWin} onLose={onLose} />)
    fireEvent.click(screen.getByText('Agree'))

    act(() => vi.advanceTimersByTime(1000)) // a mitad del flip/primera ronda, no completado
    getCells().forEach((cell) => fireEvent.click(cell))

    expect(onWin).not.toHaveBeenCalled()
    expect(onLose).not.toHaveBeenCalled()
  })

  it('choosing: picking the cell that was originally Agree wins; picking any other loses', () => {
    const script = seedRandom(0.37)
    const onWin = vi.fn()
    render(<Level08Harness {...baseProps} onWin={onWin} />)
    fireEvent.click(screen.getByText('Agree'))
    finishShuffle()

    // El botón con identidad estable `script.agreeIndex` es el que ERA
    // Agree, sin importar a qué celda se haya movido — se localiza por su
    // posición en el DOM en el momento del reveal (el orden de montaje de
    // los 12 nodos nunca cambia, solo su `transform`).
    const cells = getCells()
    fireEvent.click(cells[script.agreeIndex])
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('choosing: picking a cell that was never Agree calls onLose(failed)', () => {
    const script = seedRandom(0.81)
    const onLose = vi.fn()
    render(<Level08Harness {...baseProps} onLose={onLose} />)
    fireEvent.click(screen.getByText('Agree'))
    finishShuffle()

    const otherButtonId = script.agreeIndex === 0 ? 1 : 0
    fireEvent.click(getCells()[otherButtonId])
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('does not accept any input while paused, from the very first render', () => {
    render(<Level08Harness {...baseProps} paused={true} />)
    expect(getCells().every((cell) => cell.disabled)).toBe(true)
  })

  it('freezes an in-progress shuffle while paused: no phase progress until resumed', () => {
    const { rerender } = render(<Level08Harness {...baseProps} />)
    fireEvent.click(screen.getByText('Agree'))
    act(() => vi.advanceTimersByTime(200)) // a medio flip

    rerender(<Level08Harness {...baseProps} paused={true} />)
    act(() => vi.advanceTimersByTime(FULL_SHUFFLE_MS)) // de sobra para terminar si NO estuviera en pausa
    expect(getCells().every((cell) => cell.disabled)).toBe(true) // sigue congelado, nunca llegó a "choosing"

    rerender(<Level08Harness {...baseProps} paused={false} />)
    finishShuffle()
    expect(getCells().every((cell) => !cell.disabled)).toBe(true)
  })

  it('the 3 shuffle rounds respect the documented durations end to end (total elapsed matches flip + rounds)', () => {
    render(<Level08Harness {...baseProps} />)
    fireEvent.click(screen.getByText('Agree'))

    const almostDone = 400 + ROUND_DURATIONS_MS.reduce((a, b) => a + b, 0) - 100
    act(() => vi.advanceTimersByTime(almostDone))
    expect(getCells().every((cell) => cell.disabled)).toBe(true) // todavía no ha terminado la última ronda

    act(() => vi.advanceTimersByTime(200)) // cruza el final de la última ronda
    expect(getCells().every((cell) => !cell.disabled)).toBe(true)
  })

  it('unmounts cleanly mid-shuffle (phase clock destroyed) without throwing', () => {
    const { unmount } = render(<Level08Harness {...baseProps} />)
    fireEvent.click(screen.getByText('Agree'))
    act(() => vi.advanceTimersByTime(200))
    expect(() => unmount()).not.toThrow()
  })

  it('does not keep animating after unmount (no leaked rAF loop)', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')
    const { unmount } = render(<Level08Harness {...baseProps} />)
    fireEvent.click(screen.getByText('Agree'))
    act(() => vi.advanceTimersByTime(200)) // el reloj de fases está vivo, con un rAF pendiente

    unmount()
    expect(cancelSpy).toHaveBeenCalled() // `destroy()` canceló el rAF pendiente en el cleanup
    expect(() => vi.advanceTimersByTime(FULL_SHUFFLE_MS)).not.toThrow()
  })
})
