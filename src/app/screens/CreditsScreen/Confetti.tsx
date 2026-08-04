import { useMemo, type CSSProperties } from 'react'
import styles from './Confetti.module.scss'

const PIECE_COUNT = 60

/** Paleta de tokens ya existentes (nada de colores nuevos): un cuadradito pixel art por color del propio juego. */
const COLORS = [
  'var(--color-agree-bg)',
  'var(--color-agree-border)',
  'var(--color-disagree-bg)',
  'var(--color-disagree-border)',
  'var(--color-title-gradient-start)',
  'var(--color-cute-bg)',
]

interface ConfettiPiece {
  id: number
  left: number
  color: string
  delay: number
  duration: number
  rotation: number
  drift: number
}

function createPieces(): ConfettiPiece[] {
  return Array.from({ length: PIECE_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    color: COLORS[id % COLORS.length],
    delay: Math.random() * 1.5,
    duration: 2.5 + Math.random() * 2,
    rotation: Math.random() < 0.5 ? 360 : -360,
    drift: (Math.random() - 0.5) * 30,
  }))
}

/**
 * Confeti pixel art hecho a mano al llegar a los créditos: cuadraditos de
 * la propia paleta de tokens cayendo con CSS puro
 * — sin dependencia nueva (AGENTS.md: "no añadir dependencias"), mismo
 * enfoque que `GiantVerdict` (fade + animación, todo CSS, sin librería).
 * Las piezas se generan una sola vez al montar y cada una se desvanece sola
 * al final de su propia animación (`animation-fill-mode: forwards`) — no
 * hace falta ningún temporizador para retirarlas.
 */
export function Confetti() {
  const pieces = useMemo(createPieces, [])

  return (
    <div className={styles['confetti']} aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={styles['confetti__piece']}
          style={
            {
              left: `${piece.left}vw`,
              '--confetti-color': piece.color,
              '--confetti-delay': `${piece.delay}s`,
              '--confetti-duration': `${piece.duration}s`,
              '--confetti-rotation': `${piece.rotation}deg`,
              '--confetti-drift': `${piece.drift}vw`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
