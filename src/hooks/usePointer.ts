import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  classifyGesture,
  isStill,
  updateStillness,
  type Point,
  type StillnessState,
} from './pointerLogic'

export interface UsePointerOptions {
  /** Distancia en px a partir de la cual un gesto cuenta como arrastre en vez de toque. */
  dragThreshold?: number
  /**
   * Cuánto debe permanecer quieto el puntero antes de que se dispare
   * `onStill`. Omitir para desactivar esta detección. A diferencia del resto
   * de callbacks, NO depende de que haya un `pointerdown` activo: en ratón
   * se sigue el simple posado (hover) sin pulsar nada, en táctil hace falta
   * mantener el dedo apoyado — así es como llega naturalmente `pointerenter`
   * (al entrar en contacto) y `pointerleave` (al levantar o salirse) para
   * cada tipo de puntero, sin distinguir `pointerType` a mano (nivel 9,
   * 013-plan.md).
   */
  stillnessMs?: number
  onTap?: (point: Point) => void
  /**
   * Se dispara de forma síncrona en el propio `pointerdown`, antes de
   * cualquier clasificación tap/arrastre y antes de que pueda correr ningún
   * temporizador o `rAF` pendiente (nivel 9, corrección de playtesting:
   * "el jugador toca el Agree, se ve pulsado, pero no gana" en móvil). Sirve
   * para resolver contra el estado que había EXACTAMENTE en el instante del
   * toque, en vez de esperar al `click` sintetizado — que en táctil llega
   * más tarde y puede perder la carrera contra un temporizador que borra el
   * contenido que había bajo el dedo (p. ej. un ciclo del nivel 9) antes de
   * que el `click` llegue a dispararse.
   */
  onDown?: (point: Point) => void
  onDragStart?: (point: Point) => void
  onDragMove?: (point: Point) => void
  onDragEnd?: (point: Point) => void
  /** Se dispara en cada fotograma en que el puntero lleva quieto `stillnessMs` o más (no una sola vez: el llamador decide si ya había reaccionado). */
  onStill?: (point: Point) => void
  /** Se dispara una vez, en el fotograma en que un puntero que estaba quieto se mueve más allá del umbral de jitter (`dragThreshold`) y deja de estarlo. */
  onUnstill?: () => void
  /**
   * Se dispara en CADA `pointermove` sobre el elemento, sin esperar a un
   * `pointerdown` previo ni pasar por la clasificación tap-vs-drag (nivel 4:
   * el botón grande del Plinko sigue el ratón en hover, sin necesidad de
   * pulsar — GDD "Ratón: sigue la X del puntero"). Para un puntero táctil
   * esto no cambia nada en la práctica: no puede haber `pointermove` sin
   * contacto previo, así que equivale a "arrastrando el dedo".
   */
  onMove?: (point: Point) => void
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
 * Entrada unificada de ratón/táctil vía Pointer Events. Los niveles deben
 * consumir la entrada a través de este hook en vez de escuchar eventos de
 * ratón directamente (AGENTS.md).
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
  const pointerIdRef = useRef<number | null>(null)

  // Detección de quietud (nivel 9, 013-plan.md): estado propio, separado del
  // de arrastre — sigue el punto VIVO del puntero (se actualiza en cada
  // `pointermove`/`pointerenter`/`pointerdown`), no el punto fijo de inicio
  // de un gesto de arrastre. El bucle corre mientras el puntero esté
  // "presente" sobre el elemento (entre `pointerenter` y
  // `pointerleave`/`pointerup`/`pointercancel`), no solo mientras esté
  // pulsado.
  const livePointRef = useRef<Point | null>(null)
  const stillnessRef = useRef<StillnessState | null>(null)
  const wasStillRef = useRef(false)
  const stillnessRafRef = useRef<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const stopStillnessLoop = () => {
      if (stillnessRafRef.current !== null) {
        cancelAnimationFrame(stillnessRafRef.current)
        stillnessRafRef.current = null
      }
      // Perder el contacto/hover SIEMPRE cierra el episodio de quietud en
      // curso — si no, un toque táctil que se congela y luego se levanta
      // SIN pulsar (el jugador solo aparta el dedo) deja `onUnstill` sin
      // disparar nunca: el nivel 9 se quedaría con esa casilla "congelada"
      // para siempre y, peor, bloqueada para congelar ninguna otra (bug
      // real, encontrado con Playwright al simular un toque mantenido).
      if (wasStillRef.current) optionsRef.current.onUnstill?.()
      livePointRef.current = null
      stillnessRef.current = null
      wasStillRef.current = false
    }

