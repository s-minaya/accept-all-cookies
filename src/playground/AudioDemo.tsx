import { useAudio } from '../audio/useAudio'
import { useSettingsStore } from '../state/settingsStore'
import { XPButton } from '../components/xp/XPButton'
import styles from './Playground.module.css'

export function AudioDemo() {
  const { playPositive, playNegative } = useAudio()
  const volume = useSettingsStore((state) => state.volume)
  const musicOn = useSettingsStore((state) => state.musicOn)
  const setVolume = useSettingsStore((state) => state.setVolume)
  const setMusicOn = useSettingsStore((state) => state.setMusicOn)

  return (
    <div className={styles.row}>
      <XPButton variant="agree" onClick={playPositive}>
        Positive
      </XPButton>
      <XPButton variant="disagree" onClick={playNegative}>
        Negative
      </XPButton>
      <XPButton variant="neutral" onClick={() => setMusicOn(!musicOn)}>
        Music: {musicOn ? 'On' : 'Off'}
      </XPButton>
      <label className={styles.buttonSample}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
        <span>Volume {Math.round(volume * 100)}%</span>
      </label>
    </div>
  )
}
