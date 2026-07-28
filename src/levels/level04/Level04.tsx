import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { GameArea, LOGICAL_WIDTH } from '../../components/GameArea'
import { useT } from '../../i18n/useT'
import { usePointer } from '../../hooks/usePointer'
import type { Point } from '../../hooks/pointerLogic'
import { useAudio } from '../../audio/useAudio'
import { isCoarsePointerDevice } from '../../hooks/device'
import type { LevelProps } from '../types'
import {
  catchAgree,
  catchDisagree,
  getSegmentsOutcome,
  INITIAL_SEGMENTS,
  SEGMENT_COUNT,
  type SegmentsState,
} from './segments'
import type { KeyboardDirection } from './control'
import {
  createBoardSimulation,
  FALL_MAX_POPULATION,
  FALL_MAX_POPULATION_MOBILE,
  generatePegPositions,
  type BoardSimulation,
} from './board'
import type { FallingType } from './spawner'
import styles from './Level04.module.scss'

/**
 * Nivel 4 — Advertising (Plinko) (GDD Nivel 4, 008-plan.md): "frameless"
 * (GDD §4.4, excepción confirmada por Sofía) — el texto de consentimiento
 * usa el recuadro blanco estándar (`consentKey` en `registry.ts`), pero el
 * tablero no lleva marco azul: `LevelHost` monta este componente entero como
 * `boardBelowFrame` de `XPWindow` en vez de como `children`, así que el
 * marco ni se renderiza (`LevelDefinition.frameless`). Sin pie de ventana:
 * el botón grande de 6 segmentos ES el botón del nivel, dentro del propio
 * tablero.
 *
 * Reutiliza el `GameArea` de resolución lógica (640×420, feature 001,
 * primer nivel real que lo usa) para que la física del Plinko no dependa
 * del tamaño real de pantalla: `board.ts` trabaja siempre en coordenadas
 * lógicas, `GameArea` se encarga de escalarlas visualmente.
 */
