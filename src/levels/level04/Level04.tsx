import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { GameArea, LOGICAL_WIDTH } from '../../components/GameArea'
import { useT } from '../../i18n/useT'
import { usePointer } from '../../hooks/usePointer'
import type { Point } from '../../hooks/pointerLogic'
import { useAudio } from '../../audio/useAudio'
import { isCoarsePointerDevice } from '../../hooks/device'
import { useLevelBoard } from '../hostChannel'
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
 * Nivel 4 — Advertising (Plinko) (GDD Nivel 4, 008-plan.md): el texto de
 * consentimiento vive en el marco azul del área de juego, como los niveles
 * 1-3 (corregido tras revisión de Sofía: "los terminos y condiciones de las
 * cookies no estan en su recuadro azul, como en todos los niveles") — es el
 * propio `return` de este componente (`children` de `XPWindow`). El tablero
 * del Plinko, en cambio, sigue sin marco azul (GDD §4.4, excepción: "un
 * nivel con tablero de físicas puede prescindir del marco... el Plinko ya
 * tiene sus propias paredes físicas"): se publica aparte vía `useLevelBoard`
 * para que `XPWindow` lo renderice DEBAJO de ese marco, fuera de él, en el
 * espacio sobrante — mismo patrón exacto que el recuadro de lluvia del
 * nivel 3. Sin pie de ventana: el botón grande de 6 segmentos ES el botón
 * del nivel, dentro del propio tablero.
 *
 * Reutiliza el `GameArea` de resolución lógica (640×420, feature 001,
 * primer nivel real que lo usa) para que la física del Plinko no dependa
 * del tamaño real de pantalla: `board.ts` trabaja siempre en coordenadas
 * lógicas, `GameArea` se encarga de escalarlas visualmente.
 */
export default function Level04({ onWin, onLose, paused }: LevelProps) {
  const t = useT()
  const { playPositive, playNegative } = useAudio()

  // `canvasEl` (estado) + `canvasRef` (mutable): el lienzo ya NO se monta de
  // forma síncrona con este componente — ahora se publica vía
  // `useLevelBoard` y `XPWindow` lo monta en un punto distinto del árbol
  // (mismo motivo que `rainContainer` en el nivel 3). `usePointer` depende
  // de la IDENTIDAD del ref que recibe (`[ref]` en su propio efecto, ver
  // `usePointer.ts`) para decidir cuándo enganchar sus listeners — un
  // `useRef` normal nunca cambia de identidad, así que si el lienzo se
  // monta más tarde, `usePointer` seguiría enganchado a un `.current` nulo
  // para siempre. `pointerTargetRef` (más abajo) crea un objeto NUEVO en
  // cuanto `canvasEl` deja de ser null, forzando a `usePointer` a
  // reengancharse sobre el nodo real.
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null)
  const setCanvasNode = useCallback((el: HTMLDivElement | null) => {
    canvasRef.current = el
    setCanvasEl(el)
  }, [])
  const pointerTargetRef = useMemo(() => ({ current: canvasEl }), [canvasEl])
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
  usePointer(pointerTargetRef, {
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
  // un fotograma en la posición por defecto del navegador. Depende también
  // de `canvasEl`: el tablero ya no se monta de forma síncrona con este
  // componente (se publica vía `useLevelBoard`, más abajo), así que este
  // efecto necesita repetirse en cuanto el lienzo real (y con él, la paleta
  // y las fichas) llega a existir de verdad.
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
  }, [canvasEl, population, onCapture, onSlotType])

  // Bloqueada también con un desenlace pendiente de confirmar (no solo con
  // `paused` del host): "se bloquea (no se puede deslizar)" — sin física
  // corriendo, ni el control ni nuevas capturas pueden alterar ya el
  // reparto de segmentos mientras se espera el clic. Depende también de
  // `canvasEl`: la simulación ya no se crea en el mismo commit que el
  // primer render de este componente (el tablero se publica vía
  // `useLevelBoard`, más arriba) — sin este dep, si `paused` empieza en
  // `true` y nunca cambia, este efecto solo llegaría a ejecutarse una vez,
  // ANTES de que exista `simulationRef.current`, y la simulación recién
  // creada se quedaría corriendo sin pausar nunca (bug real, detectado por
  // el propio test "does not move the paddle via keyboard while paused").
  useLayoutEffect(() => {
    simulationRef.current?.setPaused(paused || pendingOutcome !== null)
  }, [canvasEl, paused, pendingOutcome])

  // Publicado vía `useLevelBoard` (no como `return` directo, mismo patrón
  // que el recuadro de lluvia del nivel 3) para que `XPWindow` lo renderice
  // DEBAJO del marco azul, fuera de él — memoizado siempre (AGENTS.md: una
  // referencia nueva en cada render entra en bucle con `LevelHost`), con
  // `slotTypes`/`segments`/`pendingOutcome` como dependencias porque SÍ
  // deben producir una referencia nueva cuando cambian de verdad (el color
  // de cada ficha y el relleno de la paleta dependen de ellos).
  const board = useMemo(
    () => (
      <GameArea ref={setCanvasNode}>
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
            <div
              className={[styles['level-04__fill'], styles['level-04__fill--disagree']].join(' ')}
            >
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
    ),
    [setCanvasNode, pegs, population, slotTypes, segments, pendingOutcome, handlePaddleClick, t],
  )
  useLevelBoard(board)

  return (
    <div className={styles['level-04-consent']}>
      <p className={styles['level-04-consent__text']}>{t('levels.4.consent')}</p>
    </div>
  )
}
