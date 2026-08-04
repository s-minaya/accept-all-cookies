import { useMemo } from 'react'
import { useT } from '../../i18n/useT'
import { useLevelBoard } from '../hostChannel'
import type { LevelProps } from '../types'
import { Level11Board } from './Level11Board'
import styles from './Level11.module.scss'

/**
 * Nivel 11 — Consent Renewal (GDD Nivel 11, 015-plan.md): texto en el marco
 * azul; Sans + su bocadillo publicados aparte vía `useLevelBoard`
 * (`Level11Board.tsx`, dueño del progreso de la conversación y de la
 * escritura). Sin pie de ventana — toda la interacción, ganar y perder,
 * vive dentro del bocadillo (No/Yes), mismo patrón que los niveles 8-9.
 */
export default function Level11({ onWin, onLose, paused }: LevelProps) {
  const t = useT()

  const board = useMemo(
    () => <Level11Board onWin={onWin} onLose={onLose} paused={paused} />,
    [onWin, onLose, paused],
  )
  useLevelBoard(board)

  return (
    <div className={styles['level-11']}>
      <p className={styles['level-11__text']}>{t('levels.11.consent')}</p>
    </div>
  )
}
