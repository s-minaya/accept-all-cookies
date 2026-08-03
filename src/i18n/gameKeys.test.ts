import { describe, expect, it } from 'vitest'
import es from './es.json'
import en from './en.json'

/**
 * Corregido tras revisión de Sofía (post-015): solo Agree/Disagree y los
 * títulos del veredicto que los reutilizan (`cookiesAccepted`, el propio
 * `disagree` como título de Game Over) se quedan fijos en inglés — es la
 * mecánica de similitud visual (GDD §11: "Disagree" contiene visualmente
 * "Agree") la que lo exige, no el resto de `game.*`. Los botones neutros
 * (Check, Stop, OK, Yes) no tienen esa mecánica y se traducen con
 * normalidad, como cualquier otro texto de interfaz.
 */
describe('game.* keys (GDD §11)', () => {
  it('agree/disagree/cookiesAccepted have the exact same value in Spanish and English — the visual-similarity trick would break otherwise', () => {
    expect(es.game.agree).toBe(en.game.agree)
    expect(es.game.disagree).toBe(en.game.disagree)
    expect(es.game.cookiesAccepted).toBe(en.game.cookiesAccepted)
  })

  it('the neutral system buttons (Check, Stop, OK, Yes, No) are translated normally', () => {
    expect(es.game.check).toBe('Comprobar')
    expect(es.game.stop).toBe('Parar')
    expect(es.game.ok).toBe('Aceptar')
    expect(es.game.yes).toBe('Sí')
    // "No" da la casualidad de que se escribe igual en los dos idiomas — no es una excepción de diseño, solo coincidencia.
    expect(es.game.no).toBe('No')
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
