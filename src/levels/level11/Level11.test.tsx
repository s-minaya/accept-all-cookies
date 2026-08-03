import { useMemo, useRef, useState, type ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { audioManager } from '../../audio/AudioManager'
import Level11 from './Level11'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'

const baseProps: LevelProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

/**
 * Sobra para que cualquier pregunta del guion (la más larga, ~62
 * caracteres × 25ms/carácter = ~1550ms) termine de escribirse Y pase el
 * margen de desbloqueo (`ANSWER_UNLOCK_MS`, 200ms) de sobra.
 */
const FINISH_WRITING_MS = 3000

/**
 * El tablero (`Level11Board`, Sans + bocadillo) se publica vía el canal, no
 * es el `return` directo de `Level11` — mismo patrón que los niveles 3-10
 * (ver `Level09.test.tsx`). Sin pie de ventana (corregido tras revisión de
 * Sofía): `setFooter` se deja como no-op, igual que en `Level09.test.tsx`.
 */
function Level11Harness(props: LevelProps) {
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
        <Level11 {...props} />
      </HostChannelContext.Provider>
      {board}
    </div>
  )
}

function finishWriting() {
  act(() => {
    vi.advanceTimersByTime(FINISH_WRITING_MS)
  })
}

function getBubbleText(): string {
  return document.querySelector('[class*="level-11__bubble-text"]')?.textContent ?? ''
}

function answerNo() {
  fireEvent.click(screen.getByText('No'))
}

function answerYes() {
  fireEvent.click(screen.getByText('Sí'))
}

/** Recorrido completo correcto: No, No, No, Yes, No, No, No, Yes — escribiendo cada pregunta antes de responder. */
function playFullCorrectRound(times = 2) {
  const answers: Array<() => void> = [answerNo, answerNo, answerNo, answerYes]
  for (let round = 0; round < times; round++) {
    for (const respond of answers) {
      finishWriting()
      respond()
    }
  }
}

