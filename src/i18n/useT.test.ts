import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useT } from './useT'
import { useSettingsStore } from '../state/settingsStore'

describe('useT', () => {
  beforeEach(() => {
    useSettingsStore.setState({ language: 'es' })
  })

  it('resolves a namespaced key in the active language', () => {
    const { result } = renderHook(() => useT())
    expect(result.current('shell.landing.start')).toBe('Empezar')
  })

  it('re-resolves when the language changes', () => {
    const { result, rerender } = renderHook(() => useT())
    expect(result.current('game.agree')).toBe('Agree')

    act(() => {
      useSettingsStore.setState({ language: 'en' })
    })
    rerender()

    expect(result.current('shell.landing.start')).toBe('Start')
  })

  describe('missing key', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('falls back to the key itself instead of throwing', () => {
      const { result } = renderHook(() => useT())
      expect(result.current('shell.nope.missing')).toBe('shell.nope.missing')
    })

    it('warns on the console', () => {
      const { result } = renderHook(() => useT())
      result.current('shell.nope.missing')
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('shell.nope.missing'))
    })
  })
})
