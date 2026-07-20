import { useRef, useState } from 'react'
import { usePointer } from '../hooks/usePointer'
import styles from './Playground.module.scss'

export function PointerDemo() {
  const boxRef = useRef<HTMLDivElement>(null)
  const [lastGesture, setLastGesture] = useState('—')
  const [isStill, setIsStill] = useState(false)

  const { isPressed, position } = usePointer(boxRef, {
    stillnessMs: 1200,
    onTap: () => setLastGesture('tap'),
    onDragStart: () => setLastGesture('drag'),
    onStill: () => setIsStill(true),
  })

  return (
    <div
      ref={boxRef}
      className={styles['playground__pointer-box']}
      onPointerDown={() => setIsStill(false)}
      onPointerMove={() => setIsStill(false)}
    >
      <span>
        Tap or drag with mouse or finger.
        <br />
        Last gesture: {lastGesture}
        <br />
        Pressed: {isPressed ? 'yes' : 'no'}
        <br />
        Position: {position ? `${Math.round(position.x)}, ${Math.round(position.y)}` : '—'}
        <br />
        Still (1.2s): {isStill ? 'yes' : 'no'}
      </span>
    </div>
  )
}
