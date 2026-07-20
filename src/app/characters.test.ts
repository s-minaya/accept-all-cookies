import { describe, expect, it } from 'vitest'
import { characters, getCharacter, resolvePlayerName } from './characters'

describe('characters data', () => {
  it('has exactly the 4 characters from the GDD, in order', () => {
    expect(characters.map((character) => character.defaultName)).toEqual([
      'Crumbs',
      'Incognito',
      'Granny Agree',
      'Monster Byte',
    ])
  })

  it('getCharacter looks up by id', () => {
    expect(getCharacter(2).defaultName).toBe('Granny Agree')
  })
})

describe('resolvePlayerName', () => {
  it('falls back to the default name when username is null', () => {
    expect(resolvePlayerName(0, null)).toBe('Crumbs')
  })

  it('uses the confirmed username when set', () => {
    expect(resolvePlayerName(0, 'Sofia')).toBe('Sofia')
  })
})
