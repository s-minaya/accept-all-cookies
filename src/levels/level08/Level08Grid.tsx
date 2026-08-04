import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useT } from '../../i18n/useT'
import { useAudio } from '../../audio/useAudio'
import { XPButton } from '../../components/xp/XPButton'
import type { LoseReason } from '../types'
import { applySwaps, CELL_COUNT, type ShuffleScript } from './shuffle'
import { buildSegments, canAcceptClick, type LevelPhase, type Segment } from './phases'
import { createPhaseClock, type PhaseClock } from './phaseClock'
import styles from './Level08.module.scss'

/**
 * Duración del giro de 180° (GDD §14, "~400 ms"): la misma constante rige
 * tanto el flip inicial en masa (los 12 botones ocultando su identidad) como
 * el giro individual del botón elegido al confirmar en `choosing`
 * (corrección de playtesting: "que se dé la vuelta antes de salir el
 * veredicto") — es el mismo gesto visual, solo que aplicado a un botón en
 * vez de a doce.
 */
const FLIP_DURATION_MS = 400
/** Columnas de respaldo (escritorio/tablet) hasta la primera lectura real de `--grid-cols`; ver `readGridCols`. */
const DEFAULT_GRID_COLS = 4

const BUTTON_IDS = Array.from({ length: CELL_COUNT }, (_, i) => i)

function identityCellOfButton(): number[] {
  return [...BUTTON_IDS]
}

