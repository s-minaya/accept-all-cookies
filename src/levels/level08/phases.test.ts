import { describe, expect, it } from 'vitest'
import { createRng } from '../../utils/prng'
import { buildSegments, canAcceptClick, phaseForSegment } from './phases'
import { createShuffleScript } from './shuffle'

describe('canAcceptClick (012-plan.md — qué fase acepta input)', () => {
  it('accepts clicks only in reveal and choosing', () => {
    expect(canAcceptClick('reveal')).toBe(true)
    expect(canAcceptClick('choosing')).toBe(true)
    expect(canAcceptClick('flip')).toBe(false)
    expect(canAcceptClick('shuffling')).toBe(false)
    expect(canAcceptClick('revealChoice')).toBe(false)
    expect(canAcceptClick('done')).toBe(false)
  })
})

describe('buildSegments', () => {
  const script = createShuffleScript(createRng(3))

  it('starts with the flip segment, at the given duration', () => {
    const segments = buildSegments(script, 400)
    expect(segments[0]).toEqual({ kind: 'flip', durationMs: 400 })
  })

  it('follows the flip with the 3 rounds, in order, with their own durations', () => {
    const segments = buildSegments(script, 400)
    expect(segments).toHaveLength(4)
    expect(segments[1]).toEqual({
      kind: 'shuffling',
      roundIndex: 0,
      durationMs: script.rounds[0].durationMs,
    })
    expect(segments[2]).toEqual({
      kind: 'shuffling',
      roundIndex: 1,
      durationMs: script.rounds[1].durationMs,
    })
    expect(segments[3]).toEqual({
      kind: 'shuffling',
      roundIndex: 2,
      durationMs: script.rounds[2].durationMs,
    })
  })
})

describe('phaseForSegment', () => {
  it('maps each segment kind to its matching level phase', () => {
    expect(phaseForSegment({ kind: 'flip', durationMs: 1 })).toBe('flip')
    expect(phaseForSegment({ kind: 'shuffling', roundIndex: 0, durationMs: 1 })).toBe('shuffling')
  })
})