describe('Level11 (GDD Nivel 11 — Consent Renewal, 015-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders its own consent text inside the blue frame, like levels 1-10', () => {
    render(<Level11Harness {...baseProps} />)
    const text = document.querySelector('[class*="level-11__text"]')
    expect(text).not.toBeNull()
    expect(text?.textContent?.length).toBeGreaterThan(0)
  })

  it('has no footer at all — no Disagree decoy, no Agree, all interaction lives in the bubble (corregido tras revisión de Sofía)', () => {
    render(<Level11Harness {...baseProps} />)
    expect(screen.queryByText('Disagree')).toBeNull()
    expect(screen.queryByText('Agree')).toBeNull()
  })

  it('starts on the first question, with No and Yes present but disabled while writing', () => {
    render(<Level11Harness {...baseProps} />)
    const noButton = screen.getByText('No').closest('button') as HTMLButtonElement
    const yesButton = screen.getByText('Sí').closest('button') as HTMLButtonElement
    expect(noButton).toBeDisabled()
    expect(yesButton).toBeDisabled()
  })

  it('reveals the question letter by letter and enables No/Yes once done (+ unlock margin)', () => {
    render(<Level11Harness {...baseProps} />)
    act(() => vi.advanceTimersByTime(150))
    const revealedEarly = getBubbleText()
    expect(revealedEarly.length).toBeGreaterThan(0)

    finishWriting()
    const noButton = screen.getByText('No').closest('button') as HTMLButtonElement
    expect(noButton).not.toBeDisabled()
  })

  it('a rapid burst of clicks while still writing does not chain two answers (buttons stay disabled)', () => {
    const onWin = vi.fn()
    const onLose = vi.fn()
    render(<Level11Harness {...baseProps} onWin={onWin} onLose={onLose} />)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('No'))
      fireEvent.click(screen.getByText('Sí'))
    }
    expect(onWin).not.toHaveBeenCalled()
    expect(onLose).not.toHaveBeenCalled()
  })

  it('answering correctly (No) advances to the next question', () => {
    render(<Level11Harness {...baseProps} />)
    finishWriting()
    const firstQuestion = getBubbleText()
    answerNo()
    finishWriting()
    expect(getBubbleText()).not.toBe(firstQuestion)
  })

  it('answering incorrectly loses immediately, at every one of the 8 positions', () => {
    for (let position = 0; position < 8; position++) {
      const onLose = vi.fn()
      const { unmount } = render(<Level11Harness {...baseProps} onLose={onLose} />)
      // Responde CORRECTAMENTE los pasos 0..position-1 para llegar hasta `position`.
      for (let step = 0; step < position; step++) {
        finishWriting()
        const correctIsYes = step === 3 || step === 7
        if (correctIsYes) answerYes()
        else answerNo()
      }
      finishWriting()
      // En `position`, responde lo CONTRARIO de lo esperado.
      const correctIsYesAtPosition = position === 3 || position === 7
      if (correctIsYesAtPosition) answerNo()
      else answerYes()
      expect(onLose).toHaveBeenCalledWith('failed')
      unmount()
    }
  })

  it('wins with the standard flow after the 8th correct answer (two identical rounds of No, No, No, Yes)', () => {
    const onWin = vi.fn()
    render(<Level11Harness {...baseProps} onWin={onWin} />)
    playFullCorrectRound()
    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('there is no progress indicator and no visual difference between round 1 and round 2', () => {
    render(<Level11Harness {...baseProps} />)
    finishWriting()
    const q1RoundOne = getBubbleText()
    answerNo()
    finishWriting()
    answerNo()
    finishWriting()
    answerNo()
    finishWriting()
    answerYes() // completa la primera vuelta, empieza la segunda
    finishWriting()
    expect(getBubbleText()).toBe(q1RoundOne) // misma pregunta 1, sin ningún indicador de "vuelta 2"
  })

  it('tapping the bubble while writing skips straight to the full text', () => {
    render(<Level11Harness {...baseProps} />)
    const bubble = document.querySelector('[class*="level-11__bubble"]') as HTMLElement
    act(() => vi.advanceTimersByTime(20)) // a mitad de escribir
    fireEvent.pointerDown(bubble)
    const noButton = screen.getByText('No').closest('button') as HTMLButtonElement
    // El texto ya está completo, pero el margen de desbloqueo (ANSWER_UNLOCK_MS) sigue aplicando.
    expect(noButton).toBeDisabled()
    act(() => vi.advanceTimersByTime(300))
    expect(noButton).not.toBeDisabled()
  })

  it('does not accept answers while paused (buttons stay disabled even once written)', () => {
    render(<Level11Harness {...baseProps} paused={true} />)
    act(() => vi.advanceTimersByTime(FINISH_WRITING_MS))
    const noButton = screen.getByText('No').closest('button') as HTMLButtonElement
    expect(noButton).toBeDisabled()
  })

  it('freezes writing while paused: no more characters reveal', () => {
    const { rerender } = render(<Level11Harness {...baseProps} />)
    act(() => vi.advanceTimersByTime(150))
    const revealedBeforePause = getBubbleText()
    expect(revealedBeforePause.length).toBeGreaterThan(0)
    rerender(<Level11Harness {...baseProps} paused={true} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(getBubbleText()).toBe(revealedBeforePause)
  })

  it('never leaves the music ducked after leaving the level mid-sentence (unmount safety net)', () => {
    const unduckMusic = vi.spyOn(audioManager, 'unduckMusic')
    const { unmount } = render(<Level11Harness {...baseProps} />)
    act(() => vi.advanceTimersByTime(20)) // a mitad de escribir la primera pregunta
    unmount()
    expect(unduckMusic).toHaveBeenCalled()
  })

  it('unmounts cleanly (typewriter clock + audio) without throwing', () => {
    const { unmount } = render(<Level11Harness {...baseProps} />)
    finishWriting()
    expect(() => unmount()).not.toThrow()
  })
})
