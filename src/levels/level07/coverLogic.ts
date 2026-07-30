export interface Point {
  x: number
  y: number
}

export interface ClampOffsetInput {
  /** Desplazamiento propuesto (`transform: translate`) desde la posición de reposo, en px. */
  x: number
  y: number
  /** Desplazamiento máximo permitido en cada eje, en px (011-plan.md, corregido: la cubierta se desplaza DENTRO de su propio hueco, nunca hacia la ventana). */
  maxOffsetX: number
  maxOffsetY: number
}

/**
 * Limita el desplazamiento propuesto de la cubierta a ± el máximo permitido
 * en cada eje (revisión de Sofía: "debe arrastrarse DENTRO del espacio del
 * mismo botón... no debe salirse hacia la ventana" — el hueco que la
 * contiene recorta, `overflow: hidden`, lo que se salga de ese rango; este
 * clamp solo evita que el número crezca sin sentido). Pura: sin referencias
 * al DOM, solo aritmética.
 */
export function clampCoverOffset({ x, y, maxOffsetX, maxOffsetY }: ClampOffsetInput): Point {
  return {
    x: Math.min(Math.max(x, -maxOffsetX), maxOffsetX),
    y: Math.min(Math.max(y, -maxOffsetY), maxOffsetY),
  }
}
