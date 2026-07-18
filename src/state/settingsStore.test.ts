import { beforeEach, describe, expect, it } from 'vitest'
import { SETTINGS_STORAGE_KEY, useSettingsStore } from './settingsStore'
import { load } from './storage'

describe('settingsStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useSettingsStore.setState({ language: 'es', volume: 0.8, musicOn: true })
  })

  it('starts from defaults when nothing was persisted', () => {
    const state = useSettingsStore.getState()
    expect(state).toMatchObject({ language: 'es', volume: 0.8, musicOn: true })
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

  it('keeps the other fields untouched when persisting one change', () => {
    useSettingsStore.getState().setVolume(0.1)
    useSettingsStore.getState().setLanguage('en')
    expect(load(SETTINGS_STORAGE_KEY, null)).toEqual({ language: 'en', volume: 0.1, musicOn: true })
  })
})
