import { describe, expect, it } from 'vitest'
import { clampPaddleX, KEYBOARD_PADDLE_SPEED, stepKeyboardX } from './control'

describe('control (GDD Nivel 4 — clamping del botón grande, 008-plan.md)', () => {
  describe('clampPaddleX', () => {
    it('leaves a value already inside the guide untouched', () => {
      expect(clampPaddleX(320, 40, 640)).toBe(320)
    })

    it('clamps to the left edge (half width from the guide start)', () => {
      expect(clampPaddleX(-100, 40, 640)).toBe(40)
      expect(clampPaddleX(0, 40, 640)).toBe(40)
    })

    it('clamps to the right edge (half width from the guide end)', () => {
      expect(clampPaddleX(9999, 40, 640)).toBe(600)
      expect(clampPaddleX(640, 40, 640)).toBe(600)
    })

    it('centers the paddle instead of breaking when the guide is narrower than the paddle', () => {
      expect(clampPaddleX(0, 400, 640)).toBe(320)
      expect(clampPaddleX(9999, 400, 640)).toBe(320)
    })
  })

  describe('stepKeyboardX', () => {
    it('does not move when direction is 0', () => {
      expect(stepKeyboardX(300, 0, 1)).toBe(300)
    })

    it('moves right at the given speed for direction 1', () => {
      expect(stepKeyboardX(300, 1, 1, 200)).toBe(500)
    })

    it('moves left at the given speed for direction -1', () => {
      expect(stepKeyboardX(300, -1, 1, 200)).toBe(100)
    })

    it('scales with dtSeconds', () => {
      expect(stepKeyboardX(0, 1, 0.5, 200)).toBe(100)
    })

    it('defaults to KEYBOARD_PADDLE_SPEED when no speed is given', () => {
      expect(stepKeyboardX(0, 1, 1)).toBe(KEYBOARD_PADDLE_SPEED)
    })
  })
})
