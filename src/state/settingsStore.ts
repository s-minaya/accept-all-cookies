import { create } from 'zustand'
import { load, save } from './storage'

export type Language = 'es' | 'en'

export interface Settings {
  language: Language
  volume: number
  musicOn: boolean
  soundEffectsOn: boolean
}

export interface SettingsState extends Settings {
  setLanguage: (language: Language) => void
  setVolume: (volume: number) => void
  setMusicOn: (musicOn: boolean) => void
  setSoundEffectsOn: (soundEffectsOn: boolean) => void
}

export const SETTINGS_STORAGE_KEY = 'aac.v1.settings'

const DEFAULT_SETTINGS: Settings = {
  language: 'es',
  volume: 0.8,
  musicOn: true,
  soundEffectsOn: true,
}

function persist(get: () => SettingsState): void {
  const { language, volume, musicOn, soundEffectsOn } = get()
  save(SETTINGS_STORAGE_KEY, { language, volume, musicOn, soundEffectsOn })
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  // Se combina con DEFAULT_SETTINGS (no solo con el valor cargado) para que
  // un campo nuevo como soundEffectsOn tenga un valor por defecto razonable
  // si los ajustes guardados aún tienen la forma antigua, más pequeña
  // (política de claves versionadas, 002-plan.md).
  ...DEFAULT_SETTINGS,
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

  setSoundEffectsOn: (soundEffectsOn) => {
    set({ soundEffectsOn })
    persist(get)
  },
}))
