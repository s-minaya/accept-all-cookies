import { useEffect } from 'react'
import { audioManager } from './AudioManager'
import { useSettingsStore } from '../state/settingsStore'

export interface UseAudioResult {
  playPositive: () => void
  playNegative: () => void
}

/**
 * Mantiene AudioManager sincronizado con settingsStore y desbloquea la
 * reproducción en el primer pointerdown de toda la app (políticas de
 * autoplay). Se monta una vez cerca de la raíz; montarlo de nuevo (p. ej. en
 * la Playground) es seguro porque AudioManager es un singleton y
 * `unlock()` es idempotente.
 */
export function useAudio(): UseAudioResult {
  const volume = useSettingsStore((state) => state.volume)
  const musicOn = useSettingsStore((state) => state.musicOn)
  const soundEffectsOn = useSettingsStore((state) => state.soundEffectsOn)

  useEffect(() => {
    audioManager.setVolume(volume)
  }, [volume])

  useEffect(() => {
    if (musicOn) audioManager.startMusic()
    else audioManager.stopMusic()
  }, [musicOn])

  useEffect(() => {
    audioManager.setSoundEffectsOn(soundEffectsOn)
  }, [soundEffectsOn])

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
