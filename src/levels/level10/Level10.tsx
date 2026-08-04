import { useCallback, useMemo, useRef, useState } from 'react'
import { XPButton } from '../../components/xp/XPButton'
import { useT } from '../../i18n/useT'
import { usePointer } from '../../hooks/usePointer'
import type { Point } from '../../hooks/pointerLogic'
import {
  useHostTitleBarRef,
  useLevelFooter,
  useLevelOverlay,
  useWindowTranslation,
  useWindowZIndex,
} from '../hostChannel'
import type { LevelProps } from '../types'
import { LevelWindow, type LevelWindowRect } from './LevelWindow'
import {
  bringToFront,
  clampToViewport,
  createInitialWindows,
  HOST_WINDOW_ID,
  MAX_WINDOWS,
  minVisibleXFor,
  moveWindow,
  pickAgreeWindow,
  spawnFrom,
  type Size,
  type WindowState,
} from './windows'
import styles from './Level10.module.scss'

const DRAG_THRESHOLD_PX = 8
// Misma clave que `registry.ts` (`levels.10.name`): la nº 1 la resuelve
// `LevelHost` para el título real de su `XPWindow`, las copias la necesitan
// aquí para que la suya sea indistinguible.
const TITLE_KEY = 'levels.10.name'

/**
 * Nivel 10 — Legitimate Interest (GDD Nivel 10, 014-plan.md): un banner con
 * dos Disagree (rojo y verde). Arrastrar la ventana por su barra de título
 * la mueve y hace nacer una copia idéntica donde estaba — cada ventana pare
 * una única vez, hasta un tope de 7. Al llegar a la séptima, una elegida al
 * azar cambia su botón verde a Agree. La ventana nº 1 (esta, la real dentro
 * de `XPWindow`) se traslada por la ranura `windowTransform`; las copias
 * 2-7 viven en la ranura `overlay`, renderizadas por `LevelWindow` — única
 * ruta de render compartida para que las siete sean indistinguibles.
 */
