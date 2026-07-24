import { describe, expect, it } from 'vitest'
import { accumulateRotation, angleFromCenterDeg, normalizeAngleDelta } from './rotationLogic'

describe('angleFromCenterDeg', () => {
  it('is 0° for a point directly to the right of the center', () => {
    expect(angleFromCenterDeg({ x: 10, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(0)
  })

  it('is 90° for a point directly below the center (Y grows downward)', () => {
    expect(angleFromCenterDeg({ x: 0, y: 10 }, { x: 0, y: 0 })).toBeCloseTo(90)
  })

  it('is -90° for a point directly above the center', () => {
    expect(angleFromCenterDeg({ x: 0, y: -10 }, { x: 0, y: 0 })).toBeCloseTo(-90)
  })

  it('is 180° for a point directly to the left of the center', () => {
    expect(angleFromCenterDeg({ x: -10, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(180)
  })

  it('is relative to an arbitrary (non-origin) center', () => {
    expect(angleFromCenterDeg({ x: 110, y: 50 }, { x: 100, y: 50 })).toBeCloseTo(0)
  })
})

describe('normalizeAngleDelta', () => {
  it('leaves small deltas unchanged', () => {
    expect(normalizeAngleDelta(10)).toBeCloseTo(10)
    expect(normalizeAngleDelta(-10)).toBeCloseTo(-10)
  })

  it('wraps a delta just above 180° down to a small negative delta', () => {
    expect(normalizeAngleDelta(190)).toBeCloseTo(-170)
  })

  it('wraps a delta just below -180° up to a small positive delta', () => {
    expect(normalizeAngleDelta(-190)).toBeCloseTo(170)
  })

  it('keeps exactly 180° as-is (upper bound included)', () => {
    expect(normalizeAngleDelta(180)).toBeCloseTo(180)
  })

  it('maps exactly -180° to 180° (lower bound excluded, equivalent angle)', () => {
    expect(normalizeAngleDelta(-180)).toBeCloseTo(180)
  })

  it('handles deltas larger than a full turn', () => {
    expect(normalizeAngleDelta(370)).toBeCloseTo(10)
    expect(normalizeAngleDelta(-370)).toBeCloseTo(-10)
  })
})

describe('accumulateRotation', () => {
  it('adds the normalized delta to the previous rotation', () => {
    expect(accumulateRotation(0, 0, 10)).toBeCloseTo(10)
    expect(accumulateRotation(45, 10, 20)).toBeCloseTo(55)
  })

  it('does not jump ~360° when the pointer angle crosses the ±180° boundary', () => {
    // El puntero pasa de 179° a -179° (2° de giro real en sentido horario).
    expect(accumulateRotation(100, 179, -179)).toBeCloseTo(102)
  })

  it('accumulates past a full turn without wrapping the rotation itself', () => {
    expect(accumulateRotation(350, 0, 20)).toBeCloseTo(370)
  })

  it('rotates freely in both directions, 1:1 with the pointer', () => {
    let rotation = 0
    let angle = 0
    for (const nextAngle of [30, 60, 90, 45, 0, -45]) {
      rotation = accumulateRotation(rotation, angle, nextAngle)
      angle = nextAngle
    }
    expect(rotation).toBeCloseTo(-45)
  })
})
