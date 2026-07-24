import { useMemo, useReducer } from 'react'
import { XPButton } from '../../components/xp/XPButton'
import { XPDialog } from '../../components/xp/XPDialog'
import { useT } from '../../i18n/useT'
import { useLevelFooter } from '../hostChannel'
import type { LevelProps } from '../types'
import { isAgreeVisible, level01Reducer } from './logic'
import styles from './Level01.module.scss'

/**
 * Nivel 1 — Essential Cookies (GDD Nivel 1): sin tablero propio, el texto de
 * consentimiento ocupa el marco azul del área de juego y los botones viven
 * en el pie de la ventana (`useLevelFooter`). El Agree tarda 7s en aparecer
 * y Disagree nunca es derrota, solo abre un diálogo de error que se reinicia
 * con `onRestart`. Molde de carpeta para los niveles 2-12 (005-plan.md).
 */
export default function Level01({ onWin, onRestart, timeLeft, paused }: LevelProps) {
  const t = useT()
  const [phase, dispatch] = useReducer(level01Reducer, 'playing')
  const agreeVisible = isAgreeVisible(timeLeft)

  // Memoizado: `timeLeft` cambia cada segundo, pero el pie solo debe
  // recalcularse cuando algo que de verdad afecta a su contenido cambia
  // (evita renders en cadena con LevelHost, que también guarda este nodo).
  const footer = useMemo(
    () => (
      <div className={styles['level-01__buttons']}>
        <div className={styles['level-01__agree-slot']}>
          {agreeVisible && (
            <XPButton variant="agree" onClick={onWin} disabled={paused}>
              {t('game.agree')}
            </XPButton>
          )}
        </div>
        <XPButton
          variant="disagree"
          onClick={() => dispatch({ type: 'DISAGREE' })}
          disabled={paused}
        >
          {t('game.disagree')}
        </XPButton>
      </div>
    ),
    [agreeVisible, paused, onWin, t],
  )
  useLevelFooter(footer)

  return (
    <div className={styles['level-01']}>
      <p className={styles['level-01__text']}>{t('levels.1.consent')}</p>

      {phase === 'errorDialog' && (
        <XPDialog
          title={t('levels.1.errorTitle')}
          footer={
            <XPButton variant="neutral" onClick={() => onRestart?.()} disabled={paused}>
              {t('game.ok')}
            </XPButton>
          }
        >
          <p>{t('levels.1.errorMessage')}</p>
        </XPDialog>
      )}
    </div>
  )
}
