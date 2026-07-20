import { XPButton } from '../../components/xp/XPButton'
import { IconButton } from '../../components/xp/IconButton'
import { PlaceholderScreen } from '../../components/xp/PlaceholderScreen'
import { useT } from '../../i18n/useT'
import backIcon from '../../assets/images/ui/back.png'
import type { LevelId } from '../../levels/types'

export interface SelectScreenProps {
  currentLevel: LevelId
  onCheck: () => void
  onBack: () => void
}

export function SelectScreen({ currentLevel, onCheck, onBack }: SelectScreenProps) {
  const t = useT()

  return (
    <PlaceholderScreen
      title={t('shell.select.title')}
      topLeft={
        <IconButton icon={backIcon} label={t('shell.select.back')} showLabel onClick={onBack} />
      }
    >
      <p>
        {t('shell.select.levelLabel')} {currentLevel} {t('shell.select.of')} 12
      </p>
      <XPButton variant="neutral" onClick={onCheck}>
        {t('game.check')}
      </XPButton>
    </PlaceholderScreen>
  )
}
