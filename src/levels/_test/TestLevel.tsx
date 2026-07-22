import { useRef } from 'react'
import { XPButton } from '../../components/xp/XPButton'
import { useCountdown } from '../../hooks/useCountdown'
import { usePointer } from '../../hooks/usePointer'
import type { LevelProps } from '../types'
import styles from './TestLevel.module.scss'

/**
 * Nivel trivial que solo sirve para probar el contrato de LevelComponent de
 * punta a punta (ganar/perder/timeout, chunk perezoso, limpieza al
 * desmontar). No es uno de los 12 niveles reales: nunca se añade a
 * `levels/registry.ts` (AGENTS.md).
 *
 * Tiene su propio contador y listener de puntero — independientes de los de
 * LevelHost — para que el test de "sin timers/listeners filtrados al
 * desmontar" tenga algo real que comprobar además de la propia limpieza de
 * LevelHost.
 */
export default function TestLevel({ onWin, onLose }: LevelProps) {
  const pointerBoxRef = useRef<HTMLDivElement>(null)
  const { remaining } = useCountdown(30)
  const { isPressed } = usePointer(pointerBoxRef)

  return (
    <div className={styles['test-level']}>
      <div ref={pointerBoxRef} className={styles['test-level__pointer-box']}>
        <span>{isPressed ? 'pressed' : 'hover me'}</span>
        <span className={styles['test-level__tick']}>{remaining}</span>
      </div>

      <div className={styles['test-level__actions']}>
        <XPButton variant="agree" onClick={onWin}>
          Agree
        </XPButton>
        <XPButton variant="disagree" onClick={() => onLose('failed')}>
          Disagree
        </XPButton>
      </div>
    </div>
  )
}
