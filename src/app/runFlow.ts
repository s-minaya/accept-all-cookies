export type RunFlowResult = 'win' | 'lose'

export type RunFlowPhase = 'playing' | 'verdict' | 'modal' | 'select'

export interface RunFlowState {
  phase: RunFlowPhase
  result: RunFlowResult | null
}

export const INITIAL_RUN_FLOW_STATE: RunFlowState = { phase: 'playing', result: null }

export type RunFlowEvent =
  | { type: 'OUTCOME'; result: RunFlowResult }
  | { type: 'VERDICT_DONE' }
  | { type: 'MODAL_ACTION' }
  | { type: 'RESTART' }

/**
 * Máquina de estados pura del meta-flujo: `playing → verdict → modal → select`.
 * Vive en el shell (no en los niveles), que la usa para decidir cuándo el
 * contador corre, cuándo el nivel está `paused` y cuándo se muestran
 * `GiantVerdict` / la modal de veredicto.
 *
 * Solo la fase `playing` acepta `OUTCOME`: si el contador llega a 0 y el
 * jugador pulsa un botón en el mismo instante, la primera transición que
 * llega gana y la segunda se ignora, sin lógica adicional de desempate.
 */
export function runFlowReducer(state: RunFlowState, event: RunFlowEvent): RunFlowState {
  switch (event.type) {
    case 'OUTCOME':
      if (state.phase !== 'playing') return state
      return { phase: 'verdict', result: event.result }
    case 'VERDICT_DONE':
      if (state.phase !== 'verdict') return state
      return { phase: 'modal', result: state.result }
    case 'MODAL_ACTION':
      if (state.phase !== 'modal') return state
      return { phase: 'select', result: state.result }
    case 'RESTART':
      return INITIAL_RUN_FLOW_STATE
    default:
      return state
  }
}

/** El nivel está congelado (sin animaciones propias ni input) en cualquier fase que no sea `playing`. */
export function isLevelPaused(state: RunFlowState): boolean {
  return state.phase !== 'playing'
}

/** El contador del nivel solo corre durante `playing`. */
export function isCounterRunning(state: RunFlowState): boolean {
  return state.phase === 'playing'
}
