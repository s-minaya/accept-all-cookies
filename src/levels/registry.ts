import { testLevelDefinition } from './_test'
import { LEVEL_IDS, type LevelDefinition, type LevelId } from './types'

/**
 * Los 12 niveles reales del juego. Las features 005-016 sustituyen cada
 * hueco por su nivel real; hasta entonces cada uno apunta al componente del
 * nivel de prueba, pero con el título de su categoría real (`levels.N.name`)
 * para que el flujo completo (selección → nivel → veredicto → selección)
 * sea jugable de principio a fin desde la 004.
 */
export const levelRegistry: Record<LevelId, LevelDefinition> = Object.fromEntries(
  LEVEL_IDS.map((id) => [
    id,
    {
      titleKey: `levels.${id}.name`,
      consentKey: testLevelDefinition.consentKey,
      component: testLevelDefinition.component,
    } satisfies LevelDefinition,
  ]),
) as Record<LevelId, LevelDefinition>
