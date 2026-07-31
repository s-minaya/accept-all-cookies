import { useMemo, useState } from 'react'
import { useT } from '../../i18n/useT'
import { createRng } from '../../utils/prng'
import { useLevelBoard } from '../hostChannel'
import type { LevelProps } from '../types'
import { createShuffleScript, type ShuffleScript } from './shuffle'
import { Level08Grid } from './Level08Grid'
import styles from './Level08.module.scss'

/**
 * Nivel 8 — Third-Party Providers (GDD Nivel 8, 012-plan.md, el trilero):
 * texto en el marco azul, cuadrícula de 12 botones publicada aparte vía
 * `useLevelBoard` (`Level08Grid.tsx`, un componente propio — no inline aquí,
 * ver por qué en su comentario). Toda la partida (posición inicial del
 * Agree + las 3 rondas de intercambios) es un guion determinista
 * (`shuffle.ts`) generado una sola vez al montar — el guion vive aquí, en el
 * componente que NUNCA se remonta a mitad de partida, y baja a la cuadrícula
 * como prop; ella solo lo reproduce con un reloj de fases sobre rAF
 * (`phaseClock.ts`), nunca decide una posición por su cuenta, así que
 * animación y "verdad" (dónde está el Agree) no pueden discrepar.
 */
export default function Level08({ onWin, onLose, paused }: LevelProps) {
  const t = useT()

  const [script] = useState<ShuffleScript>(() =>
    createShuffleScript(createRng(Math.floor(Math.random() * 0xffffffff))),
  )

  const board = useMemo(
    () => <Level08Grid script={script} onWin={onWin} onLose={onLose} paused={paused} />,
    [script, onWin, onLose, paused],
  )
  useLevelBoard(board)

  return (
    <div className={styles['level-08']}>
      <p className={styles['level-08__text']}>{t('levels.8.consent')}</p>
    </div>
  )
}
