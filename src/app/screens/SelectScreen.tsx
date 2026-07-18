import { XPButton } from '../../components/xp/XPButton'
import { PlaceholderScreen } from '../../components/xp/PlaceholderScreen'
import { useT } from '../../i18n/useT'
import type { LevelId } from '../../levels/types'

export interface SelectScreenProps {
  currentLevel: LevelId
  onCheck: () => void
}

export function SelectScreen({ currentLevel, onCheck }: SelectScreenProps) {
  const t = useT()

  return (
    <PlaceholderScreen title={t('shell.select.title')}>
      <p>
        {t('shell.select.levelLabel')} {currentLevel} {t('shell.select.of')} 12
      </p>
      <XPButton variant="neutral" onClick={onCheck}>
        {t('game.check')}
      </XPButton>
    </PlaceholderScreen>
  )
}
