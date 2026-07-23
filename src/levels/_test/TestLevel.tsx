import { useEffect, useRef } from 'react'
import { XPButton } from '../../components/xp/XPButton'
import { useCountdown } from '../../hooks/useCountdown'
import { usePointer } from '../../hooks/usePointer'
import type { LevelProps } from '../types'
import styles from './TestLevel.module.scss'

/**
 * Nivel trivial que solo sirve para probar el contrato de LevelComponent de
 * punta a punta (ganar/perder/timeout, chunk perezoso, limpieza al
 * desmontar, congelado con `paused`). No es uno de los 12 niveles reales,
 * pero `levels/registry.ts` lo usa como relleno de los huecos aún no
 * sustituidos por las features 005-016 (004-plan.md).
 *
 * Tiene su propio contador y listener de puntero — independientes de los de
 * LevelHost — para que el test de "sin timers/listeners filtrados al
 * desmontar" tenga algo real que comprobar además de la propia limpieza de
 * LevelHost, y para que congelarlo con `paused` sea observable.
 */
export default function TestLevel({ onWin, onLose, paused, onRestart }: LevelProps) {
  const pointerBoxRef = useRef<HTMLDivElement>(null)
  const disabledPointerRef = useRef<HTMLDivElement | null>(null)
  const { remaining, pause, resume } = useCountdown(30)
  const { isPressed } = usePointer(paused ? disabledPointerRef : pointerBoxRef)

  useEffect(() => {
    if (paused) pause()
    else resume()
  }, [paused, pause, resume])

  return (
    <div className={styles['test-level']}>
      <div ref={pointerBoxRef} className={styles['test-level__pointer-box']}>
        <span>{isPressed ? 'pressed' : 'hover me'}</span>
        <span className={styles['test-level__tick']}>{remaining}</span>
      </div>

      <div className={styles['test-level__actions']}>
        <XPButton variant="agree" onClick={onWin} disabled={paused}>
          Agree
        </XPButton>
        <XPButton variant="disagree" onClick={() => onLose('failed')} disabled={paused}>
          Disagree
        </XPButton>
        {onRestart && (
          <XPButton variant="neutral" onClick={onRestart} disabled={paused}>
            Restart
          </XPButton>
        )}
      </div>
    </div>
  )
}
