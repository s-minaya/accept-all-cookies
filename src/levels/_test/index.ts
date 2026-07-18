import { lazy } from 'react'
import type { LevelDefinition } from '../types'

/** Deliberately outside the real game's registry (`levels/registry.ts`) — see AGENTS.md. */
export const testLevelDefinition: LevelDefinition = {
  titleKey: 'shell.level.testTitle',
  consentKey: 'shell.level.testConsent',
  component: lazy(() => import('./TestLevel')),
}
