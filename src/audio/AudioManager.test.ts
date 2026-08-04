import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { audioManager } from './AudioManager'

function mockPointer(coarse: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: coarse }) as unknown as typeof window.matchMedia,
  )
}

// `music`/`positive`/`negative` son privados de TS, no de JS (#), así que
// los tests pueden acceder a ellos sin ampliar la API pública de AudioManager.
function musicVolume(): number {
  return (audioManager as unknown as { music: HTMLAudioElement }).music.volume
}

function effectsVolume(): { positive: number; negative: number } {
  const manager = audioManager as unknown as {
    positive: HTMLAudioElement
    negative: HTMLAudioElement
  }
  return { positive: manager.positive.volume, negative: manager.negative.volume }
}

describe('AudioManager music volume factor', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('applies the desktop factor (0.5) on a fine (mouse) pointer', () => {
    mockPointer(false)
    audioManager.setVolume(1)
    expect(musicVolume()).toBeCloseTo(0.5)
  })

  it('applies the mobile factor (0.1) on a coarse (touch) pointer', () => {
    mockPointer(true)
    audioManager.setVolume(1)
    expect(musicVolume()).toBeCloseTo(0.1)
  })

  it('still multiplies by the general volume on top of the device factor', () => {
    mockPointer(false)
    audioManager.setVolume(0.4)
    expect(musicVolume()).toBeCloseTo(0.2)
  })

  it('never touches the effects volume — only music', () => {
    mockPointer(false)
    const before = effectsVolume()
    audioManager.setVolume(0.1)
    expect(effectsVolume()).toEqual(before)
  })
})

describe('AudioManager sound effects toggle', () => {
  afterEach(() => {
    audioManager.setSoundEffectsOn(true)
    vi.restoreAllMocks()
  })

  it('plays positive/negative/coin when the toggle is on (default)', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')
    audioManager.playPositive()
    audioManager.playNegative()
    audioManager.playCoin()
    expect(play).toHaveBeenCalledTimes(3)
  })

  it('mutes positive/negative/coin when the toggle is off, independently of musicOn', () => {
    audioManager.setSoundEffectsOn(false)
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')
    audioManager.playPositive()
    audioManager.playNegative()
    audioManager.playCoin()
    expect(play).not.toHaveBeenCalled()
  })
})

describe('AudioManager voice loop (nivel 11, 015-plan.md)', () => {
  afterEach(() => {
    audioManager.setSoundEffectsOn(true)
    audioManager.stopVoiceLoop()
    vi.restoreAllMocks()
  })

  it('starts the voice loop from the beginning when the toggle is on', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')
    audioManager.startVoiceLoop()
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('does not play the voice when the sound effects toggle is off', () => {
    audioManager.setSoundEffectsOn(false)
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')
    audioManager.startVoiceLoop()
    expect(play).not.toHaveBeenCalled()
  })

  it('stopVoiceLoop pauses playback', () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause')
    audioManager.startVoiceLoop()
    audioManager.stopVoiceLoop()
    expect(pause).toHaveBeenCalled()
  })
})

describe('AudioManager music ducking (nivel 11, 015-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockPointer(false)
    audioManager.setVolume(1)
  })

  afterEach(() => {
    // Deja el ducking a 1 (sin agachar) para no filtrar estado entre tests.
    audioManager.unduckMusic()
    vi.advanceTimersByTime(500)
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('fades the music down to the given factor over ~150ms', () => {
    const before = musicVolume()
    audioManager.duckMusic(0.2)
    vi.advanceTimersByTime(200)
    expect(musicVolume()).toBeCloseTo(before * 0.2)
  })

  it('unduckMusic restores the exact previous volume', () => {
    const before = musicVolume()
    audioManager.duckMusic(0.2)
    vi.advanceTimersByTime(200)
    audioManager.unduckMusic()
    vi.advanceTimersByTime(200)
    expect(musicVolume()).toBeCloseTo(before)
  })

  it('is idempotent: calling duckMusic twice with the same factor does not compound the reduction', () => {
    const before = musicVolume()
    audioManager.duckMusic(0.2)
    vi.advanceTimersByTime(200)
    const afterFirst = musicVolume()
    audioManager.duckMusic(0.2)
    vi.advanceTimersByTime(200)
    expect(musicVolume()).toBeCloseTo(afterFirst)
    expect(musicVolume()).not.toBeCloseTo(before * 0.2 * 0.2)
  })

  it('still respects the Ajustes volume slider on top of the duck factor', () => {
    audioManager.setVolume(0.5)
    audioManager.duckMusic(0.2)
    vi.advanceTimersByTime(200)
    // 0.5 (Ajustes) * 0.5 (factor de escritorio) * 0.2 (ducking)
    expect(musicVolume()).toBeCloseTo(0.05)
  })
})
