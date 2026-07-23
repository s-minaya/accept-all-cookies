import { describe, expect, it } from 'vitest'
import es from './es.json'
import en from './en.json'

describe('game.* keys (GDD §11)', () => {
  it('have the exact same value in Spanish and English — they are never translated', () => {
    expect(es.game).toEqual(en.game)
  })

  it('cover every game term the design system reuses', () => {
    expect(Object.keys(es.game).sort()).toEqual([
      'agree',
      'check',
      'cookiesAccepted',
      'disagree',
      'no',
      'ok',
      'stop',
      'yes',
    ])
  })
})