export default function Level04({ onWin, onLose, paused }: LevelProps) {
  const t = useT()
  const { playPositive, playNegative } = useAudio()

  const canvasRef = useRef<HTMLDivElement>(null)
  const paddleRef = useRef<HTMLDivElement>(null)
  const guideFillRef = useRef<HTMLDivElement>(null)
  const fallingSlotRefs = useRef<(HTMLDivElement | null)[]>([])
  const simulationRef = useRef<BoardSimulation | null>(null)

  // X deseada del botón grande (lógica, 0..LOGICAL_WIDTH): la escribe tanto
  // el puntero como el teclado; `board.ts` la lee/clampa en cada paso de
  // física. Empieza centrada.
  const controlXRef = useRef(LOGICAL_WIDTH / 2)
  const keyboardDirectionRef = useRef<KeyboardDirection>(0)

  const [population] = useState(() =>
    isCoarsePointerDevice() ? FALL_MAX_POPULATION_MOBILE : FALL_MAX_POPULATION,
  )
  const [slotTypes, setSlotTypes] = useState<FallingType[]>(() => Array(population).fill('agree'))
  const [segments, setSegments] = useState<SegmentsState>(INITIAL_SEGMENTS)
  // Desenlace ya decidido por los segmentos, pero pendiente de que el
  // jugador pulse la paleta para confirmarlo (corregido tras revisión de
  // Sofía: "una vez el botón... se vuelve agree del todo, se bloquea... y
  // el jugador debe pulsarlo para ganar") — igual que los botones Agree/
  // Disagree del resto del juego, que nunca deciden por sí solos sin un
  // clic.
  const [pendingOutcome, setPendingOutcome] = useState<'win' | 'lose' | null>(null)
  const hasEndedRef = useRef(false)

  const pegs = useMemo(() => generatePegPositions(LOGICAL_WIDTH), [])

  // Ratón: arrastrar (pulsar y mover), no seguir el puntero en hover —
  // corregido tras revisión de Sofía: "no me gusta que siga al raton, mejor
  // que sea drag y soltar". `onDragStart`+`onDragMove` (no `onMove`): el
  // arrastre puede empezar en cualquier punto del área de juego, no hace
  // falta pulsar sobre la paleta (GDD §15.2), y el umbral de arrastre por
  // defecto de `usePointer` deja pasar un simple tap sobre la paleta ya
  // bloqueada (ver más abajo, "pulsarlo para ganar") sin moverla. Táctil:
  // ya eran drag de por sí (un `pointermove` táctil no existe sin contacto
  // previo), así que no cambia nada en la práctica.
  const updateControlFromPoint = (point: Point) => {
    if (paused) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    controlXRef.current = (point.x / rect.width) * LOGICAL_WIDTH
  }
  usePointer(canvasRef, {
    onDragStart: updateControlFromPoint,
    onDragMove: updateControlFromPoint,
  })

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        keyboardDirectionRef.current = -1
        event.preventDefault()
      } else if (event.key === 'ArrowRight') {
        keyboardDirectionRef.current = 1
        event.preventDefault()
      }
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' && keyboardDirectionRef.current === -1) {
        keyboardDirectionRef.current = 0
      } else if (event.key === 'ArrowRight' && keyboardDirectionRef.current === 1) {
        keyboardDirectionRef.current = 0
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      keyboardDirectionRef.current = 0
    }
  }, [])

  const onSlotType = useCallback((index: number, type: FallingType) => {
    setSlotTypes((prev) => {
      if (prev[index] === type) return prev
      const next = [...prev]
      next[index] = type
      return next
    })
  }, [])

  const onCapture = useCallback(
    (type: FallingType) => {
      if (type === 'agree') {
        playPositive()
        setSegments((prev) => catchAgree(prev))
      } else {
        playNegative()
        setSegments((prev) => catchDisagree(prev))
      }
    },
    [playPositive, playNegative],
  )

  // Victoria con los 6 Agree, derrota con los 6 Disagree — se detecta al
  // cambiar `segments` en vez de en `onCapture` porque el desenlace depende
  // del estado ACUMULADO, no de una captura suelta. Ya NO llama a
  // onWin/onLose directamente: solo deja la paleta lista para que el
  // jugador la pulse (más abajo, `handlePaddleClick`).
  useEffect(() => {
    if (hasEndedRef.current || pendingOutcome) return
    const outcome = getSegmentsOutcome(segments)
    if (outcome === 'win' || outcome === 'lose') {
      setPendingOutcome(outcome)
    }
  }, [segments, pendingOutcome])

  const handlePaddleClick = useCallback(() => {
    if (!pendingOutcome || hasEndedRef.current) return
    hasEndedRef.current = true
    if (pendingOutcome === 'win') onWin()
    else onLose('failed')
  }, [pendingOutcome, onWin, onLose])

  // `useLayoutEffect` (no `useEffect`): sincroniza la paleta con su posición
  // inicial antes del primer pintado — mismo motivo que el nivel 3, evitar
  // un fotograma en la posición por defecto del navegador.
  useLayoutEffect(() => {
    const fallingSlots = fallingSlotRefs.current.filter((el): el is HTMLDivElement => el !== null)
    const paddleEl = paddleRef.current
    if (!paddleEl || fallingSlots.length === 0) return

    const simulation = createBoardSimulation({
      fallingSlots,
      paddleEl,
      guideFillEl: guideFillRef.current ?? undefined,
      maxPopulation: population,
      getControlX: () => controlXRef.current,
      setControlX: (x) => {
        controlXRef.current = x
      },
      getKeyboardDirection: () => keyboardDirectionRef.current,
      onCapture,
      onSlotType,
    })
    simulationRef.current = simulation

    return () => {
      simulation.destroy()
      simulationRef.current = null
    }
  }, [population, onCapture, onSlotType])

  // Bloqueada también con un desenlace pendiente de confirmar (no solo con
  // `paused` del host): "se bloquea (no se puede deslizar)" — sin física
  // corriendo, ni el control ni nuevas capturas pueden alterar ya el
  // reparto de segmentos mientras se espera el clic.
  useLayoutEffect(() => {
    simulationRef.current?.setPaused(paused || pendingOutcome !== null)
  }, [paused, pendingOutcome])

  return (
    <GameArea ref={canvasRef}>
      <div className={styles['level-04']}>
        {pegs.map((peg, index) => (
          <div
            key={index}
            className={styles['level-04__peg']}
            style={{ '--peg-x': `${peg.x}px`, '--peg-y': `${peg.y}px` } as CSSProperties}
          />
        ))}

        {Array.from({ length: population }).map((_, index) => {
          const isDisagree = slotTypes[index] === 'disagree'
          const variantClass = isDisagree
            ? styles['level-04__falling--disagree']
            : styles['level-04__falling--agree']
          return (
            <div
              key={index}
              ref={(el) => {
                fallingSlotRefs.current[index] = el
              }}
              className={[styles['level-04__falling'], variantClass].join(' ')}
              aria-hidden="true"
            >
              <span className={styles['level-04__falling-label']}>
                {t(isDisagree ? 'game.disagree' : 'game.agree')}
              </span>
            </div>
          )
        })}

        <div className={styles['level-04__guide']}>
          <div ref={guideFillRef} className={styles['level-04__guide-fill']} />
        </div>

        <div
          ref={paddleRef}
          className={[
            styles['level-04__paddle'],
            pendingOutcome ? styles['level-04__paddle--locked'] : '',
          ].join(' ')}
          style={
            {
              '--agree-fill': segments.agree / SEGMENT_COUNT,
              '--disagree-fill': segments.disagree / SEGMENT_COUNT,
            } as CSSProperties
          }
          role="button"
          tabIndex={pendingOutcome ? 0 : -1}
          aria-disabled={!pendingOutcome}
          onClick={handlePaddleClick}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handlePaddleClick()
            }
          }}
        >
          <div className={[styles['level-04__fill'], styles['level-04__fill--agree']].join(' ')}>
            <span
              className={[
                styles['level-04__paddle-label'],
                styles['level-04__paddle-label--agree'],
              ].join(' ')}
            >
              {t('game.agree')}
            </span>
          </div>
          <div className={[styles['level-04__fill'], styles['level-04__fill--disagree']].join(' ')}>
            <span
              className={[
                styles['level-04__paddle-label'],
                styles['level-04__paddle-label--disagree'],
              ].join(' ')}
            >
              {t('game.disagree')}
            </span>
          </div>
        </div>
      </div>
    </GameArea>
  )
}
