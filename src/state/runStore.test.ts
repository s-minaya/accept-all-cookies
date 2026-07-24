import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RUN_STORAGE_KEY, useRunStore } from './runStore'
import { useRankingStore } from './rankingStore'
import { load } from './storage'

describe('runStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useRunStore.setState({
      completedLevels: [],
      currentLevel: 1,
      activeLevelTimeLeft: null,
      pendingOutcome: null,
    })
    useRankingStore.setState({ entries: [] })
  })

  it('starts at level 1 with nothing completed and no active level', () => {
    expect(useRunStore.getState()).toMatchObject({
      completedLevels: [],
      currentLevel: 1,
      activeLevelTimeLeft: null,
      pendingOutcome: null,
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

  describe('pendingOutcome (recargar durante el veredicto/modal muestra la modal, no el nivel jugable)', () => {
    it('setPendingOutcome persists the outcome', () => {
      useRunStore.getState().setPendingOutcome('win')
      expect(useRunStore.getState().pendingOutcome).toBe('win')
      expect(load(RUN_STORAGE_KEY, null)).toMatchObject({ pendingOutcome: 'win' })
    })

    it('completeLevel (confirming the win modal) clears the pending outcome', () => {
      useRunStore.getState().setPendingOutcome('win')
      useRunStore.getState().completeLevel(1)
      expect(useRunStore.getState().pendingOutcome).toBeNull()
    })

    it('resetRun (confirming the lose modal) clears the pending outcome', () => {
      useRunStore.getState().setPendingOutcome('lose')
      useRunStore.getState().resetRun()
      expect(useRunStore.getState().pendingOutcome).toBeNull()
    })

    it('a run persisted before pendingOutcome existed falls back to null instead of undefined', async () => {
      window.localStorage.setItem(
        RUN_STORAGE_KEY,
        JSON.stringify({ completedLevels: [1], currentLevel: 2, activeLevelTimeLeft: null }),
      )
      vi.resetModules()
      const { useRunStore: freshRunStore } = await import('./runStore')
      expect(freshRunStore.getState().pendingOutcome).toBeNull()
    })
  })
})
