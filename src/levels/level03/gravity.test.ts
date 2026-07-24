import { describe, expect, it } from 'vitest'
import { gravityVectorForRotation } from './gravity'

describe('gravityVectorForRotation (007-plan.md, gravedad siempre "hacia abajo de la pantalla")', () => {
  it('at 0°, points straight down (no rotation applied yet)', () => {
    const g = gravityVectorForRotation(0)
    expect(g.x).toBeCloseTo(0)
    expect(g.y).toBeCloseTo(1)
  })

  it('at 90°, points along local +x (which a 90° clockwise window rotation lands on screen-down)', () => {
    const g = gravityVectorForRotation(90)
    expect(g.x).toBeCloseTo(1)
    expect(g.y).toBeCloseTo(0)
  })

  it('at 180°, points straight up locally (upside down window makes screen-down = local-up)', () => {
    const g = gravityVectorForRotation(180)
    expect(g.x).toBeCloseTo(0)
    expect(g.y).toBeCloseTo(-1)
  })

  it('at -90° (or 270°), points along local -x', () => {
    const g = gravityVectorForRotation(-90)
    expect(g.x).toBeCloseTo(-1)
    expect(g.y).toBeCloseTo(0)
  })

  it('is always a unit vector, for any rotation', () => {
    for (const deg of [0, 37, 90, 145, 200, -73, 360, 725]) {
      const g = gravityVectorForRotation(deg)
      expect(Math.hypot(g.x, g.y)).toBeCloseTo(1)
    }
  })

  it('is periodic every 360°', () => {
    const a = gravityVectorForRotation(50)
    const b = gravityVectorForRotation(50 + 360)
    expect(b.x).toBeCloseTo(a.x)
    expect(b.y).toBeCloseTo(a.y)
  })
})
