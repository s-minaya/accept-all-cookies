import { describe, expect, it } from 'vitest'
import { cameraOffsetX } from './cameraLogic'

describe('cameraOffsetX (010-plan.md — centrado con clamping a los bordes)', () => {
  const base = { cellSizePx: 32, viewportWidthPx: 320, totalCols: 42 } // 42×32=1344px de contenido, 320px visibles

  it('centers the key exactly when it is comfortably within the middle of the board', () => {
    // Columna 20 (centro-ish): centro real = (20+0.5)*32 = 656px; ideal = 656-160 = 496px.
    expect(cameraOffsetX({ ...base, keyCol: 20 })).toBeCloseTo(496)
  })

  it('clamps to 0 near the left edge instead of showing empty space past the board', () => {
    expect(cameraOffsetX({ ...base, keyCol: 0 })).toBe(0)
    expect(cameraOffsetX({ ...base, keyCol: 2 })).toBe(0)
  })

  it('clamps to the max offset near the right edge instead of showing empty space past the board', () => {
    const maxOffset = 42 * 32 - 320 // 1024
    expect(cameraOffsetX({ ...base, keyCol: 41 })).toBe(maxOffset)
    expect(cameraOffsetX({ ...base, keyCol: 39 })).toBe(maxOffset)
  })

  it('never scrolls (offset always 0) when the board is narrower than the viewport', () => {
    expect(
      cameraOffsetX({ cellSizePx: 32, viewportWidthPx: 2000, totalCols: 42, keyCol: 20 }),
    ).toBe(0)
  })

  it('is a pure function: same input always gives the same output', () => {
    const input = { ...base, keyCol: 15 }
    expect(cameraOffsetX(input)).toBe(cameraOffsetX(input))
  })
})
