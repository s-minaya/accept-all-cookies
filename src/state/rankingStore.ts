import { create } from 'zustand'
import { load, save } from './storage'
import type { LevelId } from '../levels/types'

export type CharacterId = 0 | 1 | 2 | 3

export interface RankingEntry {
  username: string
  character: CharacterId
  maxLevel: LevelId
  /** Fecha en formato ISO (aaaa-mm-dd), el día en que se estableció el récord. */
  date: string
  /** Completó el nivel 12 alguna vez. Opcional: las entradas guardadas antes de la 004 no lo tienen. */
  finished?: boolean
}

export interface RankingState {
  entries: RankingEntry[]
  /**
   * Guarda `maxLevel` para `username` solo si supera su propio récord
   * anterior (o todavía no tiene ninguno). Un Game Over nunca lo borra. Se
   * llama al abrir cada nivel, con ese nivel como `maxLevel` (morir en el 7
   * deja récord 7).
   */
  recordIfImproved: (result: {
    username: string
    character: CharacterId
    maxLevel: LevelId
  }) => void
  /** Marca la partida de `username` como terminada al completar el nivel 12. */
  markFinished: (result: { username: string; character: CharacterId }) => void
}

export const RANKING_STORAGE_KEY = 'aac.v1.ranking'
const FINAL_LEVEL: LevelId = 12

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
          entry.username === username ? { ...entry, character, maxLevel, date: today() } : entry,
        )
      : [...get().entries, { username, character, maxLevel, date: today() }]

    set({ entries: nextEntries })
    save(RANKING_STORAGE_KEY, nextEntries)
  },

  markFinished: ({ username, character }) => {
    const existing = get().entries.find((entry) => entry.username === username)

    const nextEntries = existing
      ? get().entries.map((entry) =>
          entry.username === username
            ? { ...entry, character, maxLevel: FINAL_LEVEL, finished: true, date: today() }
            : entry,
        )
      : [
          ...get().entries,
          { username, character, maxLevel: FINAL_LEVEL, finished: true, date: today() },
        ]

    set({ entries: nextEntries })
    save(RANKING_STORAGE_KEY, nextEntries)
  },
}))
