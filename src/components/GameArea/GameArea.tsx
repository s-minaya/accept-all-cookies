import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import styles from './GameArea.module.scss'

/** Tamaño de lienzo lógico sobre el que se diseña cada nivel (coincide con tokens.scss). */
export const LOGICAL_WIDTH = 640
export const LOGICAL_HEIGHT = 360

export interface GameAreaProps {
  children: ReactNode
}

export function GameArea({ children }: GameAreaProps) {
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
        className={styles['game-area__canvas']}
        style={{ '--game-area-scale': scale } as CSSProperties}
      >
        {children}
      </div>
    </div>
  )
}
