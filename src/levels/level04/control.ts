/** Velocidad del botón grande por teclado, en px lógicos/segundo (GDD §14, ajustable). */
export const KEYBOARD_PADDLE_SPEED = 300

export type KeyboardDirection = -1 | 0 | 1

/** Limita la X del botón grande para que no se salga de la guía por ningún lado. */
export function clampPaddleX(x: number, paddleHalfWidth: number, canvasWidth: number): number {
  const min = paddleHalfWidth
  const max = canvasWidth - paddleHalfWidth
  if (min > max) return canvasWidth / 2 // guía más estrecha que el botón: lo centra en vez de romper el clamp
  return Math.min(max, Math.max(min, x))
}

/** Avanza la X deseada un paso de teclado (← = -1, → = 1, sin tecla = 0); el clamping es responsabilidad de quien la use después. */
export function stepKeyboardX(
  currentX: number,
  direction: KeyboardDirection,
  dtSeconds: number,
  speed: number = KEYBOARD_PADDLE_SPEED,
): number {
  return currentX + direction * speed * dtSeconds
}
