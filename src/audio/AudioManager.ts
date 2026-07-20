import musicUrl from '../assets/audio/music.mp3'
import negativeUrl from '../assets/audio/negative.mp3'
import positiveUrl from '../assets/audio/positive.mp3'

/**
 * Background music is intentionally quieter than the sound effects: on top
 * of the general volume it gets its own multiplier (GDD §2.3, §14), which
 * differs by device — phone speakers make it read louder than the same
 * factor does on desktop. Tuned by Sofía after hearing it live on Pages
 * (2026-07-20).
 */
const DESKTOP_MUSIC_VOLUME_FACTOR = 0.5
const MOBILE_MUSIC_VOLUME_FACTOR = 0.1

/** Touch-primary device (phone/tablet) vs mouse-primary (desktop), not tied to viewport width. */
function isMobileDevice(): boolean {
  return window.matchMedia?.('(pointer: coarse)')?.matches === true
}

function musicVolumeFactor(): number {
  return isMobileDevice() ? MOBILE_MUSIC_VOLUME_FACTOR : DESKTOP_MUSIC_VOLUME_FACTOR
}

/**
 * Singleton wrapper over HTMLAudioElement for the game's three sound assets.
 * Autoplay policies require a user gesture before `HTMLAudioElement.play()`
 * resolves, so music only actually starts after `unlock()` runs (first
 * global pointerdown, wired by `useAudio`).
 */
class AudioManager {
  // Effects always play at full volume — the Ajustes slider controls music
  // only (Sofía, 2026-07-20). Left at HTMLAudioElement's own 1.0 default.
  private readonly positive = new Audio(positiveUrl)
  private readonly negative = new Audio(negativeUrl)
  private readonly music = new Audio(musicUrl)
  private musicVolume = 1
  private musicOn = true
  private unlocked = false

  constructor() {
    this.music.loop = true
    this.applyVolume()
  }

  private applyVolume(): void {
    this.music.volume = this.musicVolume * musicVolumeFactor()
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
    this.musicVolume = volume
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
