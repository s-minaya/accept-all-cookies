import { PlaceholderScreen } from '../../components/xp/PlaceholderScreen'
import { XPButton } from '../../components/xp/XPButton'
import { useT } from '../../i18n/useT'

export interface LandingScreenProps {
  onStart: () => void
  onCredits: () => void
}

export function LandingScreen({ onStart, onCredits }: LandingScreenProps) {
  const t = useT()

  return (
    <PlaceholderScreen title={t('shell.landing.title')}>
      <XPButton variant="agree" onClick={onStart}>
        {t('shell.landing.start')}
      </XPButton>
      <XPButton variant="neutral" onClick={onCredits}>
        {t('shell.landing.credits')}
      </XPButton>
    </PlaceholderScreen>
  )
}
