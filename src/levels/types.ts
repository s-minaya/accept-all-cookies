import type { ComponentType, LazyExoticComponent } from 'react'

export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/** Los 12 niveles en orden, para recorrer el registro y la pantalla de selección. */
export const LEVEL_IDS: readonly LevelId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/** Cada nivel dura 100s (GDD §4.2, §14). Compartido por LevelHost y runStore (para reanudar tras recargar). */
export const LEVEL_DURATION_SECONDS = 100

/**
 * Por qué se perdió un nivel, decidido por `LevelHost` (timeout, botón X) o
 * por el propio nivel llamando a `onLose` (p. ej. botón incorrecto). Nunca
 * lo decide el shell leyendo el interior del nivel.
 */
export type LoseReason = 'timeout' | 'closed' | 'failed'

export interface LevelProps {
  onWin: () => void
  onLose: (reason: LoseReason) => void
  /** Segundos restantes del contador, propiedad del shell. Solo lectura: los niveles nunca controlan el temporizador. */
  timeLeft: number
  /** El shell congela el nivel (sin animaciones propias ni input) mientras se muestra un veredicto o una modal. El nivel sigue montado y visible. */
  paused: boolean
}

export type LevelComponent = ComponentType<LevelProps>

/** Todo lo que `LevelHost` necesita para montar un nivel sin conocer su contenido. */
export interface LevelDefinition {
  /** Clave i18n para el título de la ventana. */
  titleKey: string
  /** Clave i18n para el texto de consentimiento. */
  consentKey: string
  component: LazyExoticComponent<LevelComponent>
}
