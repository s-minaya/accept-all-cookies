import { create } from 'zustand'
import { load, save } from './storage'
import type { CharacterId } from './rankingStore'

export interface PlayerState {
  character: CharacterId
  /** null en la primera visita: nunca se confirmó ninguno, así que la interfaz usa el nombre por defecto del personaje. */
  username: string | null
  setPlayer: (character: CharacterId, username: string) => void
}

export const PLAYER_STORAGE_KEY = 'aac.v1.lastPlayer'

interface PersistedPlayer {
  character: CharacterId
  username: string | null
}

const DEFAULT_PLAYER: PersistedPlayer = { character: 0, username: null }

/** El flujo de "Empezar" nunca obliga a elegir personaje (GDD §1.1): en la primera visita se juega como personaje 0. */
export const usePlayerStore = create<PlayerState>()((set) => ({
  // `{ ...DEFAULT_PLAYER, ...load(...) }` (no solo `...load(...)`), mismo
  // patrón que `runStore`/`settingsStore` (017-plan.md, bloque G,
  // reverificación de arranque con datos antiguos): un campo añadido en el
  // futuro que falte en un `aac.v1.lastPlayer` ya guardado cae en su
  // default en vez de quedar en `undefined`.
  ...DEFAULT_PLAYER,
  ...load(PLAYER_STORAGE_KEY, DEFAULT_PLAYER),

  setPlayer: (character, username) => {
    set({ character, username })
    save(PLAYER_STORAGE_KEY, { character, username })
  },
}))
