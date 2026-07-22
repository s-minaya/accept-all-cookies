export interface Point {
  x: number
  y: number
}

export type Gesture = 'tap' | 'drag'

export interface StillnessState {
  anchor: Point
  since: number
}

export const DEFAULT_DRAG_THRESHOLD_PX = 8

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Clasifica un gesto de puntero terminado según cuánto se alejó de su punto de partida. */
export function classifyGesture(
  start: Point,
  end: Point,
  threshold: number = DEFAULT_DRAG_THRESHOLD_PX,
): Gesture {
  return distance(start, end) > threshold ? 'drag' : 'tap'
}

/**
 * Alimenta el detector de quietud con una nueva muestra del puntero.
 * Mientras el puntero se mantenga dentro de `jitterThreshold` respecto al
 * ancla actual, se conserva `since` (se considera que sigue quieto); si se
 * mueve más, se reinicia el ancla y el reloj.
 */
export function updateStillness(
  state: StillnessState | null,
  point: Point,
  now: number,
  jitterThreshold: number = DEFAULT_DRAG_THRESHOLD_PX,
): StillnessState {
  if (state && distance(state.anchor, point) <= jitterThreshold) {
    return state
  }
  return { anchor: point, since: now }
}

/** Si el puntero lleva quieto en su ancla actual al menos `durationMs`. */
export function isStill(state: StillnessState | null, now: number, durationMs: number): boolean {
  if (!state) return false
  return now - state.since >= durationMs
}
