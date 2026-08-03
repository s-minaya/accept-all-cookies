import { createRng } from '../../utils/prng'

export type Phase = 'agree' | 'trap' | 'restored'
export type ClickOutcome = 'progress' | 'win' | 'lose'

export interface AcceptAllState {
  /** 0-100. Nunca llega a 100 por `click()` — solo la victoria lo fuerza (GDD Nivel 12: "es puro teatro"). */
  progress: number
  clicks: number
  phase: Phase
  /** ms transcurridos desde la última pulsación: alimenta tanto el decaimiento (cada `DECAY_INTERVAL_MS`) como la restauración desde `trap` (a los `RESTORE_MS`). */
  sinceLastClick: number
  /** Pulsación en la que el botón protagonista se convierte en Disagree, sorteada al montar. */
  switchAt: number
}

/** GDD §14: sube "muy poco" por clic. */
export const CLICK_INCREMENT = 3
/** Techo que ni una ráfaga de clics interminable puede cruzar — la barra es teatro, nunca se completa sola (test de series largas). */
export const TEASE_CEILING = 90
/** GDD §14: decae "una pequeña cantidad" cada medio segundo sin pulsar. */
export const DECAY_AMOUNT = 1
export const DECAY_INTERVAL_MS = 500
/** GDD §14: tiempo sin pulsar en `trap` para volver a `agree`. */
export const RESTORE_MS = 2000
export const SWITCH_AT_MIN = 15
export const SWITCH_AT_MAX = 35

/** Sortea la pulsación de la trampa en [15, 35] con el PRNG compartido (008-plan.md). */
export function createSwitchAt(seed: number): number {
  const rng = createRng(seed)
  return SWITCH_AT_MIN + Math.floor(rng() * (SWITCH_AT_MAX - SWITCH_AT_MIN + 1))
}

export function createAcceptAllState(switchAt: number): AcceptAllState {
  return { progress: 0, clicks: 0, phase: 'agree', sinceLastClick: 0, switchAt }
}

/**
 * Reloj puro (015-plan.md, patrón `typewriter.ts`): decae la barra en pasos
 * discretos de `DECAY_INTERVAL_MS` (nunca por debajo de 0) y, si `trap` lleva
 * `RESTORE_MS` sin una pulsación, pasa a `restored` — el mismo acumulador
 * `sinceLastClick` sirve para las dos cosas, tal como pide 016-plan.md.
 *
 * `sinceLastClick` crece sin reducirse por módulo (a diferencia de un
 * acumulador de ciclo típico, 013-plan.md): la restauración necesita el
 * total completo desde la última pulsación (hasta `RESTORE_MS`, 2 s), no
 * solo el resto tras el último paso de decaimiento. Los pasos de
 * decaimiento NUEVOS en este tick se calculan comparando la división entera
 * antes/después, así un rAF real (deltas de ~16 ms, muchísimos ticks antes
 * de llegar a los 2 s) decae y restaura exactamente igual que un solo tick
 * grande — cubierto explícitamente en los tests, porque no lo estaba.
 */
export function tickAcceptAll(state: AcceptAllState, deltaMs: number): AcceptAllState {
  const previousDecaySteps = Math.floor(state.sinceLastClick / DECAY_INTERVAL_MS)
  const sinceLastClick = state.sinceLastClick + deltaMs
  const newDecaySteps = Math.floor(sinceLastClick / DECAY_INTERVAL_MS) - previousDecaySteps
  const progress = Math.max(0, state.progress - newDecaySteps * DECAY_AMOUNT)
  const phase: Phase =
    state.phase === 'trap' && sinceLastClick >= RESTORE_MS ? 'restored' : state.phase

  return { ...state, progress, sinceLastClick, phase }
}

/**
 * Procesa una pulsación del botón protagonista (016-plan.md, "Decisiones":
 * el cambio ocurre EN la pulsación `switchAt`, no en la siguiente — esa
 * misma pulsación cuenta como progreso normal, y es la pulsación
 * `switchAt + 1` la que cae en la trampa ya visible).
 */
export function clickAcceptAll(state: AcceptAllState): {
  state: AcceptAllState
  outcome: ClickOutcome
} {
  const clicks = state.clicks + 1

  if (state.phase === 'trap') {
    return { state: { ...state, clicks, sinceLastClick: 0 }, outcome: 'lose' }
  }

  if (state.phase === 'restored') {
    return { state: { ...state, clicks, progress: 100, sinceLastClick: 0 }, outcome: 'win' }
  }

  const progress = Math.min(TEASE_CEILING, state.progress + CLICK_INCREMENT)
  const phase: Phase = clicks === state.switchAt ? 'trap' : 'agree'
  return { state: { ...state, clicks, progress, phase, sinceLastClick: 0 }, outcome: 'progress' }
}
