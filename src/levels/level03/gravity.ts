export interface Vector2 {
  x: number
  y: number
}

/**
 * Vector de gravedad (magnitud 1) en el espacio LOCAL de la simulación
 * (antes de que la rotación CSS de la ventana lo lleve a pantalla), tal que
 * tras aplicar esa rotación el vector resultante siempre apunta hacia abajo
 * EN PANTALLA (007-plan.md: "es lo que hace creíble la rotación... gravedad
 * en coordenadas de pantalla, no del recuadro").
 *
 * Deriva de invertir la rotación de la ventana sobre "abajo en pantalla"
 * (0, 1): con el mismo convenio que `rotate()` de CSS (positivo = horario,
 * Y creciendo hacia abajo), el vector local es `(sin(rot), cos(rot))`.
 * Casos límite: 0° → (0, 1) recto hacia abajo; 90° → (1, 0) — un giro de 90°
 * horario de local-derecha cae exactamente en pantalla-abajo.
 */
export function gravityVectorForRotation(rotationDeg: number): Vector2 {
  const radians = (rotationDeg * Math.PI) / 180
  return { x: Math.sin(radians), y: Math.cos(radians) }
}
