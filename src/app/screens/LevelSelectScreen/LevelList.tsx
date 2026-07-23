import { XPButton } from '../../../components/xp/XPButton'
import { useT } from '../../../i18n/useT'
import { LEVEL_IDS, type LevelId } from '../../../levels/types'
import checkIcon from '../../../assets/images/ui/check.png'
import styles from './LevelList.module.scss'

export interface LevelListProps {
  completedLevels: readonly LevelId[]
  currentLevel: LevelId
  onCheck: () => void
}

/**
 * Fila con tres estados posibles (GDD §5.2): bloqueado, disponible (el
 * actual, con el botón Check al final de la fila) y completado. Todas las
 * filas van juntas, en blanco, sin separación ni borde entre ellas — el
 * único borde es el que ya envuelve la lista entera (`XPWindow`).
 */
export function LevelList({ completedLevels, currentLevel, onCheck }: LevelListProps) {
  const t = useT()

  return (
    <ul className={styles['level-list']}>
      {LEVEL_IDS.map((id) => {
        const isDone = completedLevels.includes(id)
        const isAvailable = !isDone && id === currentLevel
        const state = isDone ? 'done' : isAvailable ? 'available' : 'locked'
        const rowClasses = [styles['level-list__row'], styles[`level-list__row--${state}`]].join(
          ' ',
        )

        return (
          <li key={id} className={rowClasses}>
            <span className={styles['level-list__name']}>
              {id}: {t(`levels.${id}.name`)}
            </span>
            {isDone && <img src={checkIcon} alt="" className={styles['level-list__check']} />}
            {isAvailable && (
              <XPButton variant="neutral" onClick={onCheck}>
                {t('game.check')}
              </XPButton>
            )}
          </li>
        )
      })}
    </ul>
  )
}
