import { PlaceholderScreen } from '../../components/xp/PlaceholderScreen'
import { XPButton } from '../../components/xp/XPButton'
import { useT } from '../../i18n/useT'

export interface CreditsScreenProps {
  onBack: () => void
}

export function CreditsScreen({ onBack }: CreditsScreenProps) {
  const t = useT()

  return (
    <PlaceholderScreen title={t('shell.credits.title')}>
      <p>{t('shell.credits.body')}</p>
      <XPButton variant="neutral" onClick={onBack}>
        {t('shell.credits.backToLanding')}
      </XPButton>
    </PlaceholderScreen>
  )
}
