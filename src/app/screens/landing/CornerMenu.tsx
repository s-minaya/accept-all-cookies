import characterIcon from '../../../assets/images/ui/character-selection.png'
import rankingIcon from '../../../assets/images/ui/ranking.png'
import infoIcon from '../../../assets/images/ui/info.png'
import settingsIcon from '../../../assets/images/ui/settings.png'
import { IconButton } from '../../../components/xp/IconButton'
import { useT } from '../../../i18n/useT'
import styles from './CornerMenu.module.scss'

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

/** Los 4 accesos de la esquina de la landing (GDD §1.1): solo icono, uno junto a otro, cada uno abre una modal XP. */
export function CornerMenu({ onOpen }: CornerMenuProps) {
  const t = useT()

  return (
    <div className={styles['corner-menu']}>
      {ITEMS.map(({ modal, icon, labelKey }) => (
        <IconButton key={modal} icon={icon} label={t(labelKey)} onClick={() => onOpen(modal)} />
      ))}
    </div>
  )
}
