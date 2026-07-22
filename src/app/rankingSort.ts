import type { RankingEntry } from '../state/rankingStore'

/** GDD §1.2: mayor `maxLevel` primero; en caso de empate, gana la fecha más antigua. */
export function sortRanking(entries: readonly RankingEntry[]): RankingEntry[] {
  return [...entries].sort((a, b) => {
    if (b.maxLevel !== a.maxLevel) return b.maxLevel - a.maxLevel
    return a.date.localeCompare(b.date)
  })
}
