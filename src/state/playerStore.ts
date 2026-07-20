import { create } from 'zustand'
import { load, save } from './storage'
import type { CharacterId } from './rankingStore'

export interface PlayerState {
  character: CharacterId
  /** null on a first visit: never confirmed one, so the UI falls back to the character's default name. */
  username: string | null
  setPlayer: (character: CharacterId, username: string) => void
}

export const PLAYER_STORAGE_KEY = 'aac.v1.lastPlayer'

interface PersistedPlayer {
  character: CharacterId
  username: string | null
}

const DEFAULT_PLAYER: PersistedPlayer = { character: 0, username: null }

/** The "Empezar" flow never forces character selection (GDD §1.1): first visit plays as character 0. */
export const usePlayerStore = create<PlayerState>()((set) => ({
  ...load(PLAYER_STORAGE_KEY, DEFAULT_PLAYER),

  setPlayer: (character, username) => {
    set({ character, username })
    save(PLAYER_STORAGE_KEY, { character, username })
  },
}))
