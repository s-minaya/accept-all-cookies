import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { XPButton } from '../../components/xp/XPButton'
import { useT } from '../../i18n/useT'
import { usePointer } from '../../hooks/usePointer'
import type { Point } from '../../hooks/pointerLogic'
import { isCoarsePointerDevice } from '../../hooks/device'
import { useHostWindowRef, useLevelBoard, useLevelFooter, useWindowRotation } from '../hostChannel'
import type { LevelProps } from '../types'
import { accumulateRotation, angleFromCenterDeg } from './rotationLogic'
import {
  createRainSimulation,
  RAIN_MAX_POPULATION,
  RAIN_MAX_POPULATION_MOBILE,
  type RainSimulation,
} from './rain'
import styles from './Level03.module.scss'

const DRAG_THRESHOLD_PX = 8

/**
 * Nivel 3 — Personalization Cookies (GDD Nivel 3): sin tablero propio en el
 * sentido del GDD §4.3 — el texto de consentimiento ocupa el marco azul del
 * área de juego, como los niveles 1-2 (`children`, ajustado a su contenido).
 * El recuadro de lluvia se publica aparte, vía `useLevelBoard`, para que
 * `XPWindow` lo renderice DEBAJO de ese marco, fuera de él, en el espacio
 * sobrante (corregido tras revisión de Sofía: "el borde azul oscuro SOLO
 * cubre los términos y condiciones"). La ventana entera rota 360° libre
 * arrastrando; dentro del recuadro caen y rebotan Disagrees con física real
 * (matter.js), y el Agree es un cuerpo físico más, oculto en una cámara
 * recortada por el propio recuadro — solo un giro antihorario (izquierda)
 * inclina la gravedad lo suficiente para que ruede hasta la zona visible, y
 * una vez ahí no puede volver a esconderse (`rain.ts`). El nivel nunca toca
 * la ventana directamente: solo publica grados de rotación a través del
 * canal nivel→host (007-plan.md) y engancha su propio `usePointer` sobre el
 * nodo que el canal le presta para detectar el arrastre.
 */
export default function Level03({ onWin, onLose, paused }: LevelProps) {
  const t = useT()
  const fallbackWindowRef = useRef<HTMLElement>(null)
  const windowRef = useHostWindowRef() ?? fallbackWindowRef

  // Estado, no `useRef`: el recuadro se monta en un punto del árbol de React
  // ajeno a este componente (lo publica `useLevelBoard`, `XPWindow` lo
  // renderiza fuera del `children` de este nivel), así que su montaje real
  // no coincide con el propio montaje de `Level03` — el efecto que crea la
  // simulación necesita reaccionar a que el nodo exista, no solo ejecutarse
  // una vez al montar.
  const [rainContainer, setRainContainer] = useState<HTMLDivElement | null>(null)
  const rainButtonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const agreeButtonRef = useRef<HTMLButtonElement | null>(null)
  const simulationRef = useRef<RainSimulation | null>(null)

  const [rotation, setRotation] = useState(0)
  const rotationRef = useRef(0)
  const lastPointerAngleRef = useRef(0)

  const [rainPopulation] = useState(() =>
    isCoarsePointerDevice() ? RAIN_MAX_POPULATION_MOBILE : RAIN_MAX_POPULATION,
  )

  useWindowRotation(rotation)

  const handleDragStart = (point: Point) => {
    if (paused || !windowRef.current) return
    const rect = windowRef.current.getBoundingClientRect()
    lastPointerAngleRef.current = angleFromCenterDeg(point, {
      x: rect.width / 2,
      y: rect.height / 2,
    })
  }

  const handleDragMove = (point: Point) => {
    if (paused || !windowRef.current) return
    const rect = windowRef.current.getBoundingClientRect()
    const currentAngle = angleFromCenterDeg(point, { x: rect.width / 2, y: rect.height / 2 })
    const next = accumulateRotation(rotationRef.current, lastPointerAngleRef.current, currentAngle)
    rotationRef.current = next
    lastPointerAngleRef.current = currentAngle
    setRotation(next)
  }

  // El umbral tap-vs-drag (8px, GDD §15.3) lo aplica `usePointer` — un tap
  // sobre un botón real (Disagree fijo, de la lluvia o el Agree) dispara su
  // `onClick` nativo sin pasar por aquí; un drag, empiece donde empiece,
  // nunca dispara esos `onClick`, solo rota.
  usePointer(windowRef, {
    dragThreshold: DRAG_THRESHOLD_PX,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
  })

  const footer = useMemo(
    () => (
      <XPButton variant="disagree" onClick={() => onLose('failed')} disabled={paused}>
        {t('game.disagree')}
      </XPButton>
    ),
    [onLose, paused, t],
  )
  useLevelFooter(footer)

  // `useLayoutEffect` (no `useEffect`): la simulación fija la posición
  // inicial de cada botón de forma síncrona antes de que el navegador
  // pinte, para que no se vea ni un fotograma del Agree (o de un Disagree)
  // en su posición por defecto antes de que la física lo mueva a la suya
  // (Sofía, feedback tras QA — "se ve el botón agree esconderse" al
  // cargar). Depende de `rainContainer` (no solo se ejecuta al montar):
  // reacciona a que el recuadro exista de verdad, publicado por
  // `useLevelBoard` y montado por `XPWindow` fuera de este componente. Se
  // limpia por completo al desmontar o si el recuadro cambia (Runner
  // parado, listener desconectado, engine destruido).
  useLayoutEffect(() => {
    const buttons = rainButtonRefs.current.filter((el): el is HTMLButtonElement => el !== null)
    const agreeButton = agreeButtonRef.current
    if (!rainContainer || !agreeButton || buttons.length === 0) return

    const simulation = createRainSimulation({
      container: rainContainer,
      buttons,
      agreeButton,
      maxPopulation: rainPopulation,
      getRotationDeg: () => rotationRef.current,
    })
    simulationRef.current = simulation

    return () => {
      simulation.destroy()
      simulationRef.current = null
    }
  }, [rainContainer, rainPopulation])

  useLayoutEffect(() => {
    simulationRef.current?.setPaused(paused)
  }, [paused])

  const board = useMemo(
    () => (
      <div ref={setRainContainer} className={styles['level-03__rain-box']}>
        {Array.from({ length: rainPopulation }).map((_, index) => (
          <XPButton
            key={index}
            ref={(el) => {
              rainButtonRefs.current[index] = el
            }}
            variant="disagree"
            className={styles['level-03__rain-button']}
            onClick={() => onLose('failed')}
            disabled={paused}
          >
            {t('game.disagree')}
          </XPButton>
        ))}
        {/* Último en el DOM a propósito: pinta por encima del montón de
            Disagree para que, en cuanto ruede a la vista, se distinga del
            resto en vez de quedar sepultado visualmente bajo la pila. */}
        <XPButton
          ref={agreeButtonRef}
          variant="agree"
          className={styles['level-03__rain-button']}
          onClick={onWin}
          disabled={paused}
        >
          {t('game.agree')}
        </XPButton>
      </div>
    ),
    [rainPopulation, onLose, onWin, paused, t],
  )
  useLevelBoard(board)

  return (
    <div className={styles['level-03']}>
      <p className={styles['level-03__text']}>{t('levels.3.consent')}</p>
    </div>
  )
}
