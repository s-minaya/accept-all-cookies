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
    // SIN `fillHeight` a propósito (corregido tras revisión de Sofía: "el
    // game area del nivel de cookies de personalización es demasiado
    // grande, antes lo teniamos a su tamaño correcto"): su tamaño "correcto"
    // ya salía de aquí, del propio `min-height` del recuadro de lluvia
    // (`Level03.module.scss`), no de `fillHeight` — que hasta ahora estaba
    // roto (`.level-host` no daba una altura real que estirar, ver
    // `LevelHost.module.scss`) y por eso nunca se notó. Al arreglar ESE bug
    // para el nivel 4, el nivel 3 heredó de golpe una ventana mucho más
    // alta que antes; quitarle `fillHeight` restaura su tamaño de siempre
    // sin tocar el arreglo del nivel 4.
    component: lazy(() => import('./level03/Level03')),
  },
  4: {
    titleKey: 'levels.4.name',
    // Sin consentKey (corregido tras revisión de Sofía: "los terminos y
    // condiciones de las cookies no estan en su recuadro azul, como en
    // todos los niveles") — el texto va dentro del marco azul, mismo patrón
    // que los niveles 1-3, ya no en el recuadro de consentimiento pequeño; el
    // marco se renderiza ajustado solo al texto. El tablero (el Plinko) se
    // publica aparte vía `useLevelBoard` y sigue sin marco propio (GDD
    // §4.4, excepción: tiene sus propias paredes físicas) — mismo patrón
    // exacto que el recuadro de lluvia del nivel 3. SIN `fillHeight` (a
    // diferencia de antes): ya no hace falta — `GameArea` mide su propio
    // tamaño con `aspect-ratio` en vez de depender de que un ancestro le dé
    // el 100% del alto disponible (`GameArea.module.scss`), así que la
    // ventana vuelve a ajustarse a su contenido en vez de estirarse a
    // ocupar toda la pantalla (corregido tras revisión de Sofía: "reduce el
    // aire de arriba y abajo").
    component: lazy(() => import('./level04/Level04')),
  },
  5: {
    titleKey: 'levels.5.name',
    // Sin consentKey, mismo patrón que los niveles 3 y 4: texto dentro del
    // marco azul, tablero (los 3 rodillos + Stops) publicado aparte vía
    // `useLevelBoard`. Sin `fillHeight`: cada rodillo mide una altura fija
    // propia (`Reel.module.scss`), no necesita que un ancestro le dé el
    // 100% del alto disponible. `wideWindow: true` (revisión de Sofía: "los
    // rodillos un poco más grandes en large desktop, junto con la ventana
    // en sí"): los rodillos ya crecen solos por CSS a partir de `lg`, la
    // ventana necesita pedir explícitamente más ancho para que quepan sin
    // apretarse contra el tope de siempre (40rem).
    wideWindow: true,
    component: lazy(() => import('./level05/Level05')),
  },
  6: {
    titleKey: 'levels.6.name',
    // Sin consentKey, mismo patrón que los niveles 3-5: texto dentro del
    // marco azul, tablero (grid + panel de dirección) publicado aparte vía
    // `useLevelBoard`. Sin `fillHeight`: el tablero mide una altura fija
    // propia (`Board.module.scss`). A diferencia de 3-5, este nivel SÍ tiene
    // pie (Agree/Disagree) — no necesita ningún flag especial para eso, se
    // publica igual que en los niveles 1-2 (`useLevelFooter`). `compactConsentBox: true`
    // (revisión de Sofía: "en la version movil la ventana del juego es
    // demasiado larga y produce scroll vertical"): el tablero de este nivel
    // ya tiene una altura fija propia bastante alta (`Board.module.scss`),
    // así que en móvil el recuadro de texto pide menos alto que el estándar
    // de 12rem para que la ventana entera quepa sin scroll — sin afectar a
    // tablet/escritorio ni a los niveles 3-5.
    compactConsentBox: true,
    component: lazy(() => import('./level06/Level06')),
  },
}
