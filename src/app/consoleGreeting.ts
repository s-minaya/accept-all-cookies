/**
 * Guiño para quien abre DevTools (017-plan.md, bloque C) — no forma parte de
 * la UI del juego, así que va en inglés fijo a propósito (es lo que espera
 * quien mira la consola) y no pasa por `useT()`: es la misma excepción que
 * el nivel de prueba, texto que ningún jugador ve jamás en pantalla.
 * Revela `?dev` como puerta secreta, en el mismo tono cómplice del resto del
 * juego (créditos, chiste de las cookies).
 */
export function printConsoleGreeting(): void {
  console.log('%cAccept All Cookies', 'font-size: 20px; font-weight: bold; color: #2451e0;')
  console.log(
    "%cLooking for the source? It's all yours, minified but unobfuscated — this is a game about dark patterns, not one of them.",
    'font-size: 12px; color: #345779;',
  )
  console.log(
    '%cPsst. Add ?dev to the URL for a "skip level" button. We see you, fellow programmer.',
    'font-size: 12px; color: #7cbf89;',
  )
}
