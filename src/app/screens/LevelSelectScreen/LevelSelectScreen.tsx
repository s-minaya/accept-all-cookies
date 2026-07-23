import { IconButton } from '../../../components/xp/IconButton'
import { XPWindow } from '../../../components/xp/XPWindow'
import { useT } from '../../../i18n/useT'
import backIcon from '../../../assets/images/ui/back.png'
import type { LevelId } from '../../../levels/types'
import { LevelList } from './LevelList'
import styles from './LevelSelectScreen.module.scss'

export interface LevelSelectScreenProps {
  completedLevels: readonly LevelId[]
  currentLevel: LevelId
  onCheck: () => void
  onBack: () => void
}

/** Pantalla de selección de niveles real (GDD §5): reemplaza al placeholder de la feature 002. */
export function LevelSelectScreen({
  completedLevels,
  currentLevel,
  onCheck,
  onBack,
}: LevelSelectScreenProps) {
  const t = useT()

  return (
    <main className={styles['level-select-screen']}>
      <div className={styles['level-select-screen__window']}>
        <XPWindow
          title={t('shell.select.title')}
          scrollableContent
          cornerAccessory={
            <IconButton icon={backIcon} label={t('shell.select.back')} showLabel onClick={onBack} />
          }
        >
          <LevelList
            completedLevels={completedLevels}
            currentLevel={currentLevel}
            onCheck={onCheck}
          />
        </XPWindow>
      </div>
    </main>
  )
}
