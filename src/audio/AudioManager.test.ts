import { afterEach, describe, expect, it, vi } from 'vitest'
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

  it('never touches the effects volume — only music (Sofía, 2026-07-20)', () => {
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

  it('plays positive/negative when the toggle is on (default)', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')
    audioManager.playPositive()
    audioManager.playNegative()
    expect(play).toHaveBeenCalledTimes(2)
  })

  it('mutes positive/negative when the toggle is off, independently of musicOn', () => {
    audioManager.setSoundEffectsOn(false)
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')
    audioManager.playPositive()
    audioManager.playNegative()
    expect(play).not.toHaveBeenCalled()
  })
})
