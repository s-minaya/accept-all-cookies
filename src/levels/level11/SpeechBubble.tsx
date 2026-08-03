import { XPButton } from '../../components/xp/XPButton'
import { useT } from '../../i18n/useT'
import type { Answer } from './conversation'
import styles from './Level11.module.scss'

export interface SpeechBubbleProps {
  visibleText: string
  /** Deshabilita No/Yes: mientras escribe (+ margen) o mientras el nivel está en pausa. */
  disabled: boolean
  onAnswer: (given: Answer) => void
  /** Tocar el bocadillo mientras escribe completa el texto de golpe (GDD Nivel 11). */
  onSkip: () => void
}

/**
 * Bocadillo de Sans (GDD Nivel 11, 015-plan.md): texto en Comic Sans —
 * declarada aquí, en `&__bubble-text`, no en un ancestro — y botones No/Yes
 * en `game.*`, sin traducir, con la tipografía normal del sistema (nunca
 * heredan la Comic Sans del texto). `onPointerDown` en el contenedor entero
 * es seguro incluso sobre los botones: `skip()` no hace nada una vez la
 * frase ya terminó de escribirse (`typewriter.ts`), así que no compite con
 * `onAnswer`.
 */
export function SpeechBubble({ visibleText, disabled, onAnswer, onSkip }: SpeechBubbleProps) {
  const t = useT()

  return (
    <div className={styles['level-11__bubble']} onPointerDown={onSkip}>
      <p className={styles['level-11__bubble-text']}>{visibleText}</p>
      <div className={styles['level-11__bubble-buttons']}>
        <XPButton variant="neutral" disabled={disabled} onClick={() => onAnswer('no')}>
          {t('game.no')}
        </XPButton>
        <XPButton variant="neutral" disabled={disabled} onClick={() => onAnswer('yes')}>
          {t('game.yes')}
        </XPButton>
      </div>
    </div>
  )
}
