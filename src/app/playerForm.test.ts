import { describe, expect, it } from 'vitest'
import { resolveConfirmedName } from './playerForm'

describe('resolveConfirmedName', () => {
  it('keeps a normal name as-is', () => {
    expect(resolveConfirmedName('Sofia', 'Crumbs')).toBe('Sofia')
  })

  it('trims surrounding whitespace', () => {
    expect(resolveConfirmedName('  Sofia  ', 'Crumbs')).toBe('Sofia')
  })

  it('clamps to 16 characters', () => {
    expect(resolveConfirmedName('A'.repeat(30), 'Crumbs')).toBe('A'.repeat(16))
  })

  it('falls back to the default name when the trimmed input is empty', () => {
    expect(resolveConfirmedName('   ', 'Crumbs')).toBe('Crumbs')
  })

  it('falls back to the default name for a genuinely empty input', () => {
    expect(resolveConfirmedName('', 'Crumbs')).toBe('Crumbs')
  })

  it('trims surrounding whitespace without touching internal spaces', () => {
    expect(resolveConfirmedName('  Sofia M  ', 'Crumbs')).toBe('Sofia M')
  })
})
