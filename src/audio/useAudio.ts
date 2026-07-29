import { useCallback, useEffect } from 'react'
import { audioManager } from './AudioManager'
import { useSettingsStore } from '../state/settingsStore'

export interface UseAudioResult {
  playPositive: () => void
  playNegative: () => void
  playCoin: () => void
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

  // Estables entre renders (`useCallback`, deps vacías — `audioManager` es
  // un singleton de módulo, nunca cambia): sin esto, cualquier consumidor
  // que las use dentro de su propio `useCallback`/`useEffect` (nivel 4,
  // `onCapture`) recibe una referencia nueva en cada render y arrastra ese
  // efecto a un bucle — ya pasó con los nodos publicados al canal (005),
  // aquí era la simulación de física entera la que se destruía y recreaba
  // en cada spawn (bug real, detectado en QA jugando: los botones parecían
  // "saltar" porque la simulación nunca llegaba a vivir más de una
  // fracción de segundo).
  const playPositive = useCallback(() => audioManager.playPositive(), [])
  const playNegative = useCallback(() => audioManager.playNegative(), [])
  const playCoin = useCallback(() => audioManager.playCoin(), [])

  return { playPositive, playNegative, playCoin }
}
