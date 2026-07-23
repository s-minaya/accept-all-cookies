import { useEffect, useRef } from 'react'
import { useAudio } from '../../../audio/useAudio'
import { useT } from '../../../i18n/useT'
import styles from './GiantVerdict.module.scss'

export type GiantVerdictResult = 'win' | 'lose'

export interface GiantVerdictProps {
  result: GiantVerdictResult
  /** Se llama cuando termina la animación (~800 ms, ver GiantVerdict.module.scss). */
  onDone: () => void
}

/**
 * Texto gigante AGREE/DISAGREE de las ventanas Game Over / Level Complete
 * (GDD §6.1, §7.1): overlay que cubre y bloquea el nivel congelado detrás,
 * fade + escala + rebotes en CSS, sonido correspondiente al entrar. Debe
 * usarse dentro de un contenedor `position: relative` (LevelHost).
 */
export function GiantVerdict({ result, onDone }: GiantVerdictProps) {
  const t = useT()
  const { playPositive, playNegative } = useAudio()
  const hasPlayedRef = useRef(false)

  useEffect(() => {
    if (hasPlayedRef.current) return
    hasPlayedRef.current = true
    if (result === 'win') playPositive()
    else playNegative()
  }, [result, playPositive, playNegative])

  const textClasses = [
    styles['giant-verdict__text'],
    styles[`giant-verdict__text--${result}`],
  ].join(' ')
  const glowClasses = [
    styles['giant-verdict__glow'],
    styles[`giant-verdict__glow--${result}`],
  ].join(' ')

  return (
    <div className={styles['giant-verdict']}>
      <div className={styles['giant-verdict__stage']}>
        <div className={glowClasses} aria-hidden="true" />
        <span className={textClasses} onAnimationEnd={onDone}>
          {result === 'win' ? t('game.agree') : t('game.disagree')}
        </span>
      </div>
    </div>
  )
}
