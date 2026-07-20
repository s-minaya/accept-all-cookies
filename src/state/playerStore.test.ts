import { beforeEach, describe, expect, it } from 'vitest'
import { PLAYER_STORAGE_KEY, usePlayerStore } from './playerStore'
import { load } from './storage'

describe('playerStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    usePlayerStore.setState({ character: 0, username: null })
  })

  it('starts as character 0 with no confirmed username (first visit)', () => {
    expect(usePlayerStore.getState()).toMatchObject({ character: 0, username: null })
  })

  it('setPlayer updates the current player', () => {
    usePlayerStore.getState().setPlayer(2, 'Sofia')
    expect(usePlayerStore.getState()).toMatchObject({ character: 2, username: 'Sofia' })
  })

  it('persists the player so it survives a reload', () => {
    usePlayerStore.getState().setPlayer(1, 'Nay')
    expect(load(PLAYER_STORAGE_KEY, null)).toEqual({ character: 1, username: 'Nay' })
  })
})
