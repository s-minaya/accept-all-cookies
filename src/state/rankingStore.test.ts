import { beforeEach, describe, expect, it } from 'vitest'
import { RANKING_STORAGE_KEY, useRankingStore } from './rankingStore'
import { load } from './storage'

describe('rankingStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useRankingStore.setState({ entries: [] })
  })

  it('starts empty when nothing was persisted', () => {
    expect(useRankingStore.getState().entries).toEqual([])
  })

  it('adds a new entry for a username with no prior record', () => {
    useRankingStore.getState().recordIfImproved({ username: 'sofia', character: 2, maxLevel: 3 })
    expect(useRankingStore.getState().entries).toEqual([
      expect.objectContaining({ username: 'sofia', character: 2, maxLevel: 3 }),
    ])
  })

  it('updates the entry when the new run beats the previous record', () => {
    useRankingStore.getState().recordIfImproved({ username: 'sofia', character: 2, maxLevel: 3 })
    useRankingStore.getState().recordIfImproved({ username: 'sofia', character: 2, maxLevel: 5 })

    const entries = useRankingStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].maxLevel).toBe(5)
  })

  it('leaves the record untouched when the new run does not beat it', () => {
    useRankingStore.getState().recordIfImproved({ username: 'sofia', character: 2, maxLevel: 6 })
    useRankingStore.getState().recordIfImproved({ username: 'sofia', character: 2, maxLevel: 4 })

    const entries = useRankingStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].maxLevel).toBe(6)
  })

  it('keeps separate usernames as separate entries', () => {
    useRankingStore.getState().recordIfImproved({ username: 'sofia', character: 2, maxLevel: 3 })
    useRankingStore.getState().recordIfImproved({ username: 'nay', character: 0, maxLevel: 7 })

    expect(useRankingStore.getState().entries).toHaveLength(2)
  })

  it('persists to storage whenever a record improves', () => {
    useRankingStore.getState().recordIfImproved({ username: 'sofia', character: 2, maxLevel: 3 })
    const stored = load<{ maxLevel: number }[]>(RANKING_STORAGE_KEY, [])
    expect(stored).toHaveLength(1)
    expect(stored[0].maxLevel).toBe(3)
  })
})
