import { describe, expect, it } from 'vitest'
import { clampCoverOffset } from './coverLogic'

const MAX = { maxOffsetX: 100, maxOffsetY: 50 }

describe('clampCoverOffset (011-plan.md, clamping puro dentro del propio hueco)', () => {
  it('deja pasar un desplazamiento ya dentro de los límites sin tocarlo', () => {
    expect(clampCoverOffset({ x: 40, y: -20, ...MAX })).toEqual({ x: 40, y: -20 })
  })

  it('clampa el eje X positivo a +maxOffsetX', () => {
    expect(clampCoverOffset({ x: 9999, y: 0, ...MAX })).toEqual({ x: 100, y: 0 })
  })

  it('clampa el eje X negativo a -maxOffsetX', () => {
    expect(clampCoverOffset({ x: -9999, y: 0, ...MAX })).toEqual({ x: -100, y: 0 })
  })

  it('clampa el eje Y positivo a +maxOffsetY', () => {
    expect(clampCoverOffset({ x: 0, y: 9999, ...MAX })).toEqual({ x: 0, y: 50 })
  })

  it('clampa el eje Y negativo a -maxOffsetY', () => {
    expect(clampCoverOffset({ x: 0, y: -9999, ...MAX })).toEqual({ x: 0, y: -50 })
  })

  it('clampa cada eje de forma independiente (esquina)', () => {
    expect(clampCoverOffset({ x: 9999, y: -9999, ...MAX })).toEqual({ x: 100, y: -50 })
  })

  it('un máximo de 0 en un eje inmoviliza ese eje sin afectar al otro', () => {
    expect(clampCoverOffset({ x: 40, y: 40, maxOffsetX: 0, maxOffsetY: 50 })).toEqual({
      x: 0,
      y: 40,
    })
  })

  it('es pura: la misma entrada siempre produce la misma salida', () => {
    const input = { x: 33, y: -12, ...MAX }
    expect(clampCoverOffset(input)).toEqual(clampCoverOffset(input))
  })
})
