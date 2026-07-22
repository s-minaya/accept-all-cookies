import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SETTINGS_STORAGE_KEY, useSettingsStore } from './settingsStore'
import { load } from './storage'

describe('settingsStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useSettingsStore.setState({ language: 'es', volume: 0.8, musicOn: true, soundEffectsOn: true })
  })

  it('starts from defaults when nothing was persisted', () => {
    const state = useSettingsStore.getState()
    expect(state).toMatchObject({
      language: 'es',
      volume: 0.8,
      musicOn: true,
      soundEffectsOn: true,
    })
  })

  it('persists the language on change', () => {
    useSettingsStore.getState().setLanguage('en')
    expect(useSettingsStore.getState().language).toBe('en')
    expect(load(SETTINGS_STORAGE_KEY, null)).toMatchObject({ language: 'en' })
  })

  it('persists the volume on change', () => {
    useSettingsStore.getState().setVolume(0.3)
    expect(useSettingsStore.getState().volume).toBe(0.3)
    expect(load(SETTINGS_STORAGE_KEY, null)).toMatchObject({ volume: 0.3 })
  })

  it('persists musicOn on change', () => {
    useSettingsStore.getState().setMusicOn(false)
    expect(useSettingsStore.getState().musicOn).toBe(false)
    expect(load(SETTINGS_STORAGE_KEY, null)).toMatchObject({ musicOn: false })
  })

  it('persists soundEffectsOn on change, independently of musicOn', () => {
    useSettingsStore.getState().setSoundEffectsOn(false)
    expect(useSettingsStore.getState().soundEffectsOn).toBe(false)
    expect(useSettingsStore.getState().musicOn).toBe(true)
    expect(load(SETTINGS_STORAGE_KEY, null)).toMatchObject({ soundEffectsOn: false, musicOn: true })
  })

  it('keeps the other fields untouched when persisting one change', () => {
    useSettingsStore.getState().setVolume(0.1)
    useSettingsStore.getState().setLanguage('en')
    expect(load(SETTINGS_STORAGE_KEY, null)).toEqual({
      language: 'en',
      volume: 0.1,
      musicOn: true,
      soundEffectsOn: true,
    })
  })

  it('falls back to soundEffectsOn: true when loading an older persisted shape without it', async () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ language: 'en', volume: 0.3, musicOn: false }),
    )
    vi.resetModules()
    const { useSettingsStore: reloadedStore } = await import('./settingsStore')
    expect(reloadedStore.getState()).toMatchObject({
      language: 'en',
      volume: 0.3,
      musicOn: false,
      soundEffectsOn: true,
    })
  })
})
