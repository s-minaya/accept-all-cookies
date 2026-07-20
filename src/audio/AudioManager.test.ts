import { afterEach, describe, expect, it, vi } from 'vitest'
import { audioManager } from './AudioManager'

function mockPointer(coarse: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: coarse }) as unknown as typeof window.matchMedia,
  )
}

// `music`/`positive`/`negative` are TS-private, not JS-private (#), so tests
// can still reach them without expanding AudioManager's public API.
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
