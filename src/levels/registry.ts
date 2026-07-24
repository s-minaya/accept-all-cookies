import { lazy } from 'react'
import { testLevelDefinition } from './_test'
import { LEVEL_IDS, type LevelDefinition, type LevelId } from './types'

/**
 * Los 12 niveles reales del juego. Las features 006-016 sustituyen cada
 * hueco restante por su nivel real; hasta entonces cada uno apunta al
 * componente del nivel de prueba, pero con el título de su categoría real
 * (`levels.N.name`) para que el flujo completo (selección → nivel →
 * veredicto → selección) sea jugable de principio a fin desde la 004.
 */
const placeholderDefaults: Record<LevelId, LevelDefinition> = Object.fromEntries(
  LEVEL_IDS.map((id) => [
    id,
    {
      titleKey: `levels.${id}.name`,
      consentKey: testLevelDefinition.consentKey,
      component: testLevelDefinition.component,
    } satisfies LevelDefinition,
  ]),
) as Record<LevelId, LevelDefinition>

export const levelRegistry: Record<LevelId, LevelDefinition> = {
  ...placeholderDefaults,
  1: {
    titleKey: 'levels.1.name',
    // Sin consentKey a propósito: el nivel 1 no tiene tablero, así que
    // muestra su propio texto (más largo) dentro del marco azul en vez del
    // recuadro de consentimiento pequeño (005-plan.md, ajuste visual).
    component: lazy(() => import('./level01/Level01')),
  },
  2: {
    titleKey: 'levels.2.name',
    // Sin consentKey, mismo patrón que el nivel 1: tampoco tiene tablero
    // propio (006-plan.md).
    component: lazy(() => import('./level02/Level02')),
  },
  3: {
    titleKey: 'levels.3.name',
    // Sin consentKey (corregido tras revisión de Sofía sobre la 007: el
    // texto va dentro del marco azul del área de juego, igual que los
    // niveles 1-2, ajustado a su contenido — no en el recuadro de
    // consentimiento pequeño). El recuadro de lluvia se publica aparte
    // (`useLevelBoard`) y se renderiza debajo de ese marco, fuera de él.
    // fillHeight: true para que la ventana ocupe la altura de su
    // contenedor en vez de la de su contenido — sin espacio real ahí abajo
    // no habría "sobrante" que darle al recuadro de lluvia.
    fillHeight: true,
    component: lazy(() => import('./level03/Level03')),
  },
}
