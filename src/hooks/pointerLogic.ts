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

/** Classifies a completed pointer gesture by how far it travelled from its start point. */
export function classifyGesture(
  start: Point,
  end: Point,
  threshold: number = DEFAULT_DRAG_THRESHOLD_PX,
): Gesture {
  return distance(start, end) > threshold ? 'drag' : 'tap'
}

/**
 * Feeds a new pointer sample into the stillness tracker. While the pointer
 * stays within `jitterThreshold` of the current anchor, `since` is kept
 * (the pointer is considered to still be resting); moving further resets
 * the anchor and restarts the clock.
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

/** Whether the pointer has been resting at its current anchor for at least `durationMs`. */
export function isStill(state: StillnessState | null, now: number, durationMs: number): boolean {
  if (!state) return false
  return now - state.since >= durationMs
}
