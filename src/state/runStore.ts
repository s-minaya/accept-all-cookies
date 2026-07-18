import { create } from 'zustand'
import { LEVEL_DURATION_SECONDS, type LevelId } from '../levels/types'
import { load, save } from './storage'

const FIRST_LEVEL: LevelId = 1
const LAST_LEVEL: LevelId = 12

export interface RunState {
  completedLevels: LevelId[]
  currentLevel: LevelId
  /** Seconds left on the active level's countdown, or null when not inside a level. Kept in sync every tick so a reload resumes exactly where the player left off. */
  activeLevelTimeLeft: number | null
  /** Marks `levelId` as completed; `currentLevel` becomes the first level not yet completed. */
  completeLevel: (levelId: LevelId) => void
  /** Wipes the current run back to a fresh start at level 1 (does not touch the ranking). */
  resetRun: () => void
  /** Call when entering `currentLevel`: starts its countdown fresh at 100. */
  enterLevel: () => void
  /** Call on every countdown tick while a level is active. */
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
 * Persisted like settings/ranking (AGENTS.md: reloading must not lose the
 * player's progress, current level, or the level's countdown — feedback
 * from Sofía, see 002-plan.md). Only a Game Over wipes it.
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
