import type { RankingEntry } from '../state/rankingStore'

/** GDD §1.2: highest `maxLevel` first; ties broken by the oldest date first. */
export function sortRanking(entries: readonly RankingEntry[]): RankingEntry[] {
  return [...entries].sort((a, b) => {
    if (b.maxLevel !== a.maxLevel) return b.maxLevel - a.maxLevel
    return a.date.localeCompare(b.date)
  })
}
