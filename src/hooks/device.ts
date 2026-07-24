/**
 * Dispositivo de entrada táctil (móvil/tablet) frente a ratón (escritorio);
 * no depende del ancho de pantalla (GDD §14). Compartido por `AudioManager`
 * (multiplicador de volumen de la música) y el nivel 3 (población de la
 * lluvia — AGENTS.md: si un patrón aparece en 2+ sitios, se extrae).
 */
export function isCoarsePointerDevice(): boolean {
  return window.matchMedia?.('(pointer: coarse)')?.matches === true
}
