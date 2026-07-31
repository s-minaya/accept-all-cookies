import { useMemo } from 'react'
import { useT } from '../../i18n/useT'
import { useLevelBoard } from '../hostChannel'
import type { LevelProps } from '../types'
import { Level09Grid } from './Level09Grid'
import styles from './Level09.module.scss'

/**
 * Nivel 9 — Fingerprinting (GDD Nivel 9, 013-plan.md): texto en el marco
 * azul, cuadrícula de 12 casillas publicada aparte vía `useLevelBoard`
 * (`Level09Grid.tsx`, un componente propio — ver por qué en su comentario).
 * Cada casilla es una simulación independiente y trivial (`cell.ts` +
 * `spawner.ts`); la única pieza delicada es la detección de inmovilidad
 * (extendida en `usePointer`, nunca reimplementada aquí).
 */
export default function Level09({ onWin, onLose, paused }: LevelProps) {
  const t = useT()

  const board = useMemo(
    () => <Level09Grid onWin={onWin} onLose={onLose} paused={paused} />,
    [onWin, onLose, paused],
  )
  useLevelBoard(board)

  return (
    <div className={styles['level-09']}>
      <p className={styles['level-09__text']}>{t('levels.9.consent')}</p>
    </div>
  )
}
