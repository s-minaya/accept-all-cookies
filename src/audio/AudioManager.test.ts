import { afterEach, describe, expect, it, vi } from 'vitest'
import { audioManager } from './AudioManager'

function mockPointer(coarse: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: coarse }) as unknown as typeof window.matchMedia,
  )
}

// `music` is TS-private, not JS-private (#), so tests can still reach it to
// assert the resulting volume without expanding AudioManager's public API.
function musicVolume(): number {
  return (audioManager as unknown as { music: HTMLAudioElement }).music.volume
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
})
