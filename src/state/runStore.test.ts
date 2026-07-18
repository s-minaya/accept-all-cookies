import { beforeEach, describe, expect, it } from 'vitest'
import { RUN_STORAGE_KEY, useRunStore } from './runStore'
import { useRankingStore } from './rankingStore'
import { load } from './storage'

describe('runStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useRunStore.setState({ completedLevels: [], currentLevel: 1, activeLevelTimeLeft: null })
    useRankingStore.setState({ entries: [] })
  })

  it('starts at level 1 with nothing completed and no active level', () => {
    expect(useRunStore.getState()).toMatchObject({
      completedLevels: [],
      currentLevel: 1,
      activeLevelTimeLeft: null,
    })
  })

  it('marks a level as completed and advances currentLevel', () => {
    useRunStore.getState().completeLevel(1)
    expect(useRunStore.getState().completedLevels).toEqual([1])
    expect(useRunStore.getState().currentLevel).toBe(2)
  })

  it('currentLevel is always the first level not yet completed', () => {
    useRunStore.getState().completeLevel(1)
    useRunStore.getState().completeLevel(2)
    useRunStore.getState().completeLevel(3)
    expect(useRunStore.getState().currentLevel).toBe(4)
  })

  it('does not duplicate a level completed twice', () => {
    useRunStore.getState().completeLevel(1)
    useRunStore.getState().completeLevel(1)
    expect(useRunStore.getState().completedLevels).toEqual([1])
  })

  it('resetRun wipes progress back to level 1', () => {
    useRunStore.getState().completeLevel(1)
    useRunStore.getState().completeLevel(2)
    useRunStore.getState().resetRun()
    expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
  })

  it('resetRun (losing) does not touch the ranking store', () => {
    useRankingStore.getState().recordIfImproved({ username: 'sofia', character: 0, maxLevel: 5 })
    useRunStore.getState().completeLevel(1)

    useRunStore.getState().resetRun()

    expect(useRankingStore.getState().entries).toEqual([
      expect.objectContaining({ username: 'sofia', maxLevel: 5 }),
    ])
  })

  describe('active level countdown (survives a reload)', () => {
    it('enterLevel starts the countdown at 100', () => {
      useRunStore.getState().enterLevel()
      expect(useRunStore.getState().activeLevelTimeLeft).toBe(100)
    })

    it('updateActiveLevelTime tracks each tick', () => {
      useRunStore.getState().enterLevel()
      useRunStore.getState().updateActiveLevelTime(63)
      expect(useRunStore.getState().activeLevelTimeLeft).toBe(63)
    })

    it('completeLevel (winning) clears the active level', () => {
      useRunStore.getState().enterLevel()
      useRunStore.getState().updateActiveLevelTime(40)
      useRunStore.getState().completeLevel(1)
      expect(useRunStore.getState().activeLevelTimeLeft).toBeNull()
    })

    it('resetRun (losing) clears the active level', () => {
      useRunStore.getState().enterLevel()
      useRunStore.getState().updateActiveLevelTime(12)
      useRunStore.getState().resetRun()
      expect(useRunStore.getState().activeLevelTimeLeft).toBeNull()
    })
  })

  describe('persistence (a reload must not lose progress or the countdown)', () => {
    it('persists completedLevels/currentLevel on completeLevel', () => {
      useRunStore.getState().completeLevel(1)
      expect(load(RUN_STORAGE_KEY, null)).toMatchObject({ completedLevels: [1], currentLevel: 2 })
    })

    it('persists the reset on resetRun', () => {
      useRunStore.getState().completeLevel(1)
      useRunStore.getState().resetRun()
      expect(load(RUN_STORAGE_KEY, null)).toMatchObject({ completedLevels: [], currentLevel: 1 })
    })

    it('persists activeLevelTimeLeft on every tick', () => {
      useRunStore.getState().enterLevel()
      useRunStore.getState().updateActiveLevelTime(77)
      expect(load(RUN_STORAGE_KEY, null)).toMatchObject({ activeLevelTimeLeft: 77 })
    })
  })
})
