import { create } from 'zustand'
import { load, save } from './storage'

export type Language = 'es' | 'en'

export interface Settings {
  language: Language
  volume: number
  musicOn: boolean
}

export interface SettingsState extends Settings {
  setLanguage: (language: Language) => void
  setVolume: (volume: number) => void
  setMusicOn: (musicOn: boolean) => void
}

export const SETTINGS_STORAGE_KEY = 'aac.v1.settings'

const DEFAULT_SETTINGS: Settings = {
  language: 'es',
  volume: 0.8,
  musicOn: true,
}

function persist(get: () => SettingsState): void {
  const { language, volume, musicOn } = get()
  save(SETTINGS_STORAGE_KEY, { language, volume, musicOn })
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...load(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS),

  setLanguage: (language) => {
    set({ language })
    persist(get)
  },

  setVolume: (volume) => {
    set({ volume })
    persist(get)
  },

  setMusicOn: (musicOn) => {
    set({ musicOn })
    persist(get)
  },
}))
