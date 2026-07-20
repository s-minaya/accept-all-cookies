import { describe, expect, it } from 'vitest'
import { sortRanking } from './rankingSort'
import type { RankingEntry } from '../state/rankingStore'

function entry(username: string, maxLevel: number, date: string): RankingEntry {
  return { username, character: 0, maxLevel: maxLevel as RankingEntry['maxLevel'], date }
}

describe('sortRanking', () => {
  it('orders by maxLevel descending', () => {
    const entries = [
      entry('a', 3, '2026-01-01'),
      entry('b', 9, '2026-01-01'),
      entry('c', 6, '2026-01-01'),
    ]
    expect(sortRanking(entries).map((e) => e.username)).toEqual(['b', 'c', 'a'])
  })

  it('breaks ties by the oldest date first', () => {
    const entries = [
      entry('newer', 5, '2026-03-01'),
      entry('older', 5, '2026-01-01'),
      entry('middle', 5, '2026-02-01'),
    ]
    expect(sortRanking(entries).map((e) => e.username)).toEqual(['older', 'middle', 'newer'])
  })

  it('does not mutate the original array', () => {
    const entries = [entry('a', 1, '2026-01-01'), entry('b', 2, '2026-01-01')]
    const originalOrder = entries.map((e) => e.username)
    sortRanking(entries)
    expect(entries.map((e) => e.username)).toEqual(originalOrder)
  })

  it('handles an empty ranking', () => {
    expect(sortRanking([])).toEqual([])
  })
})
