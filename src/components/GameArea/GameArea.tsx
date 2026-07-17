import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './GameArea.module.css'

/** Logical canvas size every level is designed on (mirrors tokens.css). */
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
    <div ref={containerRef} className={styles.container}>
      <div
        className={styles.canvas}
        style={{
          width: LOGICAL_WIDTH,
          height: LOGICAL_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
