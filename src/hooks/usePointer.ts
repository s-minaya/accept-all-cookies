import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  classifyGesture,
  isStill,
  updateStillness,
  type Point,
  type StillnessState,
} from './pointerLogic'

export interface UsePointerOptions {
  /** Distance in px past which a gesture counts as a drag instead of a tap. */
  dragThreshold?: number
  /** How long the pointer must rest before `onStill` fires. Omit to disable stillness tracking. */
  stillnessMs?: number
  onTap?: (point: Point) => void
  onDragStart?: (point: Point) => void
  onDragMove?: (point: Point) => void
  onDragEnd?: (point: Point) => void
  onStill?: (point: Point) => void
}

export interface UsePointerResult {
  isPressed: boolean
  position: Point | null
}

function toLocalPoint(event: PointerEvent, element: HTMLElement): Point {
  const rect = element.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

/**
 * Unified mouse/touch input via Pointer Events. Levels must consume input
 * through this hook instead of listening to mouse events directly (AGENTS.md).
 */
export function usePointer(
  ref: RefObject<HTMLElement | null>,
  options: UsePointerOptions = {},
): UsePointerResult {
  const [isPressed, setIsPressed] = useState(false)
  const [position, setPosition] = useState<Point | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const startPointRef = useRef<Point | null>(null)
  const draggingRef = useRef(false)
  const stillnessRef = useRef<StillnessState | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const stopStillnessLoop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      stillnessRef.current = null
    }

    const runStillnessLoop = () => {
      const { stillnessMs, onStill } = optionsRef.current
      if (!stillnessMs || !startPointRef.current) return

      const tick = () => {
        const point = startPointRef.current
        if (!point) return
        const now = performance.now()
        stillnessRef.current = updateStillness(stillnessRef.current, point, now)
        if (isStill(stillnessRef.current, now, stillnessMs)) {
          onStill?.(point)
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    const handlePointerDown = (event: PointerEvent) => {
      element.setPointerCapture(event.pointerId)
      const point = toLocalPoint(event, element)
      startPointRef.current = point
      draggingRef.current = false
      setIsPressed(true)
      setPosition(point)
      runStillnessLoop()
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!startPointRef.current) return
      const point = toLocalPoint(event, element)
      setPosition(point)

      const { dragThreshold } = optionsRef.current
      const gesture = classifyGesture(startPointRef.current, point, dragThreshold)
      if (gesture === 'drag') {
        if (!draggingRef.current) {
          draggingRef.current = true
          optionsRef.current.onDragStart?.(startPointRef.current)
        }
        optionsRef.current.onDragMove?.(point)
      }
    }

    const handlePointerUp = (event: PointerEvent) => {
      const point = toLocalPoint(event, element)
      const start = startPointRef.current

      if (start) {
        const { dragThreshold } = optionsRef.current
        const gesture = classifyGesture(start, point, dragThreshold)
        if (gesture === 'drag' && draggingRef.current) {
          optionsRef.current.onDragEnd?.(point)
        } else {
          optionsRef.current.onTap?.(point)
        }
      }

      startPointRef.current = null
      draggingRef.current = false
      setIsPressed(false)
      stopStillnessLoop()
    }

    element.addEventListener('pointerdown', handlePointerDown)
    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerup', handlePointerUp)
    element.addEventListener('pointercancel', handlePointerUp)

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerUp)
      stopStillnessLoop()
    }
  }, [ref])

  return { isPressed, position }
}
