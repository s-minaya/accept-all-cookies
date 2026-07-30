export interface CameraInput {
  /** Columna de la llave, en el mismo sistema de coordenadas que `totalCols` (010-plan.md: si el tablero incluye el anillo decorativo en el scroll, súmalo aquí también). */
  keyCol: number
  cellSizePx: number
  viewportWidthPx: number
  /** Ancho total del contenido que hace scroll, en columnas (tablero jugable + anillo si lo incluye). */
  totalCols: number
}

/**
 * Desplazamiento horizontal (px) que centra la llave en la ventana de
 * cámara, limitado a los bordes del contenido — nunca deja ver "vacío" más
 * allá del tablero (010-plan.md: "cámara solo horizontal... clamping puro
 * con test"). Puro: el render (`Board.tsx`) la aplica como
 * `translateX(-offset)` con una transición CSS suave.
 */
export function cameraOffsetX({
  keyCol,
  cellSizePx,
  viewportWidthPx,
  totalCols,
}: CameraInput): number {
  const keyCenterPx = (keyCol + 0.5) * cellSizePx
  const totalWidthPx = totalCols * cellSizePx
  const ideal = keyCenterPx - viewportWidthPx / 2
  const maxOffset = Math.max(totalWidthPx - viewportWidthPx, 0)
  return Math.min(Math.max(ideal, 0), maxOffset)
}
