import { describe, expect, it } from 'vitest'
import {
  catchAgree,
  catchDisagree,
  getSegmentsOutcome,
  getSegmentVariant,
  INITIAL_SEGMENTS,
  SEGMENT_COUNT,
  type SegmentsState,
} from './segments'

describe('segments (GDD Nivel 4 — botón de 6 segmentos, 008-plan.md)', () => {
  it('starts empty, with no outcome', () => {
    expect(INITIAL_SEGMENTS).toEqual({ agree: 0, disagree: 0 })
    expect(getSegmentsOutcome(INITIAL_SEGMENTS)).toBeNull()
  })

  it('fills only from its own side while there are gaps (rellenar por su lado)', () => {
    let state = INITIAL_SEGMENTS
    state = catchAgree(state)
    expect(state).toEqual({ agree: 1, disagree: 0 })
    state = catchDisagree(state)
    expect(state).toEqual({ agree: 1, disagree: 1 })
    state = catchDisagree(state)
    expect(state).toEqual({ agree: 1, disagree: 2 })
    state = catchAgree(state)
    expect(state).toEqual({ agree: 2, disagree: 2 })
  })

  it('reproduces the GDD corrected example exactly: 🟩🟩□□🟥🟥 + Agree → 🟩🟩🟩□🟥🟥 + Agree → 🟩🟩🟩🟩🟥🟥 (lleno) + Agree → 🟩🟩🟩🟩🟩🟥 + Agree → 🟩🟩🟩🟩🟩🟩', () => {
    let state: SegmentsState = { agree: 2, disagree: 2 }

    state = catchAgree(state) // hueco disponible (total 4 < 6)
    expect(state).toEqual({ agree: 3, disagree: 2 })
    expect(getSegmentsOutcome(state)).toBeNull()

    state = catchAgree(state) // último hueco (total 5 < 6)
    expect(state).toEqual({ agree: 4, disagree: 2 })
    expect(state.agree + state.disagree).toBe(SEGMENT_COUNT) // tablero lleno
    expect(getSegmentsOutcome(state)).toBeNull()

    state = catchAgree(state) // lleno: sustituye un Disagree fronterizo
    expect(state).toEqual({ agree: 5, disagree: 1 })

    state = catchAgree(state)
    expect(state).toEqual({ agree: 6, disagree: 0 })
    expect(getSegmentsOutcome(state)).toBe('win')
  })

  it('the symmetric Disagree example fills the board the other way and ends in defeat', () => {
    let state: SegmentsState = { agree: 2, disagree: 2 }

    state = catchDisagree(state)
    expect(state).toEqual({ agree: 2, disagree: 3 })
    state = catchDisagree(state)
    expect(state).toEqual({ agree: 2, disagree: 4 })
    state = catchDisagree(state) // lleno: sustituye un Agree fronterizo
    expect(state).toEqual({ agree: 1, disagree: 5 })
    state = catchDisagree(state)
    expect(state).toEqual({ agree: 0, disagree: 6 })
    expect(getSegmentsOutcome(state)).toBe('lose')
  })

  it('comeback from (1, 5): five Agree captures in a row flip the board to victory', () => {
    let state: SegmentsState = { agree: 1, disagree: 5 }
    const expected = [
      { agree: 2, disagree: 4 },
      { agree: 3, disagree: 3 },
      { agree: 4, disagree: 2 },
      { agree: 5, disagree: 1 },
      { agree: 6, disagree: 0 },
    ]

    for (const step of expected) {
      state = catchAgree(state)
      expect(state).toEqual(step)
    }
    expect(getSegmentsOutcome(state)).toBe('win')
  })

  it('comeback from (5, 1): five Disagree captures in a row flip the board to defeat', () => {
    let state: SegmentsState = { agree: 5, disagree: 1 }
    const expected = [
      { agree: 4, disagree: 2 },
      { agree: 3, disagree: 3 },
      { agree: 2, disagree: 4 },
      { agree: 1, disagree: 5 },
      { agree: 0, disagree: 6 },
    ]

    for (const step of expected) {
      state = catchDisagree(state)
      expect(state).toEqual(step)
    }
    expect(getSegmentsOutcome(state)).toBe('lose')
  })

  it('alternating substitutions on a full board always keep the total at SEGMENT_COUNT', () => {
    let state: SegmentsState = { agree: 3, disagree: 3 }

    for (let i = 0; i < 20; i++) {
      state = i % 2 === 0 ? catchAgree(state) : catchDisagree(state)
      expect(state.agree + state.disagree).toBe(SEGMENT_COUNT)
      expect(state.agree).toBeGreaterThanOrEqual(0)
      expect(state.disagree).toBeGreaterThanOrEqual(0)
    }
  })

  it('never exceeds SEGMENT_COUNT nor goes negative across a long mixed sequence with gaps and a full board', () => {
    // Secuencia guionizada (no aleatoria, para que el test sea determinista):
    // rellena con huecos, alterna en el tramo lleno, y una racha final de un
    // solo lado que debe llevar a la victoria.
    const script: Array<'agree' | 'disagree'> = [
      'agree',
      'agree',
      'disagree',
      'agree',
      'disagree',
      'disagree', // aquí ya está lleno (3 agree, 3 disagree)
      'disagree',
      'agree',
      'disagree',
      'agree',
      'agree',
      'agree',
      'agree',
      'agree', // racha final: debería ganar antes de agotar la racha
    ]

    let state = INITIAL_SEGMENTS
    let outcome = getSegmentsOutcome(state)
    for (const capture of script) {
      if (outcome) break // el juego real se detiene en cuanto hay desenlace
      state = capture === 'agree' ? catchAgree(state) : catchDisagree(state)
      expect(state.agree).toBeGreaterThanOrEqual(0)
      expect(state.disagree).toBeGreaterThanOrEqual(0)
      expect(state.agree + state.disagree).toBeLessThanOrEqual(SEGMENT_COUNT)
      outcome = getSegmentsOutcome(state)
    }

    expect(outcome).toBe('win')
  })

  it('getSegmentVariant packs Agree on the left, Disagree on the right, gaps in between', () => {
    const state: SegmentsState = { agree: 2, disagree: 3 }
    // 6 segmentos: [agree, agree, empty, disagree, disagree, disagree]
    expect(getSegmentVariant(state, 0)).toBe('agree')
    expect(getSegmentVariant(state, 1)).toBe('agree')
    expect(getSegmentVariant(state, 2)).toBe('empty')
    expect(getSegmentVariant(state, 3)).toBe('disagree')
    expect(getSegmentVariant(state, 4)).toBe('disagree')
    expect(getSegmentVariant(state, 5)).toBe('disagree')
  })

  it('getSegmentVariant on an empty board: every segment is empty', () => {
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      expect(getSegmentVariant(INITIAL_SEGMENTS, i)).toBe('empty')
    }
  })

  it('getSegmentVariant on a full board: no gaps, every segment is agree or disagree', () => {
    const state: SegmentsState = { agree: 6, disagree: 0 }
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      expect(getSegmentVariant(state, i)).toBe('agree')
    }
  })

  it('does not change state once a terminal outcome is reached (defensive: no negative disagree/agree)', () => {
    const won: SegmentsState = { agree: 6, disagree: 0 }
    expect(catchAgree(won)).toEqual(won)

    const lost: SegmentsState = { agree: 0, disagree: 6 }
    expect(catchDisagree(lost)).toEqual(lost)
  })
})