export default function Level10({ onWin, onLose, paused, timeLeft }: LevelProps) {
  const t = useT()
  const [windows, setWindows] = useState<WindowState[]>(() => createInitialWindows())
  const [seed] = useState(() => Math.floor(Math.random() * 0xffffffff))
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 })
  const translateRef = useRef(translate)
  translateRef.current = translate

  const fallbackTitleBarRef = useRef<HTMLDivElement>(null)
  const titleBarRef = useHostTitleBarRef() ?? fallbackTitleBarRef
  const grabOffsetRef = useRef<Point>({ x: 0, y: 0 })
  const naturalOriginRef = useRef<Point>({ x: 0, y: 0 })
  const sizeRef = useRef<Size>({ width: 0, height: 0 })

  // Se sortea al llegar a la séptima ventana y se queda fija: los ids son
  // siempre 1..7 (nunca se reordenan ni se retiran), así que este cálculo es
  // estable en cuanto `windows.length` deja de crecer. La última ventana
  // creada (id más alto) queda SIEMPRE excluida del sorteo: la recién
  // nacida nunca lleva el Agree, para que no se resuelva "sola" nada más
  // aparecer.
  const agreeWindowId = useMemo(() => {
    if (windows.length < MAX_WINDOWS) return null
    const ids = windows.map((win) => win.id)
    const lastCreatedId = Math.max(...ids)
    const eligibleIds = ids.filter((id) => id !== lastCreatedId)
    return pickAgreeWindow(seed, eligibleIds)
  }, [windows, seed])

  const renderFooter = useCallback(
    (isAgree: boolean) => (
      <div className={styles['level-10__buttons']}>
        <XPButton variant="disagree" onClick={() => onLose('failed')} disabled={paused}>
          {t('game.disagree')}
        </XPButton>
        <XPButton
          variant={isAgree ? 'agree' : 'disagree'}
          onClick={isAgree ? onWin : () => onLose('failed')}
          disabled={paused}
        >
          {isAgree ? t('game.agree') : t('game.disagree')}
        </XPButton>
      </div>
    ),
    [onWin, onLose, paused, t],
  )

  const hostFooter = useMemo(
    () => renderFooter(agreeWindowId === HOST_WINDOW_ID),
    [renderFooter, agreeWindowId],
  )
  useLevelFooter(hostFooter)

  // Publicada SIEMPRE (incluso `translate(0px, 0px)`), nunca condicionada:
  // así `data-draggable` se activa desde el montaje en `LevelHost` y la nº 1
  // hereda gratis el `cursor: grab` y el `touch-action: none` que ya usa la
  // rotación del nivel 3 (evita que un arrastre táctil cerca del borde
  // dispare gestos nativos del navegador).
  useWindowTranslation(translate.x, translate.y)

  const hostWindow = windows.find((win) => win.id === HOST_WINDOW_ID)
  // La ventana agarrada pasa al frente y deja de quedar tapada por las
  // copias del overlay.
  useWindowZIndex(hostWindow?.zIndex ?? 1)

  // Reconstruye el punto en coordenadas de cliente a partir del punto local
  // de `usePointer` (relativo al rect ACTUAL de la barra de título, que ya
  // se ha desplazado por el `transform` publicado) — mismo motivo que la
  // cubierta del nivel 7: sin esto, un delta acumulado fotograma a fotograma
  // arrastraría error de uno a otro.
  function resolveHostTranslate(point: Point): Point {
    const bar = titleBarRef.current
    if (!bar) return translateRef.current
    const barRect = bar.getBoundingClientRect()
    const clientX = point.x + barRect.left
    const clientY = point.y + barRect.top
    const proposedAbsolute = {
      x: clientX - grabOffsetRef.current.x,
      y: clientY - grabOffsetRef.current.y,
    }
    const clampedAbsolute = clampToViewport(
      proposedAbsolute,
      sizeRef.current,
      { width: window.innerWidth, height: window.innerHeight },
      minVisibleXFor(sizeRef.current.width),
    )
    return {
      x: clampedAbsolute.x - naturalOriginRef.current.x,
      y: clampedAbsolute.y - naturalOriginRef.current.y,
    }
  }

  const handleHostDragStart = (point: Point) => {
    if (paused) return
    const bar = titleBarRef.current
    const winEl = bar?.parentElement
    if (!bar || !winEl) return
    const barRect = bar.getBoundingClientRect()
    const winRect = winEl.getBoundingClientRect()
    grabOffsetRef.current = {
      x: point.x + (barRect.left - winRect.left),
      y: point.y + (barRect.top - winRect.top),
    }
    // El origen "de reposo" (transform = 0) se recalcula en cada arrastre a
    // partir del rect YA visible (que ya incluye cualquier traslación
    // previa) menos esa misma traslación — nunca queda desactualizado tras
    // un resize, a diferencia de medirlo una única vez al montar.
    naturalOriginRef.current = {
      x: winRect.left - translateRef.current.x,
      y: winRect.top - translateRef.current.y,
    }
    sizeRef.current = { width: winRect.width, height: winRect.height }
    setWindows((prev) => {
      const { windows: afterSpawn } = spawnFrom(prev, HOST_WINDOW_ID, {
        x: winRect.left,
        y: winRect.top,
      })
      // SIEMPRE al frente al agarrarla, aunque no llegue a parir copia
      // (tope alcanzado o ya había parido): la ventana que se arrastra deja
      // de quedar tapada.
      return bringToFront(afterSpawn, HOST_WINDOW_ID)
    })
  }

  const handleHostDragMove = (point: Point) => {
    if (paused) return
    const next = resolveHostTranslate(point)
    translateRef.current = next
    setTranslate(next)
  }

  usePointer(titleBarRef, {
    dragThreshold: DRAG_THRESHOLD_PX,
    onDragStart: handleHostDragStart,
    onDragMove: handleHostDragMove,
  })

  const handleCopyDragStart = useCallback(
    (id: number, rect: LevelWindowRect) => {
      if (paused) return
      setWindows((prev) => {
        const { windows: afterSpawn } = spawnFrom(prev, id, { x: rect.x, y: rect.y })
        return bringToFront(afterSpawn, id)
      })
    },
    [paused],
  )

  const handleCopyDragEnd = useCallback(
    (id: number, pos: Point) => {
      if (paused) return
      setWindows((prev) => moveWindow(prev, id, pos))
    },
    [paused],
  )

  const handleCopyClose = useCallback(() => onLose('closed'), [onLose])

  const title = t(TITLE_KEY)
  const closeLabel = t('shell.level.close')
  const consentText = t('levels.10.consent')

  // Un único nodo, reutilizado literalmente tanto por la nº 1 (el `return`
  // de este componente) como por cada copia: no hay una segunda ruta de
  // JSX que pueda desincronizarse en estilo — bug real encontrado antes:
  // las copias se quedaban con el texto sin el estilo (ni fondo blanco, ni
  // tipografía) de la ventana nº 1.
  const consentContent = useMemo(
    () => (
      <div className={styles['level-10']}>
        <p className={styles['level-10__text']}>{consentText}</p>
      </div>
    ),
    [consentText],
  )

  const overlay = useMemo(() => {
    if (windows.length <= 1) return null
    return (
      <>
        {windows.slice(1).map((win) => (
          <LevelWindow
            key={win.id}
            win={win}
            title={title}
            counter={timeLeft}
            closeLabel={closeLabel}
            footer={renderFooter(win.id === agreeWindowId)}
            paused={paused}
            onClose={handleCopyClose}
            onDragStart={handleCopyDragStart}
            onDragEnd={handleCopyDragEnd}
          >
            {consentContent}
          </LevelWindow>
        ))}
      </>
    )
  }, [
    windows,
    title,
    timeLeft,
    closeLabel,
    consentContent,
    renderFooter,
    agreeWindowId,
    paused,
    handleCopyClose,
    handleCopyDragStart,
    handleCopyDragEnd,
  ])
  useLevelOverlay(overlay)

  return consentContent
}
