import { lazy } from 'react'
import type { LevelDefinition } from '../types'

/**
 * Definición genérica del nivel de prueba, usada tal cual en la Playground y
 * como relleno de los 12 huecos de `levels/registry.ts` hasta que cada
 * feature de nivel (005-016) sustituya el suyo.
 */
export const testLevelDefinition: LevelDefinition = {
  titleKey: 'shell.level.testTitle',
  consentKey: 'shell.level.testConsent',
  component: lazy(() => import('./TestLevel')),
}
