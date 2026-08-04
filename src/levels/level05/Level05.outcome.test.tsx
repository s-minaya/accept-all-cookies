import { useMemo, useRef, useState, type ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'
import type { ReelSymbol } from './reels'

// `reels.ts` simulado: la física de scroll (rAF) hace que el offset exacto
// al pulsar Stop no sea determinista sin exponer timing exacto — en vez de
// eso, cada tira mockeada tiene un ÚNICO símbolo repetido, así que
// CUALQUIER índice resultante da siempre el mismo resultado (mismo criterio
// que `Level04.outcome.test.tsx`: mockear la pieza no determinista, probar
// solo el cableado de desenlace). `vi.mock` se sube por encima de los
// imports, así que `import Level05 from './Level05'` ya recibe esta
// versión.
const REEL_LENGTH = 12
function uniformReel(symbol: ReelSymbol): ReelSymbol[] {
  return Array(REEL_LENGTH).fill(symbol)
}

const generateReelMock =
  vi.fn<(rng: () => number, length?: number, ratio?: number) => ReelSymbol[]>()

vi.mock('./reels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./reels')>()
  return {
    ...actual,
    generateReel: (rng: () => number, length?: number, ratio?: number) =>
      generateReelMock(rng, length, ratio),
  }
})

import Level05 from './Level05'

const baseProps: LevelProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

function Level05Harness(props: LevelProps) {
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
        <Level05 {...props} />
      </HostChannelContext.Provider>
      {board}
    </div>
  )
}

function stopAll() {
  const stops = screen.getAllByText('Parar').map((el) => el.closest('button') as HTMLButtonElement)
  for (const stop of stops) fireEvent.click(stop)
  return stops
}

describe('Level05 — desenlaces (GDD Nivel 5, 009-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    generateReelMock.mockReset()
    // Red de seguridad: la rehabilitación ahora regenera las tres tiras
    // (más llamadas a `generateReel` de las que algunos tests configuran
    // explícitamente con `mockReturnValueOnce`); sin este valor por defecto,
    // esas llamadas de más devolverían `undefined` y romperían `Reel`.
    generateReelMock.mockReturnValue(uniformReel('disagree'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('triple Agree on the third Stop calls onWin() immediately', () => {
    generateReelMock
      .mockReturnValueOnce(uniformReel('agree'))
      .mockReturnValueOnce(uniformReel('agree'))
      .mockReturnValueOnce(uniformReel('agree'))
    const onWin = vi.fn()
    render(<Level05Harness {...baseProps} onWin={onWin} />)

    stopAll()

    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('triple Disagree on the third Stop calls onLose(failed) immediately, no respin', () => {
    generateReelMock
      .mockReturnValueOnce(uniformReel('disagree'))
      .mockReturnValueOnce(uniformReel('disagree'))
      .mockReturnValueOnce(uniformReel('disagree'))
    const onLose = vi.fn()
    render(<Level05Harness {...baseProps} onLose={onLose} />)

    stopAll()

    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('a mixed result does not call onWin/onLose — the Stops stay disabled during the pause, then rehabilitate and the reels spin again', () => {
    generateReelMock
      .mockReturnValueOnce(uniformReel('agree'))
      .mockReturnValueOnce(uniformReel('disagree'))
      .mockReturnValueOnce(uniformReel('agree'))
    const onWin = vi.fn()
    const onLose = vi.fn()
    render(<Level05Harness {...baseProps} onWin={onWin} onLose={onLose} />)

    const stops = stopAll()
    expect(onWin).not.toHaveBeenCalled()
    expect(onLose).not.toHaveBeenCalled()
    expect(stops.every((btn) => btn.disabled)).toBe(true)

    // Todavía en plena pausa: sigue sin rehabilitarse.
    act(() => vi.advanceTimersByTime(400))
    expect(stops.every((btn) => btn.disabled)).toBe(true)

    // Pasada la pausa (~1s): rehabilitados y girando de nuevo.
    act(() => vi.advanceTimersByTime(700))
    expect(stops.every((btn) => !btn.disabled)).toBe(true)
    expect(onWin).not.toHaveBeenCalled()
    expect(onLose).not.toHaveBeenCalled()
  })

  it('after rehabilitating, the reels are regenerated with a new order — a second round can reach a different outcome than the first', () => {
    generateReelMock
      // Primera ronda: mixta, dispara la rehabilitación.
      .mockReturnValueOnce(uniformReel('agree'))
      .mockReturnValueOnce(uniformReel('disagree'))
      .mockReturnValueOnce(uniformReel('agree'))
      // Segunda ronda (tiras nuevas tras la rehabilitación): triple Agree.
      .mockReturnValueOnce(uniformReel('agree'))
      .mockReturnValueOnce(uniformReel('agree'))
      .mockReturnValueOnce(uniformReel('agree'))
    const onWin = vi.fn()
    const onLose = vi.fn()
    render(<Level05Harness {...baseProps} onWin={onWin} onLose={onLose} />)

    stopAll()
    expect(onWin).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1200)) // rehabilitación

    const stopsAfter = screen
      .getAllByText('Parar')
      .map((el) => el.closest('button') as HTMLButtonElement)
    expect(stopsAfter.every((btn) => !btn.disabled)).toBe(true)
    for (const stop of stopsAfter) fireEvent.click(stop)

    // Corrección de playtesting (GDD Nivel 5): cada rehabilitación regenera
    // las tres tiras con un nuevo orden, así que un segundo intento puede dar
    // un resultado distinto al primero — aquí, la victoria que la ronda
    // anterior (con las tiras viejas) no podía dar.
    expect(generateReelMock).toHaveBeenCalledTimes(6)
    expect(onWin).toHaveBeenCalledTimes(1)
    expect(onLose).not.toHaveBeenCalled()
  })

  it('the respin pause freezes while paused (does not rehabilitate no matter how long) and resumes correctly once unpaused', () => {
    generateReelMock
      .mockReturnValueOnce(uniformReel('agree'))
      .mockReturnValueOnce(uniformReel('disagree'))
      .mockReturnValueOnce(uniformReel('agree'))
    const { rerender } = render(<Level05Harness {...baseProps} />)

    stopAll()
    act(() => vi.advanceTimersByTime(400))

    rerender(<Level05Harness {...baseProps} paused={true} />)
    // Mucho más que la pausa configurada (1s): si `paused` no la congelara
    // de verdad, esto ya habría rehabilitado.
    act(() => vi.advanceTimersByTime(5000))

    let stops = screen.getAllByText('Parar').map((el) => el.closest('button') as HTMLButtonElement)
    expect(stops.every((btn) => btn.disabled)).toBe(true)

    rerender(<Level05Harness {...baseProps} paused={false} />)
    // `useCountdown` cuenta por ticks de 1s completos, no como un cronómetro
    // preciso: reanudar no conserva el progreso fraccionario de antes de la
    // pausa (ver `useCountdown.test.ts`, "pauses and resumes"), así que hace
    // falta un tick de 1s entero desde la reanudación, no el resto de "~1s
    // menos lo ya transcurrido".
    act(() => vi.advanceTimersByTime(1000))

    stops = screen.getAllByText('Parar').map((el) => el.closest('button') as HTMLButtonElement)
    expect(stops.every((btn) => !btn.disabled)).toBe(true)
  })
})
