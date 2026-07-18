import type { LevelDefinition, LevelId } from './types'

/**
 * The real game's 12 levels, populated one by one in features 005-016.
 * Deliberately empty for now: `AppShell` falls back to the test level
 * (see `src/levels/_test/`) for its placeholder level screen until
 * feature 005 registers level 1 here.
 */
export const levelRegistry: Partial<Record<LevelId, LevelDefinition>> = {}
