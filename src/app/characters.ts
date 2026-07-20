import character1 from '../assets/images/characters/character-1.png'
import character2 from '../assets/images/characters/character-2.png'
import character3 from '../assets/images/characters/character-3.png'
import character4 from '../assets/images/characters/character-4.png'
import type { CharacterId } from '../state/rankingStore'

export interface Character {
  id: CharacterId
  sprite: string
  /** Game data, not i18n: default names are proper nouns and never translated (GDD §1.1). */
  defaultName: string
}

export const characters: readonly Character[] = [
  { id: 0, sprite: character1, defaultName: 'Crumbs' },
  { id: 1, sprite: character2, defaultName: 'Incognito' },
  { id: 2, sprite: character3, defaultName: 'Granny Agree' },
  { id: 3, sprite: character4, defaultName: 'Monster Byte' },
]

export function getCharacter(id: CharacterId): Character {
  return characters[id]
}

/** `username: null` means the player never confirmed one — fall back to the character's default. */
export function resolvePlayerName(character: CharacterId, username: string | null): string {
  return username ?? getCharacter(character).defaultName
}
