import { useMemo, useRef, useState, type ReactNode } from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'
import type { BoardOptions, BoardSimulation } from './board'

let capturedOnCapture: BoardOptions['onCapture'] | null = null

// `board.ts` simulado por completo: la física real no es determinista (ver
// nota en Level04.test.tsx), así que aquí se dispara `onCapture` a mano
// para probar SOLO el cableado del desenlace pendiente — nada de física.
// `vi.mock` se sube (hoist) por encima de los imports de abajo, así que el
// `import Level04 from './Level04'` normal ya recibe esta versión simulada.
vi.mock('./board', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./board')>()
  return {
    ...actual,
    createBoardSimulation: vi.fn((options: BoardOptions): BoardSimulation => {
      capturedOnCapture = options.onCapture
      return { setPaused: vi.fn(), destroy: vi.fn() }
    }),
  }
})

import Level04 from './Level04'
import { createBoardSimulation } from './board'

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

function getPaddle(container: HTMLElement): HTMLElement {
  return container.querySelector('[class*="level-04__paddle"]') as HTMLElement
}

/**
 * Una vez el botón que recoge los que caen se vuelve agree o disagree del
 * todo, se bloquea (no se puede deslizar) y el jugador debe pulsarlo para
 * confirmar — igual que cualquier Agree/Disagree real del juego, el
 * desenlace ya no se dispara solo al llenarse los 6 segmentos: la paleta se
 * bloquea y espera un clic (o Enter/Espacio con foco) para confirmarlo.
 */
describe('Level04 — desenlace pendiente de confirmar con un clic en la paleta', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockPointer(false)
    capturedOnCapture = null
    vi.mocked(createBoardSimulation).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does not call onWin as soon as 6 Agree are captured — the paddle just locks and becomes clickable', () => {
    const onWin = vi.fn()
    const { container } = render(<Level04Harness {...baseProps} onWin={onWin} />)
    expect(capturedOnCapture).not.toBeNull()

    act(() => {
      for (let i = 0; i < 6; i++) capturedOnCapture!('agree')
    })

    expect(onWin).not.toHaveBeenCalled()
    const paddle = getPaddle(container)
    expect(paddle.getAttribute('aria-disabled')).toBe('false')
    expect(paddle.getAttribute('tabindex')).toBe('0')

    fireEvent.click(paddle)
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('does not call onLose as soon as 6 Disagree are captured — the paddle just locks and becomes clickable', () => {
    const onLose = vi.fn()
    const { container } = render(<Level04Harness {...baseProps} onLose={onLose} />)

    act(() => {
      for (let i = 0; i < 6; i++) capturedOnCapture!('disagree')
    })

    expect(onLose).not.toHaveBeenCalled()
    fireEvent.click(getPaddle(container))
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('the paddle is not a confirm target before the outcome is decided', () => {
    const onWin = vi.fn()
    const { container } = render(<Level04Harness {...baseProps} onWin={onWin} />)
    const paddle = getPaddle(container)
    expect(paddle.getAttribute('aria-disabled')).toBe('true')
    expect(paddle.getAttribute('tabindex')).toBe('-1')

    fireEvent.click(paddle)
    expect(onWin).not.toHaveBeenCalled()
  })

  it('Enter on the focused, locked paddle also confirms the outcome (keyboard access)', () => {
    const onWin = vi.fn()
    const { container } = render(<Level04Harness {...baseProps} onWin={onWin} />)

    act(() => {
      for (let i = 0; i < 6; i++) capturedOnCapture!('agree')
    })

    fireEvent.keyDown(getPaddle(container), { key: 'Enter' })
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('freezes the board simulation once the outcome is decided, on top of any host `paused`', () => {
    render(<Level04Harness {...baseProps} />)
    const simulation = vi.mocked(createBoardSimulation).mock.results[0].value as BoardSimulation

    act(() => {
      for (let i = 0; i < 6; i++) capturedOnCapture!('agree')
    })

    expect(simulation.setPaused).toHaveBeenLastCalledWith(true)
  })
})