/** `buttonAtCell[cell] = buttonId` → `cellOfButton[buttonId] = cell` (la inversa de una permutación es otra permutación). */
function invert(buttonAtCell: readonly number[]): number[] {
  const cellOfButton = new Array<number>(buttonAtCell.length)
  buttonAtCell.forEach((buttonId, cell) => {
    cellOfButton[buttonId] = cell
  })
  return cellOfButton
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function cellRowCol(cellIndex: number, cols: number): { row: number; col: number } {
  return { row: Math.floor(cellIndex / cols), col: cellIndex % cols }
}

/**
 * Lee `--grid-cols` que esté aplicando el CSS EN ESE MOMENTO (4 en md+, 3 en
 * xs/sm, `Level08.module.scss`) — mismo patrón que `readCellSizePx` del
 * nivel 6: la conversión celda→fila/columna depende de este valor, así que
 * tiene que leerse de verdad en vez de asumir un valor fijo.
 */
function readGridCols(el: HTMLElement): number {
  const raw = getComputedStyle(el).getPropertyValue('--grid-cols').trim()
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GRID_COLS
}

export interface Level08GridProps {
  script: ShuffleScript
  onWin: () => void
  onLose: (reason: LoseReason) => void
  paused: boolean
}

/**
 * La cuadrícula de los 12 botones, en un componente propio (no inline dentro
 * de `Level08.tsx`): se publica vía `useLevelBoard`, que la monta en el árbol
 * de `LevelHost` UN CICLO DE RENDER DESPUÉS del propio `Level08` (igual que
 * el pie del nivel 7, `Level07.tsx`) — un `useLayoutEffect` definido en
 * `Level08` leyendo sus propios refs se ejecutaría antes de que esos nodos
 * existan de verdad en el DOM (bug real, encontrado con Playwright: los 12
 * botones se quedaban apilados en `(0,0)`, un Disagree tapando al Agree).
 * Al vivir aquí, el `useLayoutEffect` de este componente se dispara junto
 * con SU PROPIO montaje, sea cuando sea — mismo patrón que `Board.tsx`
 * (nivel 6).
 */
export function Level08Grid({ script, onWin, onLose, paused }: Level08GridProps) {
  const t = useT()
  const { playCoin } = useAudio()

  const [phase, setPhase] = useState<LevelPhase>('reveal')
  const [faceFlipped, setFaceFlipped] = useState(false)
  const [optionSlot, setOptionSlot] = useState<number[]>(() => identityCellOfButton())
  // Botón que el jugador confirmó en `choosing`, mientras se da la vuelta
  // hacia su cara real antes del veredicto — `null` el resto del tiempo, así
  // que ningún otro botón se ve afectado por este giro individual.
  const [revealedButtonId, setRevealedButtonId] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const gridColsRef = useRef(DEFAULT_GRID_COLS)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>(Array(CELL_COUNT).fill(null))
  const buttonAtCellRef = useRef<number[]>(identityCellOfButton())
  const roundStartRef = useRef<number[]>(identityCellOfButton())
  const roundEndRef = useRef<number[]>(identityCellOfButton())
  const faceFlippedRef = useRef(false)
  // Misma idea que `faceFlippedRef`, pero para el giro individual del botón
  // elegido: evita llamar a `setRevealedButtonId` en cada fotograma tras
  // cruzar el canto, solo una vez.
  const revealedButtonIdRef = useRef<number | null>(null)
  const phaseClockRef = useRef<PhaseClock | null>(null)

  function writeCellPosition(buttonId: number, row: number, col: number) {
    const el = buttonRefs.current[buttonId]
    el?.style.setProperty('--cell-row', String(row))
    el?.style.setProperty('--cell-col', String(col))
  }

  function writeCellFlipAngle(buttonId: number, angleDeg: number) {
    buttonRefs.current[buttonId]?.style.setProperty('--cell-flip-angle', `${angleDeg}deg`)
  }

  function positionAllAtRest() {
    const cols = gridColsRef.current
    identityCellOfButton().forEach((buttonId) => {
      const { row, col } = cellRowCol(buttonId, cols)
      writeCellPosition(buttonId, row, col)
    })
  }

  // Lectura síncrona antes del primer pintado (igual que `Board.tsx`): sin
  // esto, el primer fotograma en móvil podría usar todavía la cuenta de
  // columnas de escritorio.
  useLayoutEffect(() => {
    if (containerRef.current) gridColsRef.current = readGridCols(containerRef.current)
    positionAllAtRest()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe posicionar en el montaje; el resto de movimientos los dirige el reloj de fases.
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      gridColsRef.current = readGridCols(el)
      // Un cambio de ancho no es una ronda de barajado: reposiciona cada
      // botón en su celda ACTUAL (buttonAtCellRef ya refleja dónde está)
      // sin animación, para no confundir el redimensionado con una jugada.
      const cellOfButton = invert(buttonAtCellRef.current)
      const cols = gridColsRef.current
      cellOfButton.forEach((cell, buttonId) => {
        const { row, col } = cellRowCol(cell, cols)
        writeCellPosition(buttonId, row, col)
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    phaseClockRef.current?.setPaused(paused)
  }, [paused])

  useEffect(() => {
    return () => {
      phaseClockRef.current?.destroy()
      phaseClockRef.current = null
    }
  }, [])

  const finishRound = useCallback(() => {
    BUTTON_IDS.forEach((buttonId) => {
      const el = buttonRefs.current[buttonId]
      if (el) el.style.zIndex = ''
    })
  }, [])

  const startShuffle = useCallback(() => {
    const segments = buildSegments(script, FLIP_DURATION_MS)

    phaseClockRef.current = createPhaseClock<Segment>({
      segments,
      onSegmentStart: (segment) => {
        if (segment.kind === 'flip') {
          setPhase('flip')
          return
        }

        const round = script.rounds[segment.roundIndex]
        const startCellOfButton = invert(buttonAtCellRef.current)
        const newButtonAtCell = applySwaps(buttonAtCellRef.current, round.swaps)
        const endCellOfButton = invert(newButtonAtCell)

        roundStartRef.current = startCellOfButton
        roundEndRef.current = endCellOfButton
        buttonAtCellRef.current = newButtonAtCell

        BUTTON_IDS.forEach((buttonId) => {
          const el = buttonRefs.current[buttonId]
          if (!el) return
          el.style.zIndex = startCellOfButton[buttonId] !== endCellOfButton[buttonId] ? '2' : ''
        })

        setPhase('shuffling')
      },
      onFrame: (segment, _index, progress) => {
        if (segment.kind === 'flip') {
          // Ángulo triangular (0° → 90° → 0°, no 0° → 180°): sin una cara
          // trasera real en el DOM (el texto/variant simplemente se
          // sustituye, no hay dos elementos apilados), terminar el giro en
          // 180° dejaría el texto reflejado. Girando de vuelta a 0° tras el
          // canto (90°, el instante en que el botón se ve de perfil y por
          // tanto invisible/ilegible) el botón siempre queda leíble en
          // reposo — el contenido se sustituye justo en ese canto.
          const angleDeg = (progress < 0.5 ? progress : 1 - progress) * 180
          containerRef.current?.style.setProperty('--flip-angle', `${angleDeg}deg`)
          if (progress >= 0.5 && !faceFlippedRef.current) {
            faceFlippedRef.current = true
            setFaceFlipped(true)
          }
          return
        }

        const cols = gridColsRef.current
        BUTTON_IDS.forEach((buttonId) => {
          const startCell = roundStartRef.current[buttonId]
          const endCell = roundEndRef.current[buttonId]
          if (startCell === endCell) return
          const start = cellRowCol(startCell, cols)
          const end = cellRowCol(endCell, cols)
          writeCellPosition(
            buttonId,
            lerp(start.row, end.row, progress),
            lerp(start.col, end.col, progress),
          )
        })
      },
      onComplete: () => {
        finishRound()
        setOptionSlot(invert(buttonAtCellRef.current))
        setPhase('choosing')
      },
    })
  }, [script, finishRound])

  const handleRevealClick = useCallback(
    (buttonId: number) => {
      if (paused) return
      if (buttonId === script.agreeIndex) {
        playCoin()
        startShuffle()
      } else {
        onLose('failed')
      }
    },
    [paused, script, playCoin, startShuffle, onLose],
  )

  /**
   * Corrección de playtesting (012-spec.md, ronda de retoques): al elegir en
   * `choosing`, el botón pulsado se da la vuelta hacia su cara real (Agree o
   * Disagree, según corresponda) y SOLO ENTONCES se dispara `onWin`/`onLose`
   * — antes saltaba directo al veredicto gigante sin mostrar el resultado en
   * el propio botón. Mismo giro triangular que el flip inicial (0°→90°→0°,
   * cara sustituida en el canto) pero en un único botón: un segundo
   * `phaseClock` de un solo segmento, reemplazando al de la barajada (ya
   * completado y sin más fotogramas pendientes en cuanto se llega aquí).
   */
  const revealChoice = useCallback(
    (buttonId: number) => {
      const isAgree = buttonId === script.agreeIndex
      revealedButtonIdRef.current = null

      phaseClockRef.current?.destroy()
      phaseClockRef.current = createPhaseClock({
        segments: [{ durationMs: FLIP_DURATION_MS }],
        onSegmentStart: () => setPhase('revealChoice'),
        onFrame: (_segment, _index, progress) => {
          const angleDeg = (progress < 0.5 ? progress : 1 - progress) * 180
          writeCellFlipAngle(buttonId, angleDeg)
          if (progress >= 0.5 && revealedButtonIdRef.current !== buttonId) {
            revealedButtonIdRef.current = buttonId
            setRevealedButtonId(buttonId)
          }
        },
        onComplete: () => {
          setPhase('done')
          if (isAgree) onWin()
          else onLose('failed')
        },
      })
    },
    [script, onWin, onLose],
  )

  const handleChoosingClick = useCallback(
    (buttonId: number) => {
      if (paused) return
      revealChoice(buttonId)
    },
    [paused, revealChoice],
  )

  const handleCellClick = useCallback(
    (buttonId: number) => {
      if (!canAcceptClick(phase)) return
      if (phase === 'reveal') handleRevealClick(buttonId)
      else handleChoosingClick(buttonId)
    },
    [phase, handleRevealClick, handleChoosingClick],
  )

  const inputDisabled = paused || !canAcceptClick(phase)

  return (
    <div ref={containerRef} className={styles['level-08-grid']}>
      {BUTTON_IDS.map((buttonId) => {
        const isAgree = buttonId === script.agreeIndex
        // Gobernado solo por `faceFlipped` (no por `phase`): el flip arranca
        // en cuanto se pulsa el Agree (fase pasa a 'flip' de inmediato),
        // pero la cara real debe seguir mostrándose hasta el canto del giro
        // (progreso 0.5) — si se atara a la fase, el texto cambiaría de
        // golpe al arrancar el flip en vez de a mitad de él. El botón
        // elegido en `choosing` es la excepción: aunque `faceFlipped` siga
        // en `true` (los 12 llevan mostrando "???" desde el flip inicial),
        // ESE botón vuelve a mostrar su cara real en cuanto su propio giro
        // individual cruza el canto (`revealedButtonId`) — el resto se
        // queda en "???" hasta que el nivel se desmonta.
        const showRealFace = !faceFlipped || revealedButtonId === buttonId
        return (
          <XPButton
            key={buttonId}
            ref={(el) => {
              buttonRefs.current[buttonId] = el
            }}
            variant={showRealFace ? (isAgree ? 'agree' : 'disagree') : 'neutral'}
            className={styles['level-08-grid__cell']}
            disabled={inputDisabled}
            aria-label={
              showRealFace
                ? undefined
                : t('levels.8.option').replace('{n}', String(optionSlot[buttonId] + 1))
            }
            onClick={() => handleCellClick(buttonId)}
          >
            {showRealFace ? t(isAgree ? 'game.agree' : 'game.disagree') : t('levels.8.hidden')}
          </XPButton>
        )
      })}
    </div>
  )
}
