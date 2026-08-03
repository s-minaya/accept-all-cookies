import coinUrl from '../assets/audio/coin.mp3'
import musicUrl from '../assets/audio/music.mp3'
import negativeUrl from '../assets/audio/negative.mp3'
import positiveUrl from '../assets/audio/positive.mp3'
import sansVoiceUrl from '../assets/audio/sans-voice.mp3'
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

/** Duración del fundido al agachar/restaurar la música mientras Sans habla (nivel 11, GDD §14). */
const DUCK_FADE_MS = 150

/**
 * Envoltorio singleton sobre HTMLAudioElement para los sonidos del juego.
 * Las políticas de autoplay exigen un gesto del usuario antes de que
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
  // Nivel 5 (tragaperras): al parar cualquier rodillo, sea cual sea el
  // símbolo resultante (Sofía: "cuando el usuario captura un botón, el que
  // sea, debe sonar este audio") — no distingue Agree/Disagree como
  // positive/negative, el veredicto final ya usa esos por separado.
  private readonly coin = new Audio(coinUrl)
  private readonly music = new Audio(musicUrl)
  // Nivel 11 (Sans): un elemento propio en loop, independiente de
  // positive/negative/coin (que se reproducen una vez y sueltan). Sujeto a
  // `soundEffectsOn` igual que el resto de efectos — sin ellos no tendría
  // sentido agachar la música por un silencio (015-plan.md).
  private readonly voice = new Audio(sansVoiceUrl)
  private musicVolume = 1
  private musicOn = true
  private soundEffectsOn = true
  private unlocked = false
  // Multiplicador de ducking sobre el volumen de música ya calculado
  // (factor por dispositivo × volumen de Ajustes): 1 = sin agachar, el
  // valor que `duckMusic`/`unduckMusic` funden con `fadeDuckTo` (015-plan.md,
  // "Ducking como multiplicador, no como valor absoluto"). Guardar el
  // *objetivo* (no ir multiplicando sobre el valor anterior) es lo que hace
  // que llamar dos veces seguidas sea idempotente por construcción.
  private duckFactor = 1
  private duckFadeTarget = 1
  private duckFadeFrom = 1
  private duckFadeStartTs: number | null = null
  private duckFadeRafId: number | null = null

  constructor() {
    this.music.loop = true
    this.voice.loop = true
    this.applyVolume()
  }

  private applyVolume(): void {
    this.music.volume = this.musicVolume * musicVolumeFactor() * this.duckFactor
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

  playCoin(): void {
    if (!this.soundEffectsOn) return
    this.coin.currentTime = 0
    this.safePlay(this.coin)
  }

  startMusic(): void {
    this.musicOn = true
    if (this.unlocked) this.safePlay(this.music)
  }

  stopMusic(): void {
    this.musicOn = false
    this.music.pause()
  }

  /** Arranca (o reinicia desde el principio) la voz en bucle de Sans. Respeta el interruptor de efectos. */
  startVoiceLoop(): void {
    if (!this.soundEffectsOn) return
    this.voice.currentTime = 0
    this.safePlay(this.voice)
  }

  /** Para la voz de Sans. Llamar sin que esté sonando es un no-op seguro. */
  stopVoiceLoop(): void {
    this.voice.pause()
  }

  /**
   * Funde el volumen de música hacia `this.musicVolume * musicVolumeFactor() * duckFactor`
   * en ~150ms por pasos de rAF (015-plan.md). Idempotente: guarda el
   * objetivo, no lo compone con el anterior, así que llamar dos veces con el
   * mismo factor no encadena reducciones.
   */
  private fadeDuckTo(target: number): void {
    this.duckFadeTarget = target
    if (this.duckFadeRafId !== null) return // ya hay un fundido en curso: solo actualiza el objetivo, lo recoge en su próximo paso

    this.duckFadeFrom = this.duckFactor
    this.duckFadeStartTs = null

    const step = (ts: number) => {
      if (this.duckFadeStartTs === null) this.duckFadeStartTs = ts
      const t = Math.min(1, (ts - this.duckFadeStartTs) / DUCK_FADE_MS)
      this.duckFactor = this.duckFadeFrom + (this.duckFadeTarget - this.duckFadeFrom) * t
      this.applyVolume()

      if (t >= 1) {
        this.duckFadeRafId = null
      } else {
        this.duckFadeRafId = requestAnimationFrame(step)
      }
    }
    this.duckFadeRafId = requestAnimationFrame(step)
  }

  /** Agacha la música al `factor` indicado (p. ej. 0.2 = 20% de su volumen normal) mientras Sans habla. */
  duckMusic(factor: number): void {
    this.fadeDuckTo(factor)
  }

  /** Restaura la música a su volumen normal. Se llama siempre desde el cleanup de `useTypewriter`, sin excepciones. */
  unduckMusic(): void {
    this.fadeDuckTo(1)
  }
}

export const audioManager = new AudioManager()
