/** Segmentos totales del botón grande (GDD §14). */
export const SEGMENT_COUNT = 6

export interface SegmentsState {
  agree: number
  disagree: number
}

export const INITIAL_SEGMENTS: SegmentsState = { agree: 0, disagree: 0 }

export type SegmentsOutcome = 'win' | 'lose' | null

/**
 * Máquina pura del botón de 6 segmentos (GDD Nivel 4, 008-plan.md): el
 * estado son solo los DOS contadores, nunca un array de 6 celdas — los
 * segmentos Agree siempre se pintan empaquetados a la izquierda y los
 * Disagree a la derecha (huecos, si los hay, en medio), así que la cuenta
 * basta para saber exactamente qué mostrar. Regla confirmada (coincide con
 * la prosa original del GDD; el ejemplo del GDD sí estaba mal y se corrigió
 * como tarea de esta feature):
 *
 * - Mientras haya huecos (`agree + disagree < SEGMENT_COUNT`), cada captura
 *   SOLO rellena un segmento de su propio color, sin tocar los del
 *   contrario.
 * - Con los 6 llenos, cada nueva captura SUSTITUYE un segmento del color
 *   contrario (nunca puede haber más de `SEGMENT_COUNT` segmentos a la vez).
 */
export function catchAgree(state: SegmentsState): SegmentsState {
  if (state.agree + state.disagree < SEGMENT_COUNT) {
    return { agree: state.agree + 1, disagree: state.disagree }
  }
  if (state.disagree === 0) return state // tablero lleno solo de Agree: ya se ganó, no hay nada que sustituir
  return { agree: state.agree + 1, disagree: state.disagree - 1 }
}

export function catchDisagree(state: SegmentsState): SegmentsState {
  if (state.agree + state.disagree < SEGMENT_COUNT) {
    return { agree: state.agree, disagree: state.disagree + 1 }
  }
  if (state.agree === 0) return state // tablero lleno solo de Disagree: ya se perdió, no hay nada que sustituir
  return { agree: state.agree - 1, disagree: state.disagree + 1 }
}

/** Victoria con los 6 Agree, derrota con los 6 Disagree; `null` mientras el tablero sigue en juego. */
export function getSegmentsOutcome(state: SegmentsState): SegmentsOutcome {
  if (state.agree === SEGMENT_COUNT) return 'win'
  if (state.disagree === SEGMENT_COUNT) return 'lose'
  return null
}

export type SegmentVariant = 'agree' | 'disagree' | 'empty'

/**
 * Qué debe pintar el segmento `index` (0..SEGMENT_COUNT-1): los Agree
 * siempre empaquetados a la izquierda, los Disagree a la derecha, huecos (si
 * los hay) en medio — se deriva de los dos contadores, nunca hace falta
 * guardar qué segmento concreto es cada uno.
 */
export function getSegmentVariant(state: SegmentsState, index: number): SegmentVariant {
  if (index < state.agree) return 'agree'
  if (index >= SEGMENT_COUNT - state.disagree) return 'disagree'
  return 'empty'
}
