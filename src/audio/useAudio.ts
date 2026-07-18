import { useEffect } from 'react'
import { audioManager } from './AudioManager'
import { useSettingsStore } from '../state/settingsStore'

export interface UseAudioResult {
  playPositive: () => void
  playNegative: () => void
}

/**
 * Keeps AudioManager in sync with settingsStore and unlocks playback on the
 * first pointerdown anywhere in the app (autoplay policies). Mount once near
 * the app root; safe to mount again (e.g. in the Playground) since
 * AudioManager itself is a singleton and `unlock()` is idempotent.
 */
export function useAudio(): UseAudioResult {
  const volume = useSettingsStore((state) => state.volume)
  const musicOn = useSettingsStore((state) => state.musicOn)

  useEffect(() => {
    audioManager.setVolume(volume)
  }, [volume])

  useEffect(() => {
    if (musicOn) audioManager.startMusic()
    else audioManager.stopMusic()
  }, [musicOn])

  useEffect(() => {
    const unlock = () => {
      audioManager.unlock()
      window.removeEventListener('pointerdown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  return {
    playPositive: () => audioManager.playPositive(),
    playNegative: () => audioManager.playNegative(),
  }
}
