import characterIcon from '../../../assets/images/ui/character-selection.png'
import rankingIcon from '../../../assets/images/ui/ranking.png'
import infoIcon from '../../../assets/images/ui/info.png'
import settingsIcon from '../../../assets/images/ui/settings.png'
import { useT } from '../../../i18n/useT'
import styles from './CornerMenu.module.css'

export type LandingModal = 'character' | 'ranking' | 'info' | 'settings'

export interface CornerMenuProps {
  onOpen: (modal: LandingModal) => void
}

const ITEMS: { modal: LandingModal; icon: string; labelKey: string }[] = [
  { modal: 'character', icon: characterIcon, labelKey: 'landing.corner.character' },
  { modal: 'ranking', icon: rankingIcon, labelKey: 'landing.corner.ranking' },
  { modal: 'info', icon: infoIcon, labelKey: 'landing.corner.info' },
  { modal: 'settings', icon: settingsIcon, labelKey: 'landing.corner.settings' },
]

/** The landing's 4 corner accesses (GDD §1.1): icon-only, side by side, each opens an XP modal. */
export function CornerMenu({ onOpen }: CornerMenuProps) {
  const t = useT()

  return (
    <div className={styles.menu}>
      {ITEMS.map(({ modal, icon, labelKey }) => (
        <button
          key={modal}
          type="button"
          className={styles.iconButton}
          onClick={() => onOpen(modal)}
          aria-label={t(labelKey)}
        >
          <img src={icon} alt="" className={styles.icon} />
        </button>
      ))}
    </div>
  )
}
