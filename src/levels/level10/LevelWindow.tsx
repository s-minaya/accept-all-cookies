import { useRef, type CSSProperties, type ReactNode } from 'react'
import { XPWindow } from '../../components/xp/XPWindow'
import { usePointer } from '../../hooks/usePointer'
import type { Point } from '../../hooks/pointerLogic'
import { clampToViewport, minVisibleXFor, type Size, type WindowState } from './windows'
import styles from './Level10.module.scss'

const DRAG_THRESHOLD_PX = 8

export interface LevelWindowRect extends Size {
  x: number
  y: number
}

export interface LevelWindowProps {
  win: WindowState
  title: string
  counter: number
  closeLabel: string
  footer: ReactNode
  children: ReactNode
  paused: boolean
  onClose: () => void
  /** El arrastre acaba de confirmarse (8px): el padre decide si procede duplicar. */
  onDragStart: (id: number, rect: LevelWindowRect) => void
  /** Solo al soltar (014-plan.md): el padre confirma la posición final en el modelo. */
  onDragEnd: (id: number, pos: Point) => void
}

/**
 * Única ruta de render de una copia del nivel 10 (014-plan.md): envuelve
 * `XPWindow` con exactamente las mismas props que `LevelHost` usa para la
 * ventana nº 1 (ver `Level10.tsx`, mismo `footer` compartido) — la
 * indistinguibilidad no se consigue "teniendo cuidado", se consigue no
 * teniendo dos rutas de render (mismo razonamiento que el test de
 * indistinguibilidad del nivel 8). Mide y arrastra su PROPIA barra de
 * título: nunca depende de un ref publicado por un ciclo de render ajeno
 * (lección de la 010/011/012/013 — el componente que posiciona/mide es el
 * que se monta), así que es seguro montarla dentro de la ranura `overlay`
 * (que sí monta un ciclo de render después del nivel).
 */
export function LevelWindow({
  win,
  title,
  counter,
  closeLabel,
  footer,
  children,
  paused,
  onClose,
  onDragStart,
  onDragEnd,
}: LevelWindowProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const titleBarRef = useRef<HTMLDivElement>(null)
  const grabOffsetRef = useRef<Point>({ x: 0, y: 0 })
  const sizeRef = useRef<Size>({ width: 0, height: 0 })

  function applyPosition(pos: Point) {
    wrapperRef.current?.style.setProperty('--window-x', `${pos.x}px`)
    wrapperRef.current?.style.setProperty('--window-y', `${pos.y}px`)
  }

  // Reconstruye el punto en coordenadas de cliente a partir del punto local
  // que ya calculó `usePointer` (relativo al rect ACTUAL de la barra de
  // título, que ya se ha desplazado por `transform`) sumándole ese mismo
  // rect — mismo motivo que el nivel 7: evita depender de un delta
  // acumulado fotograma a fotograma, que con una ventana que se traslada
  // arrastraría error de uno a otro.
  function resolveTargetPosition(point: Point): Point {
    const bar = titleBarRef.current
    if (!bar) return { x: win.x, y: win.y }
    const barRect = bar.getBoundingClientRect()
    const clientX = point.x + barRect.left
    const clientY = point.y + barRect.top
    const proposed = { x: clientX - grabOffsetRef.current.x, y: clientY - grabOffsetRef.current.y }
    return clampToViewport(
      proposed,
      sizeRef.current,
      { width: window.innerWidth, height: window.innerHeight },
      minVisibleXFor(sizeRef.current.width),
    )
  }

  const handleDragStart = (point: Point) => {
    if (paused) return
    const bar = titleBarRef.current
    const wrapper = wrapperRef.current
    if (!bar || !wrapper) return
    const barRect = bar.getBoundingClientRect()
    const winRect = wrapper.getBoundingClientRect()
    // Punto de agarre en coordenadas de LA VENTANA (no de la barra): se
    // mantiene bajo el puntero durante todo el arrastre.
    grabOffsetRef.current = {
      x: point.x + (barRect.left - winRect.left),
      y: point.y + (barRect.top - winRect.top),
    }
    sizeRef.current = { width: winRect.width, height: winRect.height }
    onDragStart(win.id, {
      x: winRect.left,
      y: winRect.top,
      width: winRect.width,
      height: winRect.height,
    })
  }

  const handleDragMove = (point: Point) => {
    if (paused) return
    applyPosition(resolveTargetPosition(point))
  }

  const handleDragEnd = (point: Point) => {
    if (paused) return
    onDragEnd(win.id, resolveTargetPosition(point))
  }

  usePointer(titleBarRef, {
    dragThreshold: DRAG_THRESHOLD_PX,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
  })

  return (
    <div
      ref={wrapperRef}
      className={styles['level-10-clone']}
      style={
        {
          '--window-x': `${win.x}px`,
          '--window-y': `${win.y}px`,
          '--window-z': win.zIndex,
        } as CSSProperties
      }
    >
      <XPWindow
        title={title}
        counter={counter}
        closeLabel={closeLabel}
        onClose={paused ? undefined : onClose}
        titleBarRef={titleBarRef}
        scrollableContent
        compactOnMobile
        footer={footer}
      >
        {children}
      </XPWindow>
    </div>
  )
}
