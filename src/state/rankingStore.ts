import { create } from 'zustand'
import { load, save } from './storage'
import type { LevelId } from '../levels/types'

export type CharacterId = 0 | 1 | 2 | 3

export interface RankingEntry {
  username: string
  character: CharacterId
  maxLevel: LevelId
  /** ISO date string (yyyy-mm-dd), the day the record was set. */
  date: string
}

export interface RankingState {
  entries: RankingEntry[]
  /**
   * Records `maxLevel` for `username` only if it beats their own previous
   * record (or they have none yet). Never removed by a Game Over.
   */
  recordIfImproved: (result: {
    username: string
    character: CharacterId
    maxLevel: LevelId
  }) => void
}

export const RANKING_STORAGE_KEY = 'aac.v1.ranking'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export const useRankingStore = create<RankingState>()((set, get) => ({
  entries: load(RANKING_STORAGE_KEY, [] as RankingEntry[]),

  recordIfImproved: ({ username, character, maxLevel }) => {
    const existing = get().entries.find((entry) => entry.username === username)

    if (existing && existing.maxLevel >= maxLevel) {
      return
    }

    const nextEntries = existing
      ? get().entries.map((entry) =>
          entry.username === username ? { username, character, maxLevel, date: today() } : entry,
        )
      : [...get().entries, { username, character, maxLevel, date: today() }]

    set({ entries: nextEntries })
    save(RANKING_STORAGE_KEY, nextEntries)
  },
}))
