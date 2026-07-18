import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { load, save } from './storage'

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns the fallback when the key is missing', () => {
    expect(load('aac.v1.missing', { a: 1 })).toEqual({ a: 1 })
  })

  it('round-trips a saved value', () => {
    save('aac.v1.settings', { language: 'es', volume: 0.5 })
    expect(load('aac.v1.settings', null)).toEqual({ language: 'es', volume: 0.5 })
  })

  it('falls back when the stored JSON is corrupt', () => {
    window.localStorage.setItem('aac.v1.ranking', '{not valid json')
    expect(load('aac.v1.ranking', [])).toEqual([])
  })

  it('keeps separate keys independent', () => {
    save('aac.v1.a', 'one')
    save('aac.v1.b', 'two')
    expect(load('aac.v1.a', '')).toBe('one')
    expect(load('aac.v1.b', '')).toBe('two')
  })

  describe('when localStorage throws (disabled / private mode)', () => {
    beforeEach(() => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('disabled')
      })
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('disabled')
      })
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('degrades to an in-memory fallback without throwing', () => {
      expect(() => save('aac.v1.settings', { language: 'en' })).not.toThrow()
      expect(() => load('aac.v1.settings', { language: 'es' })).not.toThrow()
    })

    it('still returns the value it just saved, from memory', () => {
      save('aac.v1.settings', { language: 'en' })
      expect(load('aac.v1.settings', { language: 'es' })).toEqual({ language: 'en' })
    })

    it('returns the fallback for keys never saved', () => {
      expect(load('aac.v1.ranking', [])).toEqual([])
    })
  })
})
