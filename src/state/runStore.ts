import { create } from 'zustand'
import { LEVEL_DURATION_SECONDS, type LevelId } from '../levels/types'
import { load, save } from './storage'

const FIRST_LEVEL: LevelId = 1
const LAST_LEVEL: LevelId = 12

export interface RunState {
  completedLevels: LevelId[]
  currentLevel: LevelId
  /** Segundos restantes del contador del nivel activo, o null si no hay ningún nivel en curso. Se sincroniza en cada tick para que recargar la página retome exactamente donde se dejó. */
  activeLevelTimeLeft: number | null
  /** Marca `levelId` como completado; `currentLevel` pasa a ser el primer nivel sin completar. */
  completeLevel: (levelId: LevelId) => void
  /** Reinicia la partida actual desde cero en el nivel 1 (no toca el ranking). */
  resetRun: () => void
  /** Se llama al entrar en `currentLevel`: arranca su contador de nuevo en 100. */
  enterLevel: () => void
  /** Se llama en cada tick del contador mientras hay un nivel activo. */
  updateActiveLevelTime: (timeLeft: number) => void
}

export const RUN_STORAGE_KEY = 'aac.v1.run'

interface PersistedRun {
  completedLevels: LevelId[]
  currentLevel: LevelId
  activeLevelTimeLeft: number | null
}

const DEFAULT_RUN: PersistedRun = {
  completedLevels: [],
  currentLevel: FIRST_LEVEL,
  activeLevelTimeLeft: null,
}

function firstIncomplete(completedLevels: LevelId[]): LevelId {
  for (let level = FIRST_LEVEL; level <= LAST_LEVEL; level++) {
    if (!completedLevels.includes(level as LevelId)) return level as LevelId
  }
  return LAST_LEVEL
}

function persist(get: () => RunState): void {
  const { completedLevels, currentLevel, activeLevelTimeLeft } = get()
  save(RUN_STORAGE_KEY, { completedLevels, currentLevel, activeLevelTimeLeft })
}

/**
 * Persistido igual que settings/ranking (AGENTS.md: recargar la página no
 * debe hacer perder el progreso del jugador, el nivel actual ni el contador
 * — ver 002-plan.md). Solo un Game Over lo reinicia.
 */
export const useRunStore = create<RunState>()((set, get) => ({
  ...load(RUN_STORAGE_KEY, DEFAULT_RUN),

  completeLevel: (levelId) => {
    const completedLevels = get().completedLevels.includes(levelId)
      ? get().completedLevels
      : [...get().completedLevels, levelId]

    set({
      completedLevels,
      currentLevel: firstIncomplete(completedLevels),
      activeLevelTimeLeft: null,
    })
    persist(get)
  },

  resetRun: () => {
    set({ completedLevels: [], currentLevel: FIRST_LEVEL, activeLevelTimeLeft: null })
    persist(get)
  },

  enterLevel: () => {
    set({ activeLevelTimeLeft: LEVEL_DURATION_SECONDS })
    persist(get)
  },

  updateActiveLevelTime: (timeLeft) => {
    set({ activeLevelTimeLeft: timeLeft })
    persist(get)
  },
}))
