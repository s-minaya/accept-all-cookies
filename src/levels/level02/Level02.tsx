import { useMemo } from 'react'
import { XPButton } from '../../components/xp/XPButton'
import { useT } from '../../i18n/useT'
import { useLevelFooter } from '../hostChannel'
import type { LevelProps } from '../types'
import styles from './Level02.module.scss'

/**
 * Nivel 2 — Analytics Cookies (GDD Nivel 2): los colores de los botones
 * están intercambiados desde el primer segundo, sin trucos de aparición. El
 * nivel se gana leyendo, no fiándose del color.
 */
export default function Level02({ onWin, onLose, paused }: LevelProps) {
  const t = useT()

  // Memoizado con dependencias primitivas estables (005-plan.md): una
  // referencia nueva en cada render entra en bucle con LevelHost.
  const footer = useMemo(
    () => (
      <div className={styles['level-02__buttons']}>
        {/* Cruce intencionado: dice Agree pero lleva el rojo del Disagree */}
        <XPButton variant="disagree" onClick={onWin} disabled={paused}>
          {t('game.agree')}
        </XPButton>
        {/* Cruce intencionado: dice Disagree pero lleva el verde del Agree */}
        <XPButton variant="agree" onClick={() => onLose('failed')} disabled={paused}>
          {t('game.disagree')}
        </XPButton>
      </div>
    ),
    [paused, onWin, onLose, t],
  )
  useLevelFooter(footer)

  return (
    <div className={styles['level-02']}>
      <p className={styles['level-02__text']}>{t('levels.2.consent')}</p>
    </div>
  )
}
