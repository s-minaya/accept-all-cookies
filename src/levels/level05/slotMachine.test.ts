import { describe, expect, it } from 'vitest'
import {
  completeRespin,
  createInitialState,
  offsetToIndex,
  REEL_COUNT,
  stopReel,
} from './slotMachine'

describe('slotMachine (GDD Nivel 5 — máquina de estados pura de la tragaperras, 009-plan.md)', () => {
  it('createInitialState: los tres rodillos girando, fase playing', () => {
    const state = createInitialState()
    expect(state.phase).toBe('playing')
    expect(state.reels.length).toBe(REEL_COUNT)
    for (const reel of state.reels) {
      expect(reel.status).toBe('spinning')
    }
  })

  describe('offsetToIndex (encaje offset → índice de casilla)', () => {
    it('an exact integer offset resolves to that same index', () => {
      expect(offsetToIndex(3, 12)).toBe(3)
    })

    it('rounds to the nearest casilla below the midpoint', () => {
      expect(offsetToIndex(3.4, 12)).toBe(3)
    })

    it('rounds to the nearest casilla above the midpoint', () => {
      expect(offsetToIndex(3.6, 12)).toBe(4)
    })

    it('the exact midpoint between two casillas rounds up (Math.round, deterministic)', () => {
      expect(offsetToIndex(3.5, 12)).toBe(4)
    })

    it('wraps cyclically past the end of the reel', () => {
      expect(offsetToIndex(13, 12)).toBe(1)
      expect(offsetToIndex(24, 12)).toBe(0)
    })

    it('wraps cyclically for negative offsets', () => {
      expect(offsetToIndex(-1, 12)).toBe(11)
    })
  })

  describe('stopReel', () => {
    it('stops the given reel with its symbol; the others keep spinning; no outcome yet', () => {
      const state = createInitialState()
      const { state: next, outcome } = stopReel(state, 0, 'agree')

      expect(outcome).toBeNull()
      expect(next.reels[0]).toEqual({ status: 'stopped', symbol: 'agree' })
      expect(next.reels[1].status).toBe('spinning')
      expect(next.reels[2].status).toBe('spinning')
      expect(next.phase).toBe('playing')
    })

    it('stopping an already-stopped reel is a no-op', () => {
      const state = createInitialState()
      const { state: onceStopped } = stopReel(state, 0, 'agree')
      const { state: next, outcome } = stopReel(onceStopped, 0, 'disagree')

      expect(outcome).toBeNull()
      expect(next.reels[0]).toEqual({ status: 'stopped', symbol: 'agree' }) // no lo pisa
    })

    it('triple Agree on the third stop → outcome won', () => {
      let state = createInitialState()
      state = stopReel(state, 0, 'agree').state
      state = stopReel(state, 1, 'agree').state
      const { state: final, outcome } = stopReel(state, 2, 'agree')

      expect(outcome).toBe('won')
      expect(final.reels.every((r) => r.status === 'stopped')).toBe(true)
    })

    it('triple Disagree on the third stop → outcome lost (derrota inmediata, sin rehabilitación)', () => {
      let state = createInitialState()
      state = stopReel(state, 0, 'disagree').state
      state = stopReel(state, 1, 'disagree').state
      const { state: final, outcome } = stopReel(state, 2, 'disagree')

      expect(outcome).toBe('lost')
      expect(final.phase).toBe('playing') // no entra en respinPause
    })

    it('a mixed result on the third stop → outcome respin, phase becomes respinPause', () => {
      let state = createInitialState()
      state = stopReel(state, 0, 'agree').state
      state = stopReel(state, 1, 'disagree').state
      const { state: final, outcome } = stopReel(state, 2, 'agree')

      expect(outcome).toBe('respin')
      expect(final.phase).toBe('respinPause')
    })

    it('stopping a reel while in respinPause is a no-op (pausar durante la pausa)', () => {
      let state = createInitialState()
      state = stopReel(state, 0, 'agree').state
      state = stopReel(state, 1, 'disagree').state
      state = stopReel(state, 2, 'agree').state // respin
      expect(state.phase).toBe('respinPause')

      const { state: next, outcome } = stopReel(state, 0, 'disagree')
      expect(outcome).toBeNull()
      expect(next).toBe(state) // referencia intacta: no-op de verdad
    })

    it('an out-of-range reel index is a no-op instead of throwing', () => {
      const state = createInitialState()
      const { state: next, outcome } = stopReel(state, 9, 'agree')
      expect(outcome).toBeNull()
      expect(next).toBe(state)
    })
  })

  describe('completeRespin', () => {
    it('moves respinPause back to playing with all three reels spinning again', () => {
      let state = createInitialState()
      state = stopReel(state, 0, 'agree').state
      state = stopReel(state, 1, 'disagree').state
      state = stopReel(state, 2, 'agree').state // respin
      expect(state.phase).toBe('respinPause')

      const resumed = completeRespin(state)
      expect(resumed.phase).toBe('playing')
      for (const reel of resumed.reels) {
        expect(reel.status).toBe('spinning')
      }
    })

    it('is a no-op while phase is already playing', () => {
      const state = createInitialState()
      expect(completeRespin(state)).toBe(state)
    })
  })
})
