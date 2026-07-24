import musicUrl from '../assets/audio/music.mp3'
import negativeUrl from '../assets/audio/negative.mp3'
import positiveUrl from '../assets/audio/positive.mp3'
import { isCoarsePointerDevice } from '../hooks/device'

/**
 * La música de fondo es intencionadamente más baja que los efectos: además
 * del volumen general, tiene su propio multiplicador (GDD §2.3, §14),
 * distinto según el dispositivo — los altavoces del móvil hacen que el mismo
 * factor suene más alto que en escritorio.
 */
const DESKTOP_MUSIC_VOLUME_FACTOR = 0.5
const MOBILE_MUSIC_VOLUME_FACTOR = 0.1

function musicVolumeFactor(): number {
  return isCoarsePointerDevice() ? MOBILE_MUSIC_VOLUME_FACTOR : DESKTOP_MUSIC_VOLUME_FACTOR
}

/**
 * Envoltorio singleton sobre HTMLAudioElement para los tres sonidos del
 * juego. Las políticas de autoplay exigen un gesto del usuario antes de que
 * `HTMLAudioElement.play()` se resuelva, así que la música no empieza de
 * verdad hasta que se ejecuta `unlock()` (primer pointerdown global,
 * conectado desde `useAudio`).
 */
class AudioManager {
  // Los efectos siempre suenan al volumen máximo — el slider de Ajustes
  // solo controla la música. Se deja en el valor por defecto de
  // HTMLAudioElement (1.0). Un interruptor independiente (musicOn no lo
  // afecta) los silencia por completo.
  private readonly positive = new Audio(positiveUrl)
  private readonly negative = new Audio(negativeUrl)
  private readonly music = new Audio(musicUrl)
  private musicVolume = 1
  private musicOn = true
  private soundEffectsOn = true
  private unlocked = false

  constructor() {
    this.music.loop = true
    this.applyVolume()
  }

  private applyVolume(): void {
    this.music.volume = this.musicVolume * musicVolumeFactor()
  }

  // HTMLMediaElement.play() devuelve una Promise en navegadores reales,
  // pero en jsdom (tests) devuelve undefined — se protegen ambos casos para
  // que los tests no necesiten audio real.
  private safePlay(element: HTMLAudioElement): void {
    element.play()?.catch(() => {})
  }

  /** Se llama desde un gesto real del usuario (primer pointerdown) para cumplir las políticas de autoplay. */
  unlock(): void {
    if (this.unlocked) return
    this.unlocked = true
    if (this.musicOn) this.safePlay(this.music)
  }

  setVolume(volume: number): void {
    this.musicVolume = volume
    this.applyVolume()
  }

  setSoundEffectsOn(soundEffectsOn: boolean): void {
    this.soundEffectsOn = soundEffectsOn
  }

  playPositive(): void {
    if (!this.soundEffectsOn) return
    this.positive.currentTime = 0
    this.safePlay(this.positive)
  }

  playNegative(): void {
    if (!this.soundEffectsOn) return
    this.negative.currentTime = 0
    this.safePlay(this.negative)
  }

  startMusic(): void {
    this.musicOn = true
    if (this.unlocked) this.safePlay(this.music)
  }

  stopMusic(): void {
    this.musicOn = false
    this.music.pause()
  }
}

export const audioManager = new AudioManager()
