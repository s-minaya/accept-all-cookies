import type { ComponentType, LazyExoticComponent } from 'react'

export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/** Every level lasts 100s (GDD §4.2, §14). Shared by LevelHost and runStore (resume-on-reload). */
export const LEVEL_DURATION_SECONDS = 100

/**
 * Why a level lost, decided by `LevelHost` (timeout, X button) or by the
 * level itself calling `onLose` (e.g. wrong button). Never decided by the
 * shell reading the level's internals.
 */
export type LoseReason = 'timeout' | 'closed' | 'failed'

export interface LevelProps {
  onWin: () => void
  onLose: (reason: LoseReason) => void
  /** Seconds left on the shell-owned countdown. Read-only: levels never control the timer. */
  timeLeft: number
}

export type LevelComponent = ComponentType<LevelProps>

/** Everything `LevelHost` needs to mount a level without knowing its content. */
export interface LevelDefinition {
  /** i18n key for the window title. */
  titleKey: string
  /** i18n key for the consent text box. */
  consentKey: string
  component: LazyExoticComponent<LevelComponent>
}
