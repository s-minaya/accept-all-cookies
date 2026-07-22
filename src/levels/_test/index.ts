import { lazy } from 'react'
import type { LevelDefinition } from '../types'

/** Deliberadamente fuera del registro real del juego (`levels/registry.ts`) — ver AGENTS.md. */
export const testLevelDefinition: LevelDefinition = {
  titleKey: 'shell.level.testTitle',
  consentKey: 'shell.level.testConsent',
  component: lazy(() => import('./TestLevel')),
}
