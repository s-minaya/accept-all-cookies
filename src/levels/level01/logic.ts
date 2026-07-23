import { LEVEL_DURATION_SECONDS } from '../types'

/** El Agree tarda en aparecer 7s desde que empieza el nivel (GDD Nivel 1). */
export const AGREE_APPEAR_DELAY_SECONDS = 7

/**
 * Derivado del contador del shell (`timeLeft`), nunca de un timer propio del
 * nivel: así `paused` congela el plazo gratis (el contador no avanza) y un
 * reinicio lo resetea gratis (al remontar, `timeLeft` vuelve a valer 100).
 */
export function isAgreeVisible(timeLeft: number): boolean {
  const elapsed = LEVEL_DURATION_SECONDS - timeLeft
  return elapsed >= AGREE_APPEAR_DELAY_SECONDS
}

export type Level01Phase = 'playing' | 'errorDialog'

export type Level01Event = { type: 'DISAGREE' }

/**
 * Máquina de estados pura del nivel 1: pulsar Disagree abre el diálogo de
 * error, nunca es derrota (GDD Nivel 1, excepción a la regla general). El
 * reinicio tras pulsar OK del diálogo no es un evento de esta máquina: lo
 * resuelve `onRestart`, que remonta el componente entero (fase de vuelta a
 * "playing" gratis, sin código de reset manual).
 */
export function level01Reducer(phase: Level01Phase, event: Level01Event): Level01Phase {
  if (event.type === 'DISAGREE' && phase === 'playing') return 'errorDialog'
  return phase
}
