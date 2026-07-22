import type { LevelDefinition, LevelId } from './types'

/**
 * Los 12 niveles reales del juego, que se van añadiendo en las features
 * 005-016. Deliberadamente vacío por ahora: `AppShell` recurre al nivel de
 * prueba (ver `src/levels/_test/`) como pantalla de nivel provisional hasta
 * que la feature 005 registre aquí el nivel 1.
 */
export const levelRegistry: Partial<Record<LevelId, LevelDefinition>> = {}
