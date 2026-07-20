import { useState, type CSSProperties } from 'react'
import { CuteButton } from '../../components/cute/CuteButton'
import { useT } from '../../i18n/useT'
import landingBg from '../../assets/images/landing-bg.png'
import landingBgMobile from '../../assets/images/landing-bg-mobile.png'
import { CornerMenu, type LandingModal } from './landing/CornerMenu'
import { CharacterModal } from './landing/CharacterModal'
import { RankingModal } from './landing/RankingModal'
import { InfoModal } from './landing/InfoModal'
import { SettingsModal } from './landing/SettingsModal'
import styles from './LandingScreen.module.scss'

export interface LandingScreenProps {
  onStart: () => void
}

/** The real landing (GDD §1.1 / 003-spec.md): fullscreen background, Empezar, and the 4 corner modals. */
export function LandingScreen({ onStart }: LandingScreenProps) {
  const t = useT()
  const [openModal, setOpenModal] = useState<LandingModal | null>(null)

  const backgroundVars = {
    '--bg-desktop': `url(${landingBg})`,
    '--bg-mobile': `url(${landingBgMobile})`,
  } as CSSProperties

  return (
    <div className={styles['landing-screen']} style={backgroundVars}>
      <CuteButton className={styles['landing-screen__start']} onClick={onStart}>
        {t('shell.landing.start')}
      </CuteButton>

      <div className={styles['landing-screen__corner']}>
        <CornerMenu onOpen={setOpenModal} />
      </div>

      {openModal === 'character' && <CharacterModal onClose={() => setOpenModal(null)} />}
      {openModal === 'ranking' && <RankingModal onClose={() => setOpenModal(null)} />}
      {openModal === 'info' && <InfoModal onClose={() => setOpenModal(null)} />}
      {openModal === 'settings' && <SettingsModal onClose={() => setOpenModal(null)} />}
    </div>
  )
}
