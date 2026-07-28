import type { ReelSymbol } from './reels'

export const REEL_COUNT = 3

export type ReelState = { status: 'spinning' } | { status: 'stopped'; symbol: ReelSymbol }

export type Phase = 'playing' | 'respinPause'

export interface SlotMachineState {
  reels: readonly [ReelState, ReelState, ReelState]
  phase: Phase
}

function spinningReels(): [ReelState, ReelState, ReelState] {
  return [{ status: 'spinning' }, { status: 'spinning' }, { status: 'spinning' }]
}

export function createInitialState(): SlotMachineState {
  return { reels: spinningReels(), phase: 'playing' }
}

/**
 * Casilla resultante al parar un rodillo en `offset` (posición de scroll en
 * unidades de "casillas", cíclico): encaje a la más cercana — el punto
 * medio exacto entre dos casillas redondea hacia arriba (comportamiento
 * estándar de `Math.round`, determinista). GDD: "se detiene inmediatamente
 * en la posición actual; el botón visible en el centro es el resultado".
 */
export function offsetToIndex(offset: number, reelLength: number): number {
  const rounded = Math.round(offset)
  return ((rounded % reelLength) + reelLength) % reelLength
}

export type StopOutcome = 'won' | 'lost' | 'respin' | null

export interface StopResult {
  state: SlotMachineState
  outcome: StopOutcome
}

function symbolOf(reel: ReelState): ReelSymbol | null {
  return reel.status === 'stopped' ? reel.symbol : null
}

/**
 * Para un rodillo con su símbolo ya resuelto (el llamador combina
 * `offsetToIndex` con la tira del rodillo para obtenerlo — esta función no
 * conoce tiras, solo símbolos, así se puede testear en aislamiento total).
 * No-op (outcome `null`) si la fase no es `playing`, si el rodillo no
 * existe o si ya estaba parado — parar dos veces el mismo rodillo, o parar
 * durante la pausa de rehabilitación, no hace nada.
 *
 * Con los tres parados evalúa el resultado: triple Agree → `won`; triple
 * Disagree → `lost` (derrota inmediata, sin rehabilitación — GDD Nivel 5,
 * excepción explícita a la regla de rehabilitación); cualquier otra
 * combinación → `respin` (pasa a `respinPause`, ver `completeRespin`).
 */
export function stopReel(
  state: SlotMachineState,
  reelIndex: number,
  symbol: ReelSymbol,
): StopResult {
  if (state.phase !== 'playing') return { state, outcome: null }
  const current = state.reels[reelIndex]
  if (!current || current.status === 'stopped') return { state, outcome: null }

  const nextReels = [...state.reels] as [ReelState, ReelState, ReelState]
  nextReels[reelIndex] = { status: 'stopped', symbol }

  const resolvedSymbols = nextReels.map(symbolOf)
  if (resolvedSymbols.includes(null)) {
    return { state: { ...state, reels: nextReels }, outcome: null }
  }
  const symbols = resolvedSymbols as ReelSymbol[]
  const allAgree = symbols.every((s) => s === 'agree')
  const allDisagree = symbols.every((s) => s === 'disagree')

  if (allAgree) return { state: { ...state, reels: nextReels }, outcome: 'won' }
  if (allDisagree) return { state: { ...state, reels: nextReels }, outcome: 'lost' }
  return { state: { reels: nextReels, phase: 'respinPause' }, outcome: 'respin' }
}

/** Fin de la pausa de rehabilitación: los tres rodillos vuelven a girar. No-op si la fase no es `respinPause`. */
export function completeRespin(state: SlotMachineState): SlotMachineState {
  if (state.phase !== 'respinPause') return state
  return { phase: 'playing', reels: spinningReels() }
}
