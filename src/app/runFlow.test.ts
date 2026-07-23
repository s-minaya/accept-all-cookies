import { describe, expect, it } from 'vitest'
import {
  INITIAL_RUN_FLOW_STATE,
  isCounterRunning,
  isLevelPaused,
  runFlowReducer,
  type RunFlowState,
} from './runFlow'

describe('runFlowReducer', () => {
  it('starts in playing, with the counter running and the level unpaused', () => {
    expect(INITIAL_RUN_FLOW_STATE).toEqual({ phase: 'playing', result: null })
    expect(isCounterRunning(INITIAL_RUN_FLOW_STATE)).toBe(true)
    expect(isLevelPaused(INITIAL_RUN_FLOW_STATE)).toBe(false)
  })

  it('goes playing → verdict → modal → select on a win', () => {
    let state = INITIAL_RUN_FLOW_STATE
    state = runFlowReducer(state, { type: 'OUTCOME', result: 'win' })
    expect(state).toEqual({ phase: 'verdict', result: 'win' })
    expect(isLevelPaused(state)).toBe(true)
    expect(isCounterRunning(state)).toBe(false)

    state = runFlowReducer(state, { type: 'VERDICT_DONE' })
    expect(state).toEqual({ phase: 'modal', result: 'win' })

    state = runFlowReducer(state, { type: 'MODAL_ACTION' })
    expect(state).toEqual({ phase: 'select', result: 'win' })
  })

  it('goes playing → verdict → modal → select on a loss, keeping the lose result throughout', () => {
    let state = INITIAL_RUN_FLOW_STATE
    state = runFlowReducer(state, { type: 'OUTCOME', result: 'lose' })
    state = runFlowReducer(state, { type: 'VERDICT_DONE' })
    state = runFlowReducer(state, { type: 'MODAL_ACTION' })
    expect(state).toEqual({ phase: 'select', result: 'lose' })
  })

  it('RESTART returns to the initial playing state from any phase', () => {
    const modalState: RunFlowState = { phase: 'modal', result: 'lose' }
    expect(runFlowReducer(modalState, { type: 'RESTART' })).toEqual(INITIAL_RUN_FLOW_STATE)
  })

  it('ignores a second OUTCOME that arrives after the first one already transitioned out of playing (contador a 0 y acción del jugador en el mismo instante)', () => {
    const afterFirstOutcome = runFlowReducer(INITIAL_RUN_FLOW_STATE, {
      type: 'OUTCOME',
      result: 'lose',
    })

    // El contador llega a 0 en el mismo instante en que el nivel ya reportó un win: la
    // primera transición (lose) ya movió la fase a "verdict", así que el segundo evento
    // se descarta y el resultado se mantiene en "lose".
    const afterRaceEvent = runFlowReducer(afterFirstOutcome, { type: 'OUTCOME', result: 'win' })

    expect(afterRaceEvent).toEqual({ phase: 'verdict', result: 'lose' })
  })

  it('ignores VERDICT_DONE outside of the verdict phase', () => {
    expect(runFlowReducer(INITIAL_RUN_FLOW_STATE, { type: 'VERDICT_DONE' })).toEqual(
      INITIAL_RUN_FLOW_STATE,
    )
  })

  it('ignores MODAL_ACTION outside of the modal phase', () => {
    const verdictState: RunFlowState = { phase: 'verdict', result: 'win' }
    expect(runFlowReducer(verdictState, { type: 'MODAL_ACTION' })).toEqual(verdictState)
  })

  it('pauses the level in verdict, modal and select, and only runs the counter in playing', () => {
    const phases: RunFlowState[] = [
      { phase: 'playing', result: null },
      { phase: 'verdict', result: 'win' },
      { phase: 'modal', result: 'win' },
      { phase: 'select', result: 'win' },
    ]

    expect(phases.map(isCounterRunning)).toEqual([true, false, false, false])
    expect(phases.map(isLevelPaused)).toEqual([false, true, true, true])
  })
})
