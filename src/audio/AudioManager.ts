import musicUrl from '../assets/audio/music.mp3'
import negativeUrl from '../assets/audio/negative.mp3'
import positiveUrl from '../assets/audio/positive.mp3'

/**
 * Background music is intentionally quieter than the sound effects:
 * on top of the general volume it gets its own multiplier (GDD §2.3, §14).
 * Caps the music at 50% of its own max volume, independent of the general
 * volume slider. Re-tuned by Sofía after the 002 deploy (2026-07-20),
 * replacing the 0.15 set at the dev-time checkpoint.
 */
const MUSIC_VOLUME_FACTOR = 0.5

/**
 * Singleton wrapper over HTMLAudioElement for the game's three sound assets.
 * Autoplay policies require a user gesture before `HTMLAudioElement.play()`
 * resolves, so music only actually starts after `unlock()` runs (first
 * global pointerdown, wired by `useAudio`).
 */
class AudioManager {
  private readonly positive = new Audio(positiveUrl)
  private readonly negative = new Audio(negativeUrl)
  private readonly music = new Audio(musicUrl)
  private volume = 1
  private musicOn = true
  private unlocked = false

  constructor() {
    this.music.loop = true
    this.applyVolume()
  }

  private applyVolume(): void {
    this.positive.volume = this.volume
    this.negative.volume = this.volume
    this.music.volume = this.volume * MUSIC_VOLUME_FACTOR
  }

  // HTMLMediaElement.play() returns a Promise in real browsers, but jsdom
  // (unit tests) returns undefined — guard both so tests don't need real audio.
  private safePlay(element: HTMLAudioElement): void {
    element.play()?.catch(() => {})
  }

  /** Call from a real user gesture (first pointerdown) to satisfy autoplay policies. */
  unlock(): void {
    if (this.unlocked) return
    this.unlocked = true
    if (this.musicOn) this.safePlay(this.music)
  }

  setVolume(volume: number): void {
    this.volume = volume
    this.applyVolume()
  }

  playPositive(): void {
    this.positive.currentTime = 0
    this.safePlay(this.positive)
  }

  playNegative(): void {
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
