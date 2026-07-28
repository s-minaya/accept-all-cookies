import { forwardRef, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import styles from './GameArea.module.scss'

/**
 * Tamaño de lienzo lógico sobre el que se diseña cada nivel (coincide con
 * tokens.scss). Alto subido de 360 a 420 tras revisión de Sofía ("mucho
 * espacio en el game area... usar este espacio para que el tablero sea más
 * grande"): en móvil, la ventana es más estrecha que alta, así que el ancho
 * (640) es casi siempre el límite real de la escala — de 360 a 420 sigue
 * siéndolo en todos los tamaños medidos (móvil y escritorio, incluida una
 * ventana de escritorio poco alta, ~650px), así que el cambio da más alto
 * de tablero de verdad sin reducir el ancho de nada existente.
 */
export const LOGICAL_WIDTH = 640
export const LOGICAL_HEIGHT = 420

export interface GameAreaProps {
  children: ReactNode
}

/**
 * `ref` reenviado al lienzo lógico (`__canvas`, el nodo de 640×420 antes de
 * aplicarle el `transform: scale()`), no al contenedor exterior — un nivel
 * que necesite convertir coordenadas de puntero reales a coordenadas
 * lógicas (nivel 4: `usePointer` sobre este mismo nodo) necesita medir
 * exactamente ese elemento, cuyo `getBoundingClientRect()` ya refleja la
 * escala aplicada.
 */
export const GameArea = forwardRef<HTMLDivElement, GameAreaProps>(function GameArea(
  { children },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const nextScale = Math.min(width / LOGICAL_WIDTH, height / LOGICAL_HEIGHT)
      setScale(nextScale > 0 ? nextScale : 1)
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={styles['game-area__container']}>
      <div
        ref={ref}
        className={styles['game-area__canvas']}
        style={{ '--game-area-scale': scale } as CSSProperties}
      >
        {children}
      </div>
    </div>
  )
})