    const runStillnessLoop = () => {
      if (!optionsRef.current.stillnessMs || stillnessRafRef.current !== null) return

      const tick = () => {
        const { stillnessMs, onStill, onUnstill, dragThreshold } = optionsRef.current
        const point = livePointRef.current
        if (stillnessMs && point) {
          const now = performance.now()
          stillnessRef.current = updateStillness(stillnessRef.current, point, now, dragThreshold)
          const nowStill = isStill(stillnessRef.current, now, stillnessMs)
          if (nowStill) onStill?.(point)
          else if (wasStillRef.current) onUnstill?.()
          wasStillRef.current = nowStill
        }
        stillnessRafRef.current = requestAnimationFrame(tick)
      }
      stillnessRafRef.current = requestAnimationFrame(tick)
    }

    const handlePointerEnter = (event: PointerEvent) => {
      livePointRef.current = toLocalPoint(event, element)
      runStillnessLoop()
    }

    const handlePointerLeave = () => {
      stopStillnessLoop()
    }

    const handlePointerDown = (event: PointerEvent) => {
      // Captura DIFERIDA (no aquí, en pointerdown): capturar de inmediato
      // retargeta también el `click` nativo del navegador al elemento
      // capturador, así que un simple tap sobre un botón anidado (p. ej. el
      // Agree/Disagree de un nivel que engancha `usePointer` sobre toda la
      // ventana para detectar arrastres, nivel 3) nunca dispararía su
      // `onClick` — bug real, detectado con Playwright en la 007. Por eso la
      // captura se adquiere solo al confirmarse un arrastre de verdad (más
      // abajo, junto a `onDragStart`), nunca en un tap.
      startPointRef.current = toLocalPoint(event, element)
      draggingRef.current = false
      pointerIdRef.current = event.pointerId
      setIsPressed(true)
      setPosition(startPointRef.current)
      livePointRef.current = startPointRef.current
      runStillnessLoop()
      optionsRef.current.onDown?.(startPointRef.current)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const point = toLocalPoint(event, element)
      livePointRef.current = point
      optionsRef.current.onMove?.(point)

      if (!startPointRef.current) return
      setPosition(point)

      const { dragThreshold } = optionsRef.current
      const gesture = classifyGesture(startPointRef.current, point, dragThreshold)
      if (gesture === 'drag') {
        if (!draggingRef.current) {
          draggingRef.current = true
          if (pointerIdRef.current !== null) element.setPointerCapture(pointerIdRef.current)
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

      if (
        draggingRef.current &&
        pointerIdRef.current !== null &&
        element.hasPointerCapture(pointerIdRef.current)
      ) {
        element.releasePointerCapture(pointerIdRef.current)
      }
      startPointRef.current = null
      draggingRef.current = false
      pointerIdRef.current = null
      setIsPressed(false)
      stopStillnessLoop()
    }

    element.addEventListener('pointerenter', handlePointerEnter)
    element.addEventListener('pointerleave', handlePointerLeave)
    element.addEventListener('pointerdown', handlePointerDown)
    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerup', handlePointerUp)
    element.addEventListener('pointercancel', handlePointerUp)

    return () => {
      element.removeEventListener('pointerenter', handlePointerEnter)
      element.removeEventListener('pointerleave', handlePointerLeave)
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerUp)
      stopStillnessLoop()
    }
  }, [ref])

  return { isPressed, position }
}
