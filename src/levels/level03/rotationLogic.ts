import type { Point } from '../../hooks/pointerLogic'

/**
 * Ángulo (grados) del punto respecto al centro, en el mismo sentido que
 * `transform: rotate()` de CSS (positivo = horario, con Y creciendo hacia
 * abajo como en pantalla): 0° apunta a la derecha del centro.
 */
export function angleFromCenterDeg(point: Point, center: Point): number {
  const radians = Math.atan2(point.y - center.y, point.x - center.x)
  return (radians * 180) / Math.PI
}

/**
 * Normaliza un delta angular al rango (−180°, 180°]. `atan2` salta de +180°
 * a −180° al cruzar ese borde; sin normalizar, un arrastre que cruza ese
 * punto produciría un brinco de ~360° en vez de un giro continuo.
 */
export function normalizeAngleDelta(deltaDeg: number): number {
  let normalized = deltaDeg % 360
  if (normalized > 180) normalized -= 360
  if (normalized <= -180) normalized += 360
  return normalized
}

/**
 * Rotación acumulada de la ventana tras una nueva lectura del ángulo del
 * puntero: 1:1 con el arrastre, sin inercia (007-plan.md, "Decisiones"). No
 * está acotada a ±360° a propósito — la ventana gira libremente en ambos
 * sentidos y el valor crudo en grados es válido para `rotate()` sea cual
 * sea su magnitud.
 */
export function accumulateRotation(
  previousRotationDeg: number,
  previousAngleDeg: number,
  currentAngleDeg: number,
): number {
  return previousRotationDeg + normalizeAngleDelta(currentAngleDeg - previousAngleDeg)
}
