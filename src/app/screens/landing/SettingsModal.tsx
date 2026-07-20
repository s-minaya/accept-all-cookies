import { XPDialog } from '../../../components/xp/XPDialog'
import { XPButton } from '../../../components/xp/XPButton'
import { XPSlider } from '../../../components/xp/XPSlider'
import { XPToggle } from '../../../components/xp/XPToggle'
import { useT } from '../../../i18n/useT'
import { useAudio } from '../../../audio/useAudio'
import { useSettingsStore } from '../../../state/settingsStore'
import styles from './SettingsModal.module.scss'

export interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const t = useT()
  const language = useSettingsStore((state) => state.language)
  const volume = useSettingsStore((state) => state.volume)
  const musicOn = useSettingsStore((state) => state.musicOn)
  const setLanguage = useSettingsStore((state) => state.setLanguage)
  const setVolume = useSettingsStore((state) => state.setVolume)
  const setMusicOn = useSettingsStore((state) => state.setMusicOn)
  const { playPositive } = useAudio()

  return (
    <XPDialog title={t('landing.settings.title')} onClose={onClose} closeLabel={t('landing.close')}>
      <div className={styles['settings-modal__section']}>
        <span className={styles['settings-modal__label']}>{t('landing.settings.language')}</span>
        <div className={styles['settings-modal__language-buttons']}>
          <XPButton
            variant="neutral"
            disabled={language === 'es'}
            onClick={() => setLanguage('es')}
          >
            ES
          </XPButton>
          <XPButton
            variant="neutral"
            disabled={language === 'en'}
            onClick={() => setLanguage('en')}
          >
            EN
          </XPButton>
        </div>
      </div>

      <div className={styles['settings-modal__section']}>
        <span className={styles['settings-modal__label']}>{t('landing.settings.volume')}</span>
        <XPSlider
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={setVolume}
          onCommit={playPositive}
          ariaLabel={t('landing.settings.volume')}
        />
      </div>

      <div className={styles['settings-modal__section']}>
        <XPToggle checked={musicOn} onChange={setMusicOn} label={t('landing.settings.music')} />
      </div>
    </XPDialog>
  )
}
