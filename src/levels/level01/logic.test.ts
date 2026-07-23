import { describe, expect, it } from 'vitest'
import { AGREE_APPEAR_DELAY_SECONDS, isAgreeVisible, level01Reducer } from './logic'

describe('isAgreeVisible', () => {
  it('is hidden before 7 elapsed seconds', () => {
    expect(isAgreeVisible(100)).toBe(false) // 0s transcurridos
    expect(isAgreeVisible(94)).toBe(false) // 6s transcurridos
  })

  it('becomes visible at exactly 7 elapsed seconds and stays visible afterwards', () => {
    expect(isAgreeVisible(93)).toBe(true) // 7s transcurridos
    expect(isAgreeVisible(50)).toBe(true)
    expect(isAgreeVisible(0)).toBe(true)
  })

  it('is derived purely from timeLeft, matching the documented delay constant', () => {
    expect(isAgreeVisible(100 - AGREE_APPEAR_DELAY_SECONDS)).toBe(true)
    expect(isAgreeVisible(100 - AGREE_APPEAR_DELAY_SECONDS + 1)).toBe(false)
  })

  it('stays frozen while paused, because it never advances on its own: the same timeLeft always yields the same result', () => {
    // No hay temporizador propio que consultar: congelar el nivel (paused)
    // ya congela `timeLeft` en el shell, así que esta función pura no
    // necesita saber nada sobre `paused` para quedar congelada con él.
    const frozenTimeLeft = 96 // 4s transcurridos, Agree aún no visible
    expect(isAgreeVisible(frozenTimeLeft)).toBe(false)
    expect(isAgreeVisible(frozenTimeLeft)).toBe(false)
    expect(isAgreeVisible(frozenTimeLeft)).toBe(false)
  })
})

describe('level01Reducer', () => {
  it('opens the error dialog on DISAGREE while playing', () => {
    expect(level01Reducer('playing', { type: 'DISAGREE' })).toBe('errorDialog')
  })

  it('ignores a repeated DISAGREE while the dialog is already open', () => {
    expect(level01Reducer('errorDialog', { type: 'DISAGREE' })).toBe('errorDialog')
  })
})
