import type { ShuffleScript } from './shuffle'

export type LevelPhase = 'reveal' | 'flip' | 'shuffling' | 'choosing' | 'revealChoice' | 'done'

/**
 * Solo `reveal` (elegir el Agree visible o un Disagree) y `choosing` (elegir
 * a ciegas tras el barajado) aceptan pulsaciones (GDD Nivel 8, "Durante los
 * barajados el jugador NO puede clicar"; 012-spec.md, criterios de
 * aceptación). `revealChoice` (el botón elegido dándose la vuelta antes del
 * veredicto, corrección de playtesting) tampoco acepta clics, igual que
 * `flip`/`shuffling`: es la misma familia de "animación en curso, el jugador
 * ya no puede cambiar nada".
 */
export function canAcceptClick(phase: LevelPhase): boolean {
  return phase === 'reveal' || phase === 'choosing'
}

export interface FlipSegment {
  kind: 'flip'
  durationMs: number
}

export interface ShufflingSegment {
  kind: 'shuffling'
  roundIndex: number
  durationMs: number
}

export type Segment = FlipSegment | ShufflingSegment

/**
 * Traduce el guion ya generado (`shuffle.ts`) a la secuencia de segmentos
 * con duración que reproduce `phaseClock.ts`: el flip primero, luego las 3
 * rondas en el orden del guion. Pura — el guion ya decidió todo, esto solo
 * cambia de forma.
 */
export function buildSegments(script: ShuffleScript, flipDurationMs: number): Segment[] {
  return [
    { kind: 'flip', durationMs: flipDurationMs },
    ...script.rounds.map((round, roundIndex): ShufflingSegment => ({
      kind: 'shuffling',
      roundIndex,
      durationMs: round.durationMs,
    })),
  ]
}

/** La fase del nivel que corresponde a reproducir un segmento dado. */
export function phaseForSegment(segment: Segment): LevelPhase {
  return segment.kind
}
